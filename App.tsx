
import React, { useState, useEffect } from 'react';
import { Booking } from './types';
import { DEMO_BOOKINGS } from './constants';
import { checkCollision } from './utils';
import { api } from './api';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import CalendarView from './views/Calendar';
import RoomsList from './views/RoomsList';
import BookingsHistory from './views/BookingsHistory';
import BookingForm from './views/BookingForm';
import BookingDetails from './views/BookingDetails';
// Fix: Add missing Plus icon from lucide-react
import { Plus } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [initialRoomId, setInitialRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getBookings();
        setBookings(data);
      } catch (e) {
        console.error("Failed to load bookings", e);
        setError(e instanceof Error ? e.message : 'Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const handleOpenDetails = (booking: Booking) => {
    setViewingBooking(booking);
  };

  const handleEditBooking = (booking: Booking) => {
    setViewingBooking(null);
    setCurrentBooking(booking);
    setIsFormOpen(true);
  };

  const handleAddBooking = (date?: Date, roomId?: string) => {
    setViewingBooking(null);
    setCurrentBooking(null);
    setInitialDate(date || null);
    setInitialRoomId(roomId || null);
    setIsFormOpen(true);
  };

  const handleSaveBooking = async (newBooking: Booking) => {
    const collision = checkCollision(bookings, newBooking);
    if (collision) {
      alert(`Ошибка: На эти даты в этом номере уже есть бронь (${collision.guestName})`);
      return;
    }

    try {
      if (currentBooking) {
        await api.updateBooking(newBooking.id, newBooking);
      } else {
        await api.createBooking(newBooking);
      }

      // Reload bookings after save
      const updatedBookings = await api.getBookings();
      setBookings(updatedBookings);
      setIsFormOpen(false);
    } catch (e) {
      console.error("Failed to save booking", e);
      alert(e instanceof Error ? e.message : 'Failed to save booking');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await api.deleteBooking(id);

      // Reload bookings after delete
      const updatedBookings = await api.getBookings();
      setBookings(updatedBookings);
      setIsFormOpen(false);
      setViewingBooking(null);
    } catch (e) {
      console.error("Failed to delete booking", e);
      alert(e instanceof Error ? e.message : 'Failed to delete booking');
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      const bookingToUpdate = bookings.find(b => b.id === id);
      if (!bookingToUpdate) {
        throw new Error('Booking not found');
      }

      const updatedBooking = { ...bookingToUpdate, status };
      await api.updateBooking(id, updatedBooking);

      // Reload bookings after status update
      const updatedBookings = await api.getBookings();
      setBookings(updatedBookings);

      if (viewingBooking && viewingBooking.id === id) {
        setViewingBooking({ ...viewingBooking, status });
      }
    } catch (e) {
      console.error("Failed to update booking status", e);
      alert(e instanceof Error ? e.message : 'Failed to update booking status');
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard 
                  bookings={bookings} 
                  onOpenBooking={handleOpenDetails} 
                  onUpdateStatus={handleUpdateStatus} 
               />;
      case 'calendar':
        return <CalendarView 
                  bookings={bookings} 
                  onOpenBooking={handleOpenDetails} 
                  onAddBooking={handleAddBooking} 
               />;
      case 'rooms':
        return <RoomsList 
                  bookings={bookings} 
                  onOpenCalendar={(rid) => setActiveTab('calendar')} 
                  onAddBooking={(rid) => handleAddBooking(undefined, rid)}
                  onOpenBooking={handleOpenDetails}
               />;
      case 'bookings':
        return <BookingsHistory 
                  bookings={bookings} 
                  onOpenBooking={handleOpenDetails} 
               />;
      default:
        return <Dashboard bookings={bookings} onOpenBooking={handleOpenDetails} onUpdateStatus={handleUpdateStatus} />;
    }
  };

  return (
    <div className="h-full flex bg-[#f8fafc]">
      {/* Desktop Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 max-w-md md:max-w-full mx-auto md:mx-0 relative overflow-hidden md:overflow-visible">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f46e5] mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка данных...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                Перезагрузить
              </button>
            </div>
          </div>
        ) : (
          renderView()
        )}

        {/* Mobile Bottom Navigation */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {viewingBooking && (
          <BookingDetails
            booking={viewingBooking}
            onClose={() => setViewingBooking(null)}
            onEdit={handleEditBooking}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {isFormOpen && (
          <BookingForm
            booking={currentBooking}
            initialDate={initialDate}
            initialRoomId={initialRoomId}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveBooking}
            onDelete={handleDeleteBooking}
          />
        )}

        {!isFormOpen && !viewingBooking && (activeTab === 'home' || activeTab === 'bookings') && (
          <button
            onClick={() => handleAddBooking()}
            className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-16 h-16 bg-[#4f46e5] rounded-3xl text-white shadow-2xl shadow-indigo-200 flex items-center justify-center active:scale-90 transition-transform z-40"
          >
            <Plus size={36} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
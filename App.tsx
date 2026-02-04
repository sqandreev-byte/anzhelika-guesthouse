
import React, { useState, useEffect } from 'react';
import { Booking } from './types';
import { DEMO_BOOKINGS } from './constants';
import { checkCollision } from './utils';
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

  useEffect(() => {
    const saved = localStorage.getItem('anzhelika_bookings');
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved bookings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('anzhelika_bookings', JSON.stringify(bookings));
  }, [bookings]);

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

  const handleSaveBooking = (newBooking: Booking) => {
    const collision = checkCollision(bookings, newBooking);
    if (collision) {
      alert(`Ошибка: На эти даты в этом номере уже есть бронь (${collision.guestName})`);
      return;
    }

    if (currentBooking) {
      setBookings(prev => prev.map(b => b.id === newBooking.id ? newBooking : b));
    } else {
      setBookings(prev => [...prev, newBooking]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setIsFormOpen(false);
    setViewingBooking(null);
  };

  const handleUpdateStatus = (id: string, status: any) => {
    setBookings(prev => {
        const updated = prev.map(b => b.id === id ? { ...b, status } : b);
        if (viewingBooking && viewingBooking.id === id) {
            setViewingBooking({ ...viewingBooking, status });
        }
        return updated;
    });
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
        {renderView()}

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
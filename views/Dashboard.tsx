
import React from 'react';
import { Booking, Room, STATUS_MAP } from '../types';
import { ROOMS } from '../constants';
import { formatDate, formatPrice, getMoscowToday, parseLocalDate } from '../utils';
import { Phone, User, Info, CheckCircle2, LogOut } from 'lucide-react';
import { isSameDay, isAfter } from 'date-fns';

interface DashboardProps {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
  onUpdateStatus: (bookingId: string, status: any) => void;
  onOpenOccupancy?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, onOpenBooking, onUpdateStatus, onOpenOccupancy }) => {
  const today = getMoscowToday();

  const sortedBookings = [...bookings]
    .filter(b => b.status !== 'cancelled' && b.status !== 'checked_out')
    .sort((a, b) => parseLocalDate(a.checkIn).getTime() - parseLocalDate(b.checkIn).getTime());

  const arrivalsToday = sortedBookings.filter(b => isSameDay(parseLocalDate(b.checkIn), today));
  const departuresToday = bookings.filter(b => isSameDay(parseLocalDate(b.checkOut), today) && b.status === 'checked_in');
  const upcoming = sortedBookings.filter(b => {
    const checkIn = parseLocalDate(b.checkIn);
    return !isSameDay(checkIn, today) && isAfter(checkIn, today) && b.status !== 'checked_in';
  }).slice(0, 5);

  // Calculate additional stats
  const currentGuests = bookings.filter(b => b.status === 'checked_in').length;
  const totalRooms = ROOMS.length;
  const occupancyRate = totalRooms > 0 ? Math.round((currentGuests / totalRooms) * 100) : 0;
  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const stats = [
    { label: 'Заезды сегодня', value: arrivalsToday.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Выезды сегодня', value: departuresToday.length, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Занято сейчас', value: `${currentGuests}/${totalRooms}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Загрузка', value: `${occupancyRate}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const BookingCard = ({ booking, type }: { booking: Booking, type: 'arrival' | 'departure' | 'upcoming' }) => {
    const room = ROOMS.find(r => r.id === booking.roomId);
    const remaining = booking.totalPrice - booking.prepayment;
    const status = STATUS_MAP[booking.status];

    return (
      <div
        onClick={() => onOpenBooking(booking)}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-xl text-slate-800 leading-tight mb-1">{booking.guestName}</h3>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <span className="font-extrabold text-indigo-600">{room?.name}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
              <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
            </p>
          </div>
          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${status.bg} ${status.color} ${status.border}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 p-3 rounded-2xl">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Доплата</p>
            <p className={`text-lg font-black ${remaining > 0 ? 'text-[#ff4d5e]' : 'text-emerald-600'}`}>
              {remaining > 0 ? formatPrice(remaining) : 'Оплачено'}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Гости</p>
            <p className="text-lg font-black text-slate-700 flex items-center gap-1.5">
              <User size={16} className="text-slate-400" />
              {booking.adults} + {booking.kids}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <a 
            href={`tel:${booking.guestPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-slate-100 text-slate-700 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-slate-200 transition-colors"
          >
            <Phone size={20} />
            <span>Позвонить</span>
          </a>
          {type === 'arrival' && booking.status !== 'checked_in' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(booking.id, 'checked_in'); }}
              className="flex-1 bg-[#4f46e5] text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              <CheckCircle2 size={20} />
              <span>Заселить</span>
            </button>
          )}
          {type === 'departure' && booking.status === 'checked_in' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(booking.id, 'checked_out'); }}
              className="flex-1 bg-orange-600 text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-orange-700 transition-colors shadow-lg shadow-orange-100"
            >
              <LogOut size={20} />
              <span>Выселить</span>
            </button>
          )}
          {type === 'upcoming' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenBooking(booking); }}
              className="flex-1 bg-[#0f172a] text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-black transition-colors"
            >
              <Info size={20} />
              <span>Детали</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 pt-8 pb-24 md:pb-12 no-scrollbar">
      <header className="mb-8 px-1">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Привет,</h1>
        <p className="text-slate-500 text-xl font-medium tracking-tight">Гостевой дом «Анжелика»</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => {
          const isOccupancy = s.label === 'Загрузка';
          return (
            <div
              key={i}
              onClick={isOccupancy && onOpenOccupancy ? onOpenOccupancy : undefined}
              className={`${s.bg} rounded-[28px] p-5 border border-white shadow-sm ${
                isOccupancy ? 'cursor-pointer active:scale-[0.97] transition-transform ring-2 ring-blue-200' : ''
              }`}
            >
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {s.label}
                {isOccupancy && <span className="ml-1 text-blue-400">→</span>}
              </p>
              <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-5 px-1 tracking-tight">На сегодня</h2>
        {arrivalsToday.length === 0 && departuresToday.length === 0 ? (
          <div className="bg-white/60 border border-dashed border-slate-300 rounded-[32px] p-12 text-center">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Тихо... пока ничего</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {arrivalsToday.map(b => <BookingCard key={b.id} booking={b} type="arrival" />)}
            {departuresToday.map(b => <BookingCard key={b.id} booking={b} type="departure" />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-5 px-1 tracking-tight">Будущие гости</h2>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {upcoming.map(b => <BookingCard key={b.id} booking={b} type="upcoming" />)}
          </div>
        ) : (
          <p className="text-slate-400 italic font-medium px-1">Нет будущих бронирований</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

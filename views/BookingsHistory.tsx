
import React, { useState } from 'react';
import { Booking, STATUS_MAP } from '../types';
import { ROOMS } from '../constants';
import { Search, ChevronRight } from 'lucide-react';
import { formatDate, formatPrice, parseLocalDate } from '../utils';

interface BookingsHistoryProps {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
}

const BookingsHistory: React.FC<BookingsHistoryProps> = ({ bookings, onOpenBooking }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = bookings.filter(b => {
    const matchesSearch = b.guestName.toLowerCase().includes(search.toLowerCase()) || 
                          b.guestPhone.includes(search);
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => parseLocalDate(b.checkIn).getTime() - parseLocalDate(a.checkIn).getTime());

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="px-5 md:px-8 lg:px-12 pt-10 pb-4 bg-white">
        <h1 className="text-[34px] font-black text-[#0f172a] tracking-tight mb-6 leading-none">Бронирования</h1>

        <div className="relative mb-6 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по имени или телефону..."
            className="w-full h-14 bg-slate-100/70 rounded-2xl pl-12 pr-4 font-medium outline-none focus:bg-white border border-transparent focus:border-indigo-200 transition-all text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${
              filterStatus === 'all' ? 'bg-[#4f46e5] border-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            Все
          </button>
          {Object.entries(STATUS_MAP).map(([key, config]) => (
            <button 
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${
                filterStatus === key ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 md:px-8 lg:px-12 pt-2 pb-24 md:pb-12 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(booking => {
            const room = ROOMS.find(r => r.id === booking.roomId);
            const status = STATUS_MAP[booking.status];
            const remaining = booking.totalPrice - booking.prepayment;

            return (
              <div
                key={booking.id}
                onClick={() => onOpenBooking(booking)}
                className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform flex items-center justify-between"
              >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-bold text-xl text-slate-900">{booking.guestName}</span>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${status.bg} ${status.color} ${status.border}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
                   <span className="text-[#4f46e5] font-black">{room?.name}</span>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span className="font-medium text-slate-400">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                </p>
                {remaining > 0 && booking.status !== 'cancelled' && (
                  <p className="text-[11px] font-black text-[#ff4d5e] mt-2 uppercase tracking-widest">
                    ДОПЛАТА: {formatPrice(remaining)}
                  </p>
                )}
              </div>
              <ChevronRight size={20} className="text-slate-300 ml-4" />
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingsHistory;

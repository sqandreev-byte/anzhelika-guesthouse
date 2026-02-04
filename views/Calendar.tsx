
import React, { useState } from 'react';
import { Booking, Room, STATUS_MAP } from '../types';
import { ROOMS } from '../constants';
// Fix: Remove missing startOfToday, parseISO, subDays
import { format, addDays, eachDayOfInterval, isSameDay } from 'date-fns';
// Fix: Use specific path for ru locale
import { ru } from 'date-fns/locale/ru';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface CalendarViewProps {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
  onAddBooking: (date: Date, roomId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onOpenBooking, onAddBooking }) => {
  // Fix: Use vanilla JS for start of today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [filterRoomId, setFilterRoomId] = useState<string | null>(null);

  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 13)
  });

  const nextPeriod = () => setStartDate(addDays(startDate, 7));
  // Fix: Use addDays with negative value instead of missing subDays
  const prevPeriod = () => setStartDate(addDays(startDate, -7));

  const filteredRooms = filterRoomId ? ROOMS.filter(r => r.id === filterRoomId) : ROOMS;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="p-4 md:p-6 lg:p-8 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Календарь занятости</h2>
          <div className="flex gap-2">
            <button onClick={prevPeriod} className="p-2 hover:bg-slate-50 rounded-full border border-slate-100">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <button onClick={nextPeriod} className="p-2 hover:bg-slate-50 rounded-full border border-slate-100">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setFilterRoomId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
              !filterRoomId ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            Все номера
          </button>
          {ROOMS.map(room => (
            <button 
              key={room.id}
              onClick={() => setFilterRoomId(room.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                filterRoomId === room.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50/50 pb-20 md:pb-4">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[120px_repeat(14,1fr)] md:grid-cols-[160px_repeat(14,1fr)] bg-white sticky top-0 z-10 border-b border-slate-100">
            <div className="p-3 bg-white"></div>
            {days.map(day => (
              <div key={day.toISOString()} className="p-2 md:p-3 text-center flex flex-col items-center justify-center border-l border-slate-50">
                <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">{format(day, 'EE', { locale: ru })}</span>
                <span className={`text-sm md:text-base font-bold ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRooms.map(room => (
              <div key={room.id} className="grid grid-cols-[120px_repeat(14,1fr)] md:grid-cols-[160px_repeat(14,1fr)] min-h-[100px]">
                <div className="p-3 md:p-4 bg-white border-r border-slate-100 flex items-center sticky left-0 z-[5]">
                  <span className="font-bold text-xs md:text-sm text-slate-600">{room.name}</span>
                </div>
                {days.map(day => {
                  const booking = bookings.find(b => {
                    // Fix: Use new Date() instead of parseISO
                    const start = new Date(b.checkIn);
                    const end = new Date(b.checkOut);
                    return b.roomId === room.id && 
                           b.status !== 'cancelled' &&
                           (isSameDay(day, start) || isSameDay(day, end) || (day >= start && day <= end));
                  });

                  // Fix: Use new Date() instead of parseISO
                  const isStart = booking && isSameDay(day, new Date(booking.checkIn));
                  const isEnd = booking && isSameDay(day, new Date(booking.checkOut));

                  return (
                    <div 
                      key={day.toISOString()} 
                      className="border-l border-slate-50 relative group"
                      onClick={() => !booking ? onAddBooking(day, room.id) : onOpenBooking(booking)}
                    >
                      {booking && (
                        <div className={`absolute top-1 bottom-1 left-0 right-0 z-[1] flex items-center transition-opacity cursor-pointer
                          ${isStart ? 'left-2 rounded-l-lg' : ''}
                          ${isEnd ? 'right-2 rounded-r-lg' : ''}
                          ${STATUS_MAP[booking.status].bg}
                          border-y border-x-0 ${STATUS_MAP[booking.status].border}
                          ${isStart ? 'border-l' : ''}
                          ${isEnd ? 'border-r' : ''}
                        `}>
                          {isStart && (
                            <span className="text-[8px] font-black uppercase px-1 leading-none truncate whitespace-nowrap overflow-hidden max-w-full text-indigo-900 opacity-70">
                              {booking.guestName}
                            </span>
                          )}
                        </div>
                      )}
                      {!booking && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-indigo-50 flex items-center justify-center text-indigo-400 cursor-pointer">
                          +
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>


      <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex items-center justify-center gap-4 md:gap-6 flex-wrap">
          {Object.entries(STATUS_MAP).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border ${config.bg} ${config.border}`} />
              <span className="text-[10px] md:text-xs text-slate-500 font-medium uppercase">{config.label}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CalendarView;
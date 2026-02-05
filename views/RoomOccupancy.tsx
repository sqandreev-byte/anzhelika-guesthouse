
import React, { useState } from 'react';
import { Booking, STATUS_MAP } from '../types';
import { ROOMS } from '../constants';
import { format, addDays, addMonths, addYears, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface RoomOccupancyProps {
  bookings: Booking[];
  onBack: () => void;
  onOpenBooking: (booking: Booking) => void;
}

const RoomOccupancy: React.FC<RoomOccupancyProps> = ({ bookings, onBack, onOpenBooking }) => {
  const [selectedRoomId, setSelectedRoomId] = useState(ROOMS[0].id);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday = 0, Sunday = 6
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  const roomBookings = bookings.filter(
    b => b.roomId === selectedRoomId && b.status !== 'cancelled'
  );

  const getBookingForDay = (day: Date): Booking | null => {
    return roomBookings.find(b => {
      const start = new Date(b.checkIn.split('T')[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.checkOut.split('T')[0]);
      end.setHours(0, 0, 0, 0);
      // Day is occupied from check-in date up to (but not including) check-out date
      return day >= start && day < end;
    }) || null;
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  // Count occupied days this month
  const occupiedDays = days.filter(d => getBookingForDay(d) !== null).length;
  const occupancyPercent = Math.round((occupiedDays / days.length) * 100);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 pt-6 pb-24 md:pb-12 no-scrollbar bg-[#f8fafc]">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-3 active:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Главная</span>
        </button>
        <h1 className="text-[28px] md:text-[34px] font-black text-[#0f172a] leading-tight">Загрузка номеров</h1>
      </header>

      {/* Room Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
        {ROOMS.map(room => (
          <button
            key={room.id}
            onClick={() => setSelectedRoomId(room.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border-2 transition-all ${
              selectedRoomId === room.id
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white border-slate-200 text-slate-500 active:border-slate-300'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-slate-800 capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="p-2 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Occupancy Summary */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-1">Свободно</p>
          <p className="text-2xl font-black text-emerald-700">{days.length - occupiedDays} дн.</p>
        </div>
        <div className="flex-1 bg-rose-50 rounded-2xl p-4 border border-rose-100">
          <p className="text-[10px] text-rose-600 font-black uppercase tracking-wider mb-1">Занято</p>
          <p className="text-2xl font-black text-rose-700">{occupiedDays} дн.</p>
        </div>
        <div className="flex-1 bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mb-1">Загрузка</p>
          <p className="text-2xl font-black text-indigo-700">{occupancyPercent}%</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {weekDays.map(wd => (
            <div key={wd} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border-b border-r border-slate-50" />
          ))}

          {days.map(day => {
            const booking = getBookingForDay(day);
            const isPast = isBefore(day, todayDate) && !isSameDay(day, todayDate);
            const today = isToday(day);

            // Check if this is the first day of a booking (for showing guest name)
            const isBookingStart = booking && isSameDay(day, new Date(booking.checkIn.split('T')[0]));

            return (
              <div
                key={day.toISOString()}
                onClick={() => booking && onOpenBooking(booking)}
                className={`aspect-square border-b border-r border-slate-50 p-1 flex flex-col items-center justify-center relative transition-colors ${
                  booking ? 'cursor-pointer active:opacity-80' : ''
                } ${isPast && !booking ? 'bg-slate-50/50' : ''}`}
              >
                {/* Day number */}
                <span className={`text-sm font-bold z-10 ${
                  today
                    ? 'w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                    : booking
                      ? 'text-white'
                      : isPast
                        ? 'text-slate-300'
                        : 'text-slate-700'
                }`}>
                  {format(day, 'd')}
                </span>

                {/* Booking background */}
                {booking && (
                  <div className={`absolute inset-0.5 rounded-lg ${
                    booking.status === 'checked_in' ? 'bg-orange-400' :
                    booking.status === 'prepaid' ? 'bg-emerald-500' :
                    'bg-indigo-500'
                  }`} />
                )}

                {/* Guest name on booking start */}
                {isBookingStart && (
                  <span className="text-[7px] font-bold text-white/90 z-10 leading-tight text-center truncate w-full px-0.5">
                    {booking.guestName.split(' ')[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-indigo-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Подтверждена</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Оплачена</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-orange-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Заехали</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2 border-slate-200 bg-white" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Свободно</span>
        </div>
      </div>

      {/* Bookings list for this month */}
      {(() => {
        const monthBookings = roomBookings.filter(b => {
          const start = new Date(b.checkIn.split('T')[0]);
          const end = new Date(b.checkOut.split('T')[0]);
          return start <= monthEnd && end >= monthStart;
        }).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

        if (monthBookings.length === 0) return null;

        return (
          <div className="mt-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 px-1">
              Брони за месяц
            </p>
            <div className="space-y-3">
              {monthBookings.map(b => {
                const status = STATUS_MAP[b.status];
                return (
                  <div
                    key={b.id}
                    onClick={() => onOpenBooking(b)}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-base truncate">{b.guestName}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {format(new Date(b.checkIn), 'd MMM', { locale: ru })} — {format(new Date(b.checkOut), 'd MMM', { locale: ru })}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${status.bg} ${status.color} ${status.border} ml-3 shrink-0`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Free dates for the next year */}
      {(() => {
        // Parse date string as local date (avoid UTC timezone shift)
        const parseLocalDate = (dateStr: string) => {
          const parts = dateStr.split('T')[0].split('-');
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          d.setHours(0, 0, 0, 0);
          return d;
        };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const yearEnd = addYears(now, 1);

        // Get all bookings for this room sorted by check-in
        const allRoomBookings = bookings
          .filter(b => b.roomId === selectedRoomId && b.status !== 'cancelled')
          .map(b => ({
            start: parseLocalDate(b.checkIn),
            end: parseLocalDate(b.checkOut),
          }))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        // Build free intervals
        const freeIntervals: { from: Date; to: Date }[] = [];
        let cursor = new Date(now);

        for (const booking of allRoomBookings) {
          if (booking.end.getTime() <= cursor.getTime()) continue;
          if (booking.start.getTime() >= yearEnd.getTime()) break;

          if (booking.start.getTime() > cursor.getTime()) {
            freeIntervals.push({ from: new Date(cursor), to: new Date(booking.start) });
          }
          if (booking.end.getTime() > cursor.getTime()) {
            cursor = new Date(booking.end);
          }
        }

        if (cursor.getTime() < yearEnd.getTime()) {
          freeIntervals.push({ from: new Date(cursor), to: yearEnd });
        }

        if (freeIntervals.length === 0) return null;

        return (
          <div className="mt-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 px-1">
              Свободные даты
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {freeIntervals.map((interval, i) => (
                <div
                  key={i}
                  className={`px-5 py-3.5 flex items-center gap-3 ${
                    i < freeIntervals.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-700">
                    С {format(interval.from, 'd MMMM yyyy', { locale: ru })} по {format(addDays(interval.to, -1), 'd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RoomOccupancy;


import { differenceInDays, format, areIntervalsOverlapping } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Booking } from './types';

// Get current date/time in Moscow timezone (UTC+3), independent of user's browser timezone
export const getMoscowToday = (): Date => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.format(new Date()).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
};

// Parse date string (YYYY-MM-DD or ISO) to local Date at midnight
export const parseLocalDate = (dateStr: string): Date => {
  const p = dateStr.split('T')[0].split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 0, 0, 0, 0);
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0;
  // Используем только дату (YYYY-MM-DD), чтобы разница во времени не влияла на количество полных суток
  const start = new Date(checkIn.split('T')[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date(checkOut.split('T')[0]);
  end.setHours(0, 0, 0, 0);
  const diff = differenceInDays(end, start);
  return diff > 0 ? diff : 0;
};

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date: string, pattern: string = 'd MMM'): string => {
  try {
    return format(new Date(date), pattern, { locale: ru });
  } catch (e) {
    return date;
  }
};

export const checkCollision = (bookings: Booking[], newBooking: Partial<Booking>): Booking | null => {
  if (!newBooking.roomId || !newBooking.checkIn || !newBooking.checkOut) return null;

  // Use date-only comparison (ignore time) to allow same-day check-out/check-in
  const newStart = new Date(newBooking.checkIn);
  newStart.setHours(0, 0, 0, 0);
  const newEnd = new Date(newBooking.checkOut);
  newEnd.setHours(0, 0, 0, 0);

  return bookings.find(b => {
    if (b.id === newBooking.id) return false;
    if (b.roomId !== newBooking.roomId) return false;
    if (b.status === 'cancelled') return false;

    const bStart = new Date(b.checkIn);
    bStart.setHours(0, 0, 0, 0);
    const bEnd = new Date(b.checkOut);
    bEnd.setHours(0, 0, 0, 0);

    // Allow same-day transitions: check-out and check-in on the same day is OK
    // Conflict exists only if date ranges actually overlap (not just touch at boundaries)
    return areIntervalsOverlapping(
      { start: newStart, end: newEnd },
      { start: bStart, end: bEnd },
      { inclusive: false }
    );
  }) || null;
};

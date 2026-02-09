
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

// Parse date string to Date at midnight, always interpreting as Moscow date (UTC+3)
// Handles: "2026-06-29", "2026-06-29T14:00:00", "2026-06-29T11:00:00.000Z"
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(0);
  // If ISO string with timezone info (Z or +/-offset), extract Moscow calendar date
  if (dateStr.includes('Z') || /T\d{2}:\d{2}.*[+-]\d{2}/.test(dateStr)) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.format(new Date(dateStr)).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
  }
  // No timezone info — take date part as-is (already Moscow time from frontend)
  const p = dateStr.split('T')[0].split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 0, 0, 0, 0);
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0;
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  const diff = differenceInDays(end, start);
  return diff > 0 ? diff : 0;
};

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date: string, pattern: string = 'd MMM'): string => {
  try {
    return format(parseLocalDate(date), pattern, { locale: ru });
  } catch (e) {
    return date;
  }
};

export const checkCollision = (bookings: Booking[], newBooking: Partial<Booking>): Booking | null => {
  if (!newBooking.roomId || !newBooking.checkIn || !newBooking.checkOut) return null;

  const newStart = parseLocalDate(newBooking.checkIn);
  const newEnd = parseLocalDate(newBooking.checkOut);

  return bookings.find(b => {
    if (b.id === newBooking.id) return false;
    if (b.roomId !== newBooking.roomId) return false;
    if (b.status === 'cancelled') return false;

    const bStart = parseLocalDate(b.checkIn);
    const bEnd = parseLocalDate(b.checkOut);

    // Allow same-day transitions: check-out and check-in on the same day is OK
    // Conflict exists only if date ranges actually overlap (not just touch at boundaries)
    return areIntervalsOverlapping(
      { start: newStart, end: newEnd },
      { start: bStart, end: bEnd },
      { inclusive: false }
    );
  }) || null;
};

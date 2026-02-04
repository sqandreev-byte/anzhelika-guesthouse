
import { Room, Booking } from './types';
import { addDays, format } from 'date-fns';

export const ROOMS: Room[] = [
  { id: '1', name: 'Студия', description: 'Уютный номер с мини-кухней', image: 'https://picsum.photos/400/300?random=1' },
  { id: '2', name: 'Двухкомнатный Море', description: 'Вид на море, просторная гостиная', image: 'https://picsum.photos/400/300?random=2' },
  { id: '3', name: 'Двухкомнатная Студия', description: 'Тихий номер с видом в сад', image: 'https://picsum.photos/400/300?random=3' },
];

// Fix: Use vanilla JS to get start of today as startOfToday is reported missing
const today = new Date();
today.setHours(0, 0, 0, 0);

export const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    roomId: '1',
    guestName: 'Ирина Иванова',
    guestPhone: '+79001234567',
    checkIn: format(addDays(today, -2), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 2), "yyyy-MM-dd'T'12:00:00"),
    adults: 2,
    kids: 1,
    parking: true,
    earlyCheckIn: false,
    lateCheckOut: false,
    dailyPrice: 3500,
    totalPrice: 14000,
    prepayment: 3500,
    status: 'checked_in',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    roomId: '2',
    guestName: 'Максим Петров',
    guestPhone: '+79119876543',
    checkIn: format(today, "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 5), "yyyy-MM-dd'T'12:00:00"),
    adults: 3,
    kids: 0,
    parking: false,
    earlyCheckIn: true,
    earlyCheckInTime: '08:00',
    lateCheckOut: false,
    dailyPrice: 5000,
    totalPrice: 25000,
    prepayment: 10000,
    status: 'confirmed',
    comment: 'Нужно дополнительное одеяло',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b3',
    roomId: '3',
    guestName: 'Елена Смирнова',
    guestPhone: '+79220001122',
    checkIn: format(addDays(today, 1), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 4), "yyyy-MM-dd'T'12:00:00"),
    adults: 2,
    kids: 2,
    parking: true,
    earlyCheckIn: false,
    lateCheckOut: true,
    lateCheckOutTime: '18:00',
    dailyPrice: 4500,
    totalPrice: 13500,
    prepayment: 13500,
    status: 'prepaid',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b4',
    roomId: '1',
    guestName: 'Андрей К.',
    guestPhone: '+79334445566',
    checkIn: format(addDays(today, 3), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 7), "yyyy-MM-dd'T'12:00:00"),
    adults: 1,
    kids: 0,
    parking: false,
    earlyCheckIn: false,
    lateCheckOut: false,
    dailyPrice: 3500,
    totalPrice: 14000,
    prepayment: 2000,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }
];
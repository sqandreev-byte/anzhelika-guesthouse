
export type BookingStatus = 
  | 'confirmed' 
  | 'prepaid' 
  | 'checked_in' 
  | 'checked_out' 
  | 'cancelled';

export type ContactChannel = 'telegram' | 'whatsapp' | 'vk' | 'max' | 'other';

export interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  contactChannel?: ContactChannel;
  contactSource?: string;
  checkIn: string; // ISO String
  checkOut: string; // ISO String
  adults: number;
  kids: number;
  parking: boolean;
  earlyCheckIn: boolean;
  earlyCheckInTime?: string;
  earlyCheckInSurcharge?: number;
  lateCheckOut: boolean;
  lateCheckOutTime?: string;
  lateCheckOutSurcharge?: number;
  dailyPrice: number;
  dailyPrice2?: number;
  totalPrice: number;
  prepayment: number;
  status: BookingStatus;
  comment?: string;
  createdAt: string;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const STATUS_MAP: Record<BookingStatus, StatusConfig> = {
  confirmed: { label: 'Подтверждена', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  prepaid: { label: 'Оплачена', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  checked_in: { label: 'Заехали', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  checked_out: { label: 'Выехали', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  cancelled: { label: 'Отмена', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export const CHANNEL_MAP: Record<ContactChannel, { label: string; icon: string }> = {
  telegram: { label: 'Telegram', icon: '💬' },
  whatsapp: { label: 'WhatsApp', icon: '📞' },
  vk: { label: 'VK', icon: '📱' },
  max: { label: 'Max', icon: '👤' },
  other: { label: 'Другое', icon: '✨' },
};

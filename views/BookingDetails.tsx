
import React from 'react';
import { Booking, STATUS_MAP, CHANNEL_MAP } from '../types';
import { ROOMS } from '../constants';
import { formatDate, formatPrice } from '../utils';
import { X, Edit2, Phone, Car, Clock, User, Banknote, Calendar, MessageSquare, CheckCircle2, LogOut, ChevronLeft, Globe } from 'lucide-react';

interface BookingDetailsProps {
  booking: Booking;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onUpdateStatus: (id: string, status: any) => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({ booking, onClose, onEdit, onUpdateStatus }) => {
  const room = ROOMS.find(r => r.id === booking.roomId);
  const status = STATUS_MAP[booking.status];
  const remaining = booking.totalPrice - booking.prepayment;
  const channel = booking.contactChannel ? CHANNEL_MAP[booking.contactChannel] : null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center md:p-8">
      <div className="bg-slate-50 w-full h-full md:w-[600px] md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-10">
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronLeft size={28} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Бронирование</h2>
          <button
            onClick={() => onEdit(booking)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <Edit2 size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-6 md:pb-6 no-scrollbar">
        {/* Guest Hero Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
          {channel && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <span className="text-sm">{channel.icon}</span>
              <span className="text-[10px] font-black uppercase text-slate-500">{channel.label}</span>
            </div>
          )}
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">{booking.guestName}</h1>
          <p className="text-slate-500 font-medium mb-4">{booking.guestPhone}</p>
          <div className="inline-block">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}>
              {status.label}
            </span>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <a 
            href={`tel:${booking.guestPhone}`}
            className="flex-1 bg-white border border-slate-200 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-slate-700 active:bg-slate-50 transition-colors shadow-sm"
          >
            <Phone size={20} className="text-indigo-500" />
            <span>Позвонить</span>
          </a>
          {booking.status === 'confirmed' || booking.status === 'prepaid' ? (
            <button 
              onClick={() => onUpdateStatus(booking.id, 'checked_in')}
              className="flex-1 bg-indigo-600 text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              <CheckCircle2 size={20} />
              <span>Заселить</span>
            </button>
          ) : booking.status === 'checked_in' ? (
            <button 
              onClick={() => onUpdateStatus(booking.id, 'checked_out')}
              className="flex-1 bg-orange-600 text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-orange-700 transition-colors shadow-lg shadow-orange-100"
            >
              <LogOut size={20} />
              <span>Выселить</span>
            </button>
          ) : null}
        </div>

        {/* Stay & Info */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
              <Calendar size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Даты и Номер</p>
              <p className="font-bold text-slate-800 text-lg">{room?.name}</p>
              <p className="text-slate-500 font-medium">{formatDate(booking.checkIn, 'd MMMM')} — {formatDate(booking.checkOut, 'd MMMM')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Гости</p>
              <p className="font-bold text-slate-800 text-lg">
                {booking.adults} взрослых{booking.kids > 0 ? `, ${booking.kids} детей` : ''}
              </p>
            </div>
          </div>

          {booking.contactSource && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <Globe size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Источник контакта</p>
                <p className="font-bold text-slate-800 text-lg">{booking.contactSource}</p>
              </div>
            </div>
          )}
        </section>

        {/* Requirements & Extras */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Особые требования</p>
           <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${booking.parking ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                    <Car size={18} />
                  </div>
                  <span className={`font-bold ${booking.parking ? 'text-slate-800' : 'text-slate-400'}`}>Парковка</span>
                </div>
                <span className={`text-xs font-black uppercase ${booking.parking ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {booking.parking ? 'Нужна' : 'Нет'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${booking.earlyCheckIn ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                    <Clock size={18} />
                  </div>
                  <span className={`font-bold ${booking.earlyCheckIn ? 'text-slate-800' : 'text-slate-400'}`}>Ранний заезд</span>
                </div>
                <span className={`text-xs font-black uppercase ${booking.earlyCheckIn ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {booking.earlyCheckIn ? booking.earlyCheckInTime : 'Нет'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${booking.lateCheckOut ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                    <Clock size={18} />
                  </div>
                  <span className={`font-bold ${booking.lateCheckOut ? 'text-slate-800' : 'text-slate-400'}`}>Поздний выезд</span>
                </div>
                <span className={`text-xs font-black uppercase ${booking.lateCheckOut ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {booking.lateCheckOut ? booking.lateCheckOutTime : 'Нет'}
                </span>
              </div>
           </div>
        </section>

        {/* Financial Section */}
        <section className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
          <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Banknote size={14} /> Оплата
          </p>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-white/60 font-medium">Общая сумма</span>
                <span className="text-xl font-bold">{formatPrice(booking.totalPrice)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-white/60 font-medium">Предоплата</span>
                <span className="text-xl font-bold text-emerald-400">{formatPrice(booking.prepayment)}</span>
             </div>
             <div className="h-px bg-white/10 my-2" />
             <div className="flex justify-between items-center">
                <span className="text-lg font-black uppercase tracking-tight">Осталось</span>
                <span className={`text-2xl font-black ${remaining > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {remaining > 0 ? formatPrice(remaining) : 'Оплачено'}
                </span>
             </div>
          </div>
        </section>

        {/* Comment */}
        {booking.comment && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare size={14} /> Заметки
            </p>
            <p className="text-slate-700 font-medium leading-relaxed italic">
              «{booking.comment}»
            </p>
          </section>
        )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

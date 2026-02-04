
import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, ContactChannel, CHANNEL_MAP, STATUS_MAP } from '../types';
import { ROOMS } from '../constants';
import { calculateNights, formatPrice } from '../utils';
import { X, Calendar as CalendarIcon, User, Phone, Banknote, Car, Clock, ChevronDown, Plus, Minus, Calculator, Globe } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface BookingFormProps {
  booking?: Booking | null;
  initialDate?: Date | null;
  initialRoomId?: string | null;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  onDelete?: (id: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  booking, 
  initialDate, 
  initialRoomId, 
  onClose, 
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<Booking>>(() => booking || {
    id: 'b' + Math.random().toString(36).substring(2, 11),
    roomId: initialRoomId || ROOMS[0].id,
    guestName: '',
    guestPhone: '+7 ',
    contactChannel: 'whatsapp',
    contactSource: '',
    checkIn: initialDate ? format(initialDate, "yyyy-MM-dd'T'14:00:00") : format(new Date(), "yyyy-MM-dd'T'14:00:00"),
    checkOut: initialDate ? format(addDays(initialDate, 1), "yyyy-MM-dd'T'12:00:00") : format(addDays(new Date(), 1), "yyyy-MM-dd'T'12:00:00"),
    adults: 2,
    kids: 0,
    parking: false,
    earlyCheckIn: false,
    lateCheckOut: false,
    dailyPrice: 3500,
    totalPrice: 3500,
    prepayment: 0,
    status: 'confirmed',
    comment: '',
    createdAt: new Date().toISOString()
  });

  const nights = calculateNights(formData.checkIn || '', formData.checkOut || '');
  
  useEffect(() => {
    const total = (formData.dailyPrice || 0) * nights;
    setFormData(prev => ({ ...prev, totalPrice: total }));
  }, [formData.dailyPrice, nights]);

  const remaining = (formData.totalPrice || 0) - (formData.prepayment || 0);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.guestName?.trim()) {
      alert('Пожалуйста, введите имя гостя');
      return;
    }
    const phone = formData.guestPhone?.trim() || '';
    if (phone === '+7' || phone === '' || phone === '+7 ') {
      alert('Пожалуйста, введите номер телефона');
      return;
    }
    
    const finalBooking: Booking = {
      ...formData as Booking,
      id: formData.id || 'b' + Math.random().toString(36).substring(2, 11),
      createdAt: formData.createdAt || new Date().toISOString()
    };
    onSave(finalBooking);
  };

  const handleChange = (field: keyof Booking, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    let val = value;
    if (!val.startsWith('+7')) {
      const digits = val.replace(/\D/g, '');
      if (digits.startsWith('7') || digits.startsWith('8')) {
        val = '+7 ' + digits.substring(1);
      } else {
        val = '+7 ' + digits;
      }
    }
    if (val.length < 3) val = '+7 ';
    handleChange('guestPhone', val);
  };

  const handleNumberChange = (field: keyof Booking, value: string) => {
    const num = value === '' ? 0 : Number(value);
    handleChange(field, num);
  };

  const handleNightsChange = (newNights: number) => {
    if (newNights < 1) return;
    const checkInDate = new Date(formData.checkIn?.split('T')[0] || '');
    const newCheckOutDate = addDays(checkInDate, newNights);
    handleChange('checkOut', format(newCheckOutDate, "yyyy-MM-dd'T'12:00:00"));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const formatDateForDisplay = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return format(d, 'dd.MM.yyyy');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center md:p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:w-[700px] md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <button onClick={onClose} type="button" className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">
            {booking ? 'Редактировать' : 'Новое бронирование'}
          </h2>
          <button
            onClick={() => handleSubmit()}
            type="button"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-indigo-100"
          >
            {booking ? 'Сохранить' : 'Создать'}
          </button>
        </header>

        <form className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar pb-6 md:pb-6" onSubmit={handleSubmit}>
        {/* Guest Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <User size={14} />
            <span>Основная информация</span>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text"
              placeholder="Имя гостя"
              className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-bold text-slate-800 border border-transparent focus:border-indigo-300 focus:bg-white outline-none transition-all shadow-inner"
              value={formData.guestName}
              onChange={(e) => handleChange('guestName', e.target.value)}
              required
            />
            <input 
              type="tel"
              placeholder="+7 (900) 000-00-00"
              className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-bold text-slate-800 border border-transparent focus:border-indigo-300 focus:bg-white outline-none transition-all shadow-inner"
              value={formData.guestPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
            />
          </div>
        </section>

        {/* Contact Channel & Source */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <Globe size={14} />
            <span>Канал связи и источник</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['telegram', 'whatsapp', 'vk', 'max', 'other'] as ContactChannel[]).map(channel => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => handleChange('contactChannel', channel)}
                  className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    formData.contactChannel === channel
                      ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-200'
                      : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {CHANNEL_MAP[channel].label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Откуда узнали? (Авито, Сарафан, и т.д.)"
              className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-medium text-slate-700 border border-transparent focus:border-indigo-300 focus:bg-white outline-none transition-all shadow-inner"
              value={formData.contactSource || ''}
              onChange={(e) => handleChange('contactSource', e.target.value)}
            />
          </div>
        </section>

        {/* Room & Status */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <Clock size={14} />
            <span>Номер и Статус</span>
          </div>
          <div className="space-y-3">
             <div className="relative w-full">
                <select 
                  className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-bold text-indigo-900 border border-transparent outline-none appearance-none shadow-inner"
                  value={formData.roomId}
                  onChange={(e) => handleChange('roomId', e.target.value)}
                >
                  {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
             <div className="relative w-full">
                <select 
                  className={`w-full h-14 rounded-2xl px-5 font-black border border-transparent outline-none appearance-none shadow-sm ${STATUS_MAP[formData.status || 'confirmed'].bg} ${STATUS_MAP[formData.status || 'confirmed'].color}`}
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as BookingStatus)}
                >
                  {Object.entries(STATUS_MAP).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
          </div>
        </section>

        {/* Guests */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <User size={14} />
            <span>Количество гостей</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 shadow-inner">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Взрослые</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => formData.adults && formData.adults > 1 && handleChange('adults', formData.adults - 1)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                >
                  <Minus size={20} strokeWidth={3} />
                </button>
                <span className="text-2xl font-black text-slate-900 flex-1 text-center">{formData.adults || 0}</span>
                <button
                  type="button"
                  onClick={() => handleChange('adults', (formData.adults || 0) + 1)}
                  className="w-10 h-10 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 shadow-inner">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Дети</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => formData.kids && formData.kids > 0 && handleChange('kids', formData.kids - 1)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                >
                  <Minus size={20} strokeWidth={3} />
                </button>
                <span className="text-2xl font-black text-slate-900 flex-1 text-center">{formData.kids || 0}</span>
                <button
                  type="button"
                  onClick={() => handleChange('kids', (formData.kids || 0) + 1)}
                  className="w-10 h-10 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dates and Nights - REDESIGNED */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <CalendarIcon size={14} />
            <span>Даты и Продолжительность</span>
          </div>
          <div className="space-y-3">
            {/* Check-In Field */}
            <div className="bg-white rounded-[22px] p-4 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between relative group active:scale-[0.99] transition-transform">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">ЗАЕЗД</p>
                <p className="text-xl font-black text-slate-900 leading-none">
                  {formatDateForDisplay(formData.checkIn || '')}
                </p>
              </div>
              <CalendarIcon size={20} className="text-slate-900" />
              <input 
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={formData.checkIn?.split('T')[0]}
                onChange={(e) => handleChange('checkIn', `${e.target.value}T14:00:00`)}
              />
            </div>
            
            {/* Check-Out Field */}
            <div className="bg-white rounded-[22px] p-4 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between relative group active:scale-[0.99] transition-transform">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">ВЫЕЗД</p>
                <p className="text-xl font-black text-slate-900 leading-none">
                  {formatDateForDisplay(formData.checkOut || '')}
                </p>
              </div>
              <CalendarIcon size={20} className="text-slate-900" />
              <input 
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={formData.checkOut?.split('T')[0]}
                onChange={(e) => {
                   const val = e.target.value;
                   handleChange('checkOut', `${val}T12:00:00`);
                }}
              />
            </div>
          </div>

          {/* Nights Counter - MATCHING SCREENSHOT */}
          <div className="bg-[#eff6ff] rounded-[22px] p-6 flex items-center justify-between border border-[#dbeafe] w-full mt-4">
            <div>
              <p className="text-[11px] text-[#4f46e5] uppercase font-black tracking-widest mb-1">КОЛИЧЕСТВО НОЧЕЙ</p>
              <p className="text-3xl font-black text-[#1e1b4b] leading-none">{nights}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => handleNightsChange(nights - 1)}
                className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4f46e5] active:scale-90 transition-all"
              >
                <Minus size={24} strokeWidth={3} />
              </button>
              <button 
                type="button" 
                onClick={() => handleNightsChange(nights + 1)}
                className="w-12 h-12 rounded-full bg-[#4f46e5] shadow-xl shadow-indigo-200 flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        </section>

        {/* Special Requirements */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <Car size={14} />
            <span>Особые требования</span>
          </div>

          <div className="space-y-3">
            {/* Parking */}
            <div
              onClick={() => handleChange('parking', !formData.parking)}
              className={`rounded-2xl p-5 cursor-pointer transition-all border-2 ${
                formData.parking
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-slate-50 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.parking
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}>
                    {formData.parking && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <Car size={18} className="text-indigo-600" />
                    Парковка
                  </span>
                </div>
                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg ${
                  formData.parking
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {formData.parking ? 'НУЖНА' : 'НЕТ'}
                </span>
              </div>
            </div>

            {/* Early Check-In */}
            <div className={`rounded-2xl p-5 border-2 transition-all ${
              formData.earlyCheckIn
                ? 'bg-indigo-50 border-indigo-300'
                : 'bg-slate-50 border-transparent'
            }`}>
              <div
                onClick={() => handleChange('earlyCheckIn', !formData.earlyCheckIn)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.earlyCheckIn
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}>
                    {formData.earlyCheckIn && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-600" />
                    Ранний заезд
                  </span>
                </div>
                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg ${
                  formData.earlyCheckIn
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {formData.earlyCheckIn ? 'ДА' : 'НЕТ'}
                </span>
              </div>

              {formData.earlyCheckIn && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Время заезда</p>
                  <input
                    type="time"
                    className="w-full h-12 bg-white rounded-xl px-4 font-bold text-slate-700 border border-indigo-200 focus:border-indigo-400 outline-none transition-all"
                    value={formData.earlyCheckInTime || '08:00'}
                    onChange={(e) => handleChange('earlyCheckInTime', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            {/* Late Check-Out */}
            <div className={`rounded-2xl p-5 border-2 transition-all ${
              formData.lateCheckOut
                ? 'bg-indigo-50 border-indigo-300'
                : 'bg-slate-50 border-transparent'
            }`}>
              <div
                onClick={() => handleChange('lateCheckOut', !formData.lateCheckOut)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.lateCheckOut
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}>
                    {formData.lateCheckOut && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-600" />
                    Поздний выезд
                  </span>
                </div>
                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg ${
                  formData.lateCheckOut
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {formData.lateCheckOut ? 'ДА' : 'НЕТ'}
                </span>
              </div>

              {formData.lateCheckOut && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Время выезда</p>
                  <input
                    type="time"
                    className="w-full h-12 bg-white rounded-xl px-4 font-bold text-slate-700 border border-indigo-200 focus:border-indigo-400 outline-none transition-all"
                    value={formData.lateCheckOutTime || '18:00'}
                    onChange={(e) => handleChange('lateCheckOutTime', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Finance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <Banknote size={14} />
            <span>Расчет стоимости</span>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm w-full">
            <div className="p-5 bg-slate-50/50 space-y-4 border-b border-slate-100">
              <div className="w-full">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">ЦЕНА ЗА СУТКИ</p>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full h-14 bg-white rounded-2xl px-5 font-black text-2xl border border-slate-200 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900"
                    value={formData.dailyPrice === 0 ? '' : formData.dailyPrice}
                    onChange={(e) => handleNumberChange('dailyPrice', e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="0"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₽</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                  <span>{formData.dailyPrice} ₽</span>
                  <X size={12} strokeWidth={4} />
                  <span>{nights} {nights === 1 ? 'ночь' : (nights > 1 && nights < 5 ? 'ночи' : 'ночей')}</span>
                </div>
                <div className="h-px flex-1 mx-4 bg-slate-200" />
                <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl">
                  <Calculator size={22} />
                </div>
              </div>

              <div className="w-full">
                <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-1">ИТОГО К ОПЛАТЕ</p>
                <p className="text-4xl font-black text-indigo-700 leading-none">{formatPrice(formData.totalPrice || 0)}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">ВНЕСЕННАЯ ПРЕДОПЛАТА</p>
                  {remaining > 0 && (
                    <button 
                      type="button" 
                      onClick={() => handleChange('prepayment', formData.totalPrice)}
                      className="text-[10px] bg-emerald-100 text-emerald-700 font-black uppercase px-2.5 py-1 rounded-lg active:bg-emerald-200 transition-colors"
                    >
                      ВСЯ СУММА
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-black text-2xl border border-transparent focus:border-emerald-300 outline-none transition-all text-emerald-700 shadow-inner"
                    value={formData.prepayment === 0 ? '' : formData.prepayment}
                    onChange={(e) => handleNumberChange('prepayment', e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="0"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-300 font-black text-xl">₽</span>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-2xl p-5 flex items-center justify-between shadow-2xl shadow-slate-300 w-full">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">ОСТАЛОСЬ ОПЛАТИТЬ</p>
                  <p className={`text-3xl font-black ${remaining > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {remaining > 0 ? formatPrice(remaining) : 'ОПЛАЧЕНО'}
                  </p>
                </div>
                {remaining === 0 && (
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Banknote size={28} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Comment */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <span>Комментарий</span>
          </div>
          <textarea 
            className="w-full bg-slate-50 rounded-2xl p-5 font-bold text-slate-700 min-h-[140px] outline-none border border-transparent focus:border-indigo-200 transition-all shadow-inner text-lg leading-relaxed"
            placeholder="Особые пожелания или заметки..."
            value={formData.comment}
            onChange={(e) => handleChange('comment', e.target.value)}
          />
        </section>

        {booking && onDelete && (
          <button 
            type="button"
            onClick={() => {
              if (confirm('Удалить это бронирование?')) onDelete(booking.id);
            }}
            className="w-full h-16 bg-rose-50 text-rose-600 font-black uppercase text-xs tracking-[0.2em] rounded-2xl active:bg-rose-100 transition-colors border border-rose-100 mb-8"
          >
            Удалить бронь
          </button>
        )}
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

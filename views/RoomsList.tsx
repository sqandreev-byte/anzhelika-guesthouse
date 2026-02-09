
import React from 'react';
import { Room, Booking } from '../types';
import { ROOMS } from '../constants';
import { formatDate, getMoscowToday } from '../utils';
import { Plus, ArrowRight } from 'lucide-react';

interface RoomsListProps {
  bookings: Booking[];
  onOpenCalendar: (roomId: string) => void;
  onAddBooking: (roomId: string) => void;
  onOpenBooking: (booking: Booking) => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ bookings, onOpenCalendar, onAddBooking, onOpenBooking }) => {
  const now = getMoscowToday();

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 pt-8 pb-24 md:pb-12 no-scrollbar bg-[#f8fafc]">
      <header className="mb-6 px-1">
        <h1 className="text-[34px] font-black text-[#0f172a] leading-tight">Номера</h1>
        <p className="text-slate-500 font-medium text-lg">Ваш жилой фонд</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {ROOMS.map(room => {
          const currentBooking = bookings.find(b => 
            b.roomId === room.id && 
            b.status === 'checked_in'
          );

          return (
            <div key={room.id} className="bg-white rounded-[40px] overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
              {/* Image Section */}
              <div className="h-64 relative">
                <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                {/* Status Badge */}
                <div className="absolute top-5 right-5">
                  <div className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xl ${
                    currentBooking ? 'bg-[#ff4d5e] text-white' : 'bg-[#00c58d] text-white'
                  }`}>
                    {currentBooking ? 'ЗАНЯТ' : 'СВОБОДЕН'}
                  </div>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-white text-3xl font-black mb-1">{room.name}</h2>
                  <p className="text-white/80 text-sm font-bold leading-tight">{room.description}</p>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-5">
                {/* Current Guest Block - Pink Styled */}
                {currentBooking ? (
                  <button 
                    onClick={() => onOpenBooking(currentBooking)}
                    className="w-full bg-[#fff5f6] border border-[#ffebed] p-5 rounded-[28px] flex items-center justify-between active:scale-[0.98] transition-transform text-left"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] text-[#ff4d5e] font-black uppercase tracking-[0.1em] mb-1">СЕЙЧАС В НОМЕРЕ</p>
                      <p className="font-black text-xl text-[#881337]">{currentBooking.guestName}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#ff4d5e]">
                      <ArrowRight size={24} strokeWidth={3} />
                    </div>
                  </button>
                ) : (
                   <div className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[28px] flex items-center justify-center">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Номер готов к заселению</p>
                   </div>
                )}

                {/* Actions Section */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => onOpenCalendar(room.id)}
                    className="flex-[3] h-16 rounded-[22px] bg-[#0f172a] text-white font-black text-base active:scale-[0.97] transition-all shadow-xl shadow-slate-200 flex items-center justify-center tracking-tight"
                  >
                    Календарь
                  </button>
                  <button 
                    onClick={() => onAddBooking(room.id)}
                    className="flex-1 h-16 rounded-[22px] bg-[#4f46e5] text-white flex items-center justify-center active:scale-[0.97] transition-all shadow-xl shadow-indigo-200"
                  >
                    <Plus size={36} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomsList;


import React from 'react';
import { Home, Calendar, DoorOpen, ClipboardList } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'calendar', icon: Calendar, label: 'Календарь' },
    { id: 'rooms', icon: DoorOpen, label: 'Номера' },
    { id: 'bookings', icon: ClipboardList, label: 'Брони' },
  ];

  return (
    <nav className="md:hidden bg-white border-t border-slate-200 pb-safe-area-inset-bottom h-20 flex items-center justify-around px-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-tight uppercase">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;

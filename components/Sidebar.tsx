
import React from 'react';
import { Home, Calendar, DoorOpen, ClipboardList } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'calendar', icon: Calendar, label: 'Календарь' },
    { id: 'rooms', icon: DoorOpen, label: 'Номера' },
    { id: 'bookings', icon: ClipboardList, label: 'Брони' },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Анжелика</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Гостевой дом</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold text-sm">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">
            Система управления гостевым домом
          </p>
          <p className="text-xs text-slate-400 mt-1">v1.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

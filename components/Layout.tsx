
import React from 'react';
import { AppRoute } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate }) => {
  const navItems = [
    { id: AppRoute.DASHBOARD, icon: 'fa-home', label: 'الرئيسية' },
    { id: AppRoute.JOURNEY, icon: 'fa-database', label: 'المسار' },
    { id: AppRoute.ANALYSIS, icon: 'fa-magic', label: 'الفرز' },
    { id: AppRoute.VOICE, icon: 'fa-microphone', label: 'صوتي' },
    { id: AppRoute.MEDS, icon: 'fa-pills', label: 'الصيدلية' },
    { id: AppRoute.SETTINGS, icon: 'fa-user-circle', label: 'الملف' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-72 bg-white border-l border-slate-100 p-8 shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <i className="fas fa-shield-heart text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800">أمان</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${
                activeRoute === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <i className={`fas ${item.icon} text-lg w-6`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-16 md:h-20 bg-white border-b border-slate-50 flex items-center justify-between px-6 shrink-0 z-20">
          <h2 className="text-xl md:text-2xl font-black text-slate-800">
            {navItems.find(i => i.id === activeRoute)?.label || 'الرئيسية'}
          </h2>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 overflow-hidden border-2 border-white shadow-sm">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mother" alt="Avatar" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc] pb-24 md:pb-8">
          {children}
        </div>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 h-20 flex items-center justify-around px-2 pb-2 shadow-2xl z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
                activeRoute === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[8px] font-black mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;

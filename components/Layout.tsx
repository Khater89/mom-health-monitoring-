
import React, { useState, useEffect } from 'react';
import { AppRoute, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate }) => {
  const [isDriveLinked, setIsDriveLinked] = useState(false);

  useEffect(() => {
    const profileStr = localStorage.getItem('aman_profile');
    if (profileStr) {
      const profile: UserProfile = JSON.parse(profileStr);
      setIsDriveLinked(!!profile.driveFolderId);
    }
  }, [activeRoute]);

  const navItems = [
    { id: AppRoute.DASHBOARD, icon: 'fa-home', label: 'الرئيسية' },
    { id: AppRoute.JOURNEY, icon: 'fa-database', label: 'المسار الطبي' },
    { id: AppRoute.ANALYSIS, icon: 'fa-wand-magic-sparkles', label: 'الفرز الذكي' },
    { id: AppRoute.VOICE, icon: 'fa-microphone-alt', label: 'الرفيق الصوتي' },
    { id: AppRoute.MEDS, icon: 'fa-pills', label: 'الصيدلية' },
    { id: AppRoute.SETTINGS, icon: 'fa-user-circle', label: 'الإعدادات' },
  ];

  const handleOpenKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-l border-slate-100 p-8 shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <i className="fas fa-shield-heart text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">أمان</h1>
            <div className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">رعاية الوالدة الذكية</div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold ${
                activeRoute === item.id
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <i className={`fas ${item.icon} text-lg w-6`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 space-y-4">
          <div 
            onClick={() => onNavigate(AppRoute.SETTINGS)}
            className={`p-6 rounded-[2rem] border cursor-pointer transition-all hover:scale-[1.02] ${
              isDriveLinked ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100 animate-pulse'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <i className={`fab fa-google-drive ${isDriveLinked ? 'text-emerald-600' : 'text-amber-600'}`}></i>
              <p className={`text-[10px] font-black uppercase ${isDriveLinked ? 'text-emerald-600' : 'text-amber-600'}`}>حالة المزامنة</p>
            </div>
            <span className="text-xs font-black text-slate-700 leading-tight block">
              {isDriveLinked ? 'متصل بالمجلد السحابي ✅' : 'المزامنة معطلة - اضغط للربط ⏳'}
            </span>
          </div>
          
          <button 
            onClick={handleOpenKey}
            className="w-full p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 hover:bg-slate-100 transition-all font-bold text-xs"
          >
            <i className="fas fa-key"></i>
            إدارة مفتاح الذكاء الاصطناعي
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="md:hidden w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><i className="fas fa-bars"></i></div>
             <h2 className="text-2xl font-black text-slate-800">
               {navItems.find(i => i.id === activeRoute)?.label}
             </h2>
          </div>
          <div className="flex items-center gap-5">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-black text-slate-800">الوالدة دلال</div>
               <div className="text-[10px] text-blue-500 font-bold">بإشراف عائلي مشترك</div>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-blue-50 border-4 border-white shadow-lg overflow-hidden ring-1 ring-slate-100">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mother" alt="Avatar" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

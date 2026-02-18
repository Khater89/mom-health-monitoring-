
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
  }, [activeRoute]); // تحديث الحالة عند التنقل للتأكد من المزامنة

  const navItems = [
    { id: AppRoute.DASHBOARD, icon: 'fa-home', label: 'الرئيسية' },
    { id: AppRoute.JOURNEY, icon: 'fa-database', label: 'المسار السحابي' },
    { id: AppRoute.ANALYSIS, icon: 'fa-wand-magic-sparkles', label: 'الفرز الذكي' },
    { id: AppRoute.VOICE, icon: 'fa-microphone-alt', label: 'الرفيق الصوتي' },
    { id: AppRoute.MEDS, icon: 'fa-pills', label: 'الصيدلية' },
    { id: AppRoute.SETTINGS, icon: 'fa-user-circle', label: 'الملف الشخصي' },
  ];

  const handleOpenKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <aside className="hidden md:flex flex-col w-72 bg-white border-l border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fas fa-shield-heart text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">أمان</h1>
        </div>

        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold ${
                activeRoute === item.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className={`p-6 rounded-[2rem] border transition-all ${isDriveLinked ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <i className={`fab fa-google-drive ${isDriveLinked ? 'text-emerald-600' : 'text-amber-600'}`}></i>
              <p className={`text-[10px] font-black uppercase ${isDriveLinked ? 'text-emerald-600' : 'text-amber-600'}`}>قاعدة البيانات</p>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {isDriveLinked ? 'مزامنة Drive نشطة ✅' : 'بانتظار ربط المجلد ⏳'}
            </span>
          </div>
          
          <button 
            onClick={handleOpenKey}
            className="w-full p-4 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition-colors"
          >
            <i className="fas fa-key"></i>
            <span className="text-xs font-black">مفتاح API</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-800">
              {navItems.find(i => i.id === activeRoute)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-left md:text-right hidden sm:block">
               <div className="text-sm font-bold text-slate-800">الوالدة الغالية</div>
               <div className="text-[10px] text-slate-400 font-bold">قاعدة بيانات سحابية</div>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden ring-2 ring-blue-50">
                <img src="https://picsum.photos/seed/mother/100" alt="Avatar" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

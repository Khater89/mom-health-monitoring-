
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Beaker, 
  Pill, 
  Wallet, 
  MessageSquare,
  Plus,
  TrendingUp,
  Clock,
  ChevronRight,
  Mic,
  Settings as SettingsIcon,
  Zap
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MedicalJourney from './components/MedicalJourney';
import MedicationList from './components/MedicationList';
import AnalysisCenter from './components/AnalysisCenter';
import ChatMentor from './components/ChatMentor';
import VoiceCoach from './components/VoiceCoach';
import Settings from './components/Settings'; // Import Settings
import { AppRoute } from './types';

const App: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.DASHBOARD);

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.DASHBOARD: return <Dashboard />;
      case AppRoute.JOURNEY: return <MedicalJourney />;
      case AppRoute.ANALYSIS: return <AnalysisCenter />;
      case AppRoute.MEDS: return <MedicationList />;
      case AppRoute.AI_CHAT: return <ChatMentor />;
      case AppRoute.VOICE: return <VoiceCoach />;
      case AppRoute.SETTINGS: return <Settings />; // Enable Settings Component
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'الرئيسية', icon: <LayoutDashboard size={20}/>, color: 'blue' },
    { id: AppRoute.JOURNEY, label: 'المسار الطبي', icon: <Stethoscope size={20}/>, color: 'indigo' },
    { id: AppRoute.ANALYSIS, label: 'الفرز الذكي', icon: <Zap size={20}/>, color: 'cyan' },
    { id: AppRoute.MEDS, label: 'الصيدلية', icon: <Pill size={20}/>, color: 'emerald' },
    { id: AppRoute.VOICE, label: 'المرافق الصوتي', icon: <Mic size={20}/>, color: 'rose' },
    { id: AppRoute.AI_CHAT, label: 'مساعد أمان', icon: <MessageSquare size={20}/>, color: 'purple' },
    { id: AppRoute.SETTINGS, label: 'الإعدادات والمزامنة', icon: <SettingsIcon size={20}/>, color: 'slate' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-['Cairo']" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="fixed right-0 top-0 h-full w-72 bg-white border-l border-slate-100 hidden lg:flex flex-col z-50 shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tight">أمان</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Health Hub</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveRoute(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${
                  activeRoute === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <span className={activeRoute === item.id ? 'text-white' : `text-slate-400`}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
                {activeRoute === item.id && <ChevronRight size={16} className="mr-auto" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-50">
          <div className="bg-slate-900 rounded-3xl p-5 text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 mb-1">حالة العائلة</p>
              <h3 className="font-black text-sm">بصحة جيدة جداً</h3>
              <div className="mt-4 flex -space-x-2 space-x-reverse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px]">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i*123}`} alt="avatar" />
                  </div>
                ))}
              </div>
            </div>
            <TrendingUp className="absolute -bottom-2 -left-2 text-white/5 w-24 h-24" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 p-4 lg:p-10 pb-32">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-800">
              {navItems.find(i => i.id === activeRoute)?.label}
            </h2>
            <p className="text-slate-400 text-sm mt-1">مرحباً بك في لوحة تحكم عائلة الأحمد الطبية.</p>
          </div>
          
          <div className="flex gap-3">
             <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
               <Clock size={20} />
             </button>
             <button 
                onClick={() => setActiveRoute(AppRoute.JOURNEY)}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-100 hover:scale-105 transition-transform"
             >
               <Plus size={20} />
               <span>إضافة سريع</span>
             </button>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-[100] shadow-2xl overflow-x-auto no-scrollbar">
        <div className="flex gap-6 min-w-max mx-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveRoute(item.id)}
              className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${
                activeRoute === item.id ? 'text-blue-600 scale-110' : 'text-slate-300'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-black">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;

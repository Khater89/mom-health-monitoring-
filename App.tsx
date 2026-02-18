
import React, { useState, useEffect } from 'react';
import { AppRoute, UserProfile } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VoiceCoach from './components/VoiceCoach';
import AnalysisCenter from './components/AnalysisCenter';
import MedicationList from './components/MedicationList';
import MedicalJourney from './components/MedicalJourney';

const App: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aman_profile');
    return saved ? JSON.parse(saved) : {
      name: 'دلال محمد كتكت',
      age: 61,
      conditions: ['سكري نوع 2', 'ضغط الدم'],
      dietaryRestrictions: ['قليل الصوديوم'],
      driveFolderId: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('aman_profile', JSON.stringify(profile));
  }, [profile]);

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard />;
      case AppRoute.JOURNEY:
        return <MedicalJourney />;
      case AppRoute.ANALYSIS:
        return <AnalysisCenter />;
      case AppRoute.VOICE:
        return <VoiceCoach />;
      case AppRoute.MEDS:
        return <MedicationList />;
      case AppRoute.SETTINGS:
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-right pb-20">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-50">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <i className="fas fa-user-circle text-blue-600"></i>
                الملف الصحي للوالدة
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">الاسم</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={e => setProfile({...profile, name: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-600" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">العمر</label>
                    <input 
                      type="number" 
                      value={profile.age} 
                      onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-600" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-blue-100">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
                <i className="fab fa-google-drive text-blue-600"></i>
                ربط Google Drive
              </h2>
              <p className="text-slate-500 mb-8 font-bold">أدخل "معرّف المجلد" أو رابط المجلد المشترك لتفعيل المزامنة التلقائية والتحليل الذكي.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">معرّف المجلد (Folder ID / Link)</label>
                  <input 
                    type="text" 
                    placeholder="أدخل الرابط أو المعرف هنا..." 
                    value={profile.driveFolderId || ''}
                    onChange={e => setProfile({...profile, driveFolderId: e.target.value})}
                    className="w-full p-5 bg-blue-50/50 rounded-2xl border-2 border-blue-100 font-bold focus:border-blue-500 transition-all text-blue-800"
                  />
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <h4 className="text-sm font-black text-slate-700 mb-2">كيف أحصل على المعرّف؟</h4>
                   <p className="text-xs text-slate-400 leading-relaxed font-bold">
                     1. افتح المجلد في Google Drive.<br/>
                     2. اضغط على "مشاركة" وتأكد أن "أي شخص لديه الرابط" يمكنه العرض.<br/>
                     3. انسخ الرابط والصقه هنا، وسنتعرف نحن على المعرف تلقائياً.
                   </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {renderContent()}
    </Layout>
  );
};

export default App;

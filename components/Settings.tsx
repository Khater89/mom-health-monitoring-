
import React, { useState, useEffect } from 'react';
import { initGoogleDrive, handleAuthClick, handleSignOutClick, backupToDrive, restoreFromDrive } from '../services/driveService';
import { Cloud, Upload, Download, CheckCircle, AlertCircle, LogOut, UserCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    try {
      initGoogleDrive((signedIn) => {
        setIsSignedIn(signedIn);
      });
    } catch (e) {
      console.error("Drive API failed to load", e);
    }
  }, []);

  const handleLogin = () => {
    handleAuthClick();
    // Assuming simple flow, better state management needed for real prod
    setTimeout(() => {
        // Check manually after a delay or pass a callback to handleAuthClick if refactored
        const token = window.gapi?.client?.getToken();
        if(token) setIsSignedIn(true);
    }, 2000);
  };

  const handleLogout = () => {
    handleSignOutClick();
    setIsSignedIn(false);
  };

  const handleBackup = async () => {
    setLoading(true);
    setLastAction(null);
    try {
      await backupToDrive();
      setLastAction({ type: 'success', msg: 'تم النسخ الاحتياطي بنجاح إلى Google Drive' });
    } catch (err) {
      setLastAction({ type: 'error', msg: 'فشل النسخ الاحتياطي. تأكد من الاتصال.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm("تحذير: استعادة النسخة ستمسح البيانات الحالية الموجودة على هذا الجهاز. هل أنت متأكد؟")) return;
    
    setLoading(true);
    setLastAction(null);
    try {
      const date = await restoreFromDrive();
      setLastAction({ type: 'success', msg: `تمت الاستعادة بنجاح (نسخة بتاريخ ${new Date(date).toLocaleDateString()})` });
      setTimeout(() => window.location.reload(), 1500); // Reload to reflect changes
    } catch (err) {
      setLastAction({ type: 'error', msg: 'لم يتم العثور على نسخة احتياطية أو حدث خطأ.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-right">
      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex items-center gap-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-3xl">
          <UserCircle size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">إعدادات الحساب والمزامنة</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">إدارة النسخ الاحتياطي وحماية بيانات العائلة.</p>
        </div>
      </div>

      {/* Google Drive Card */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-blue-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-br-[4rem] opacity-50 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                 <Cloud size={28} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-800">Google Drive Sync</h3>
                 <p className="text-xs font-bold text-slate-400">حفظ سحابي آمن</p>
               </div>
            </div>
            
            {isSignedIn ? (
              <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
                <CheckCircle size={14} /> متصل
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-xs font-black">
                غير متصل
              </span>
            )}
          </div>

          {!isSignedIn ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-bold mb-6">يجب تسجيل الدخول لتمكين المزامنة السحابية</p>
              <button 
                onClick={handleLogin}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 mx-auto hover:scale-105 transition-transform"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                تسجيل الدخول باستخدام Google
              </button>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={handleBackup}
                    disabled={loading}
                    className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex flex-col items-center justify-center gap-3 hover:bg-blue-100 transition-colors group"
                  >
                    <Upload className="text-blue-600 group-hover:scale-110 transition-transform" size={32} />
                    <div className="text-center">
                      <span className="block font-black text-blue-800">نسخ احتياطي الآن</span>
                      <span className="text-[10px] text-blue-400 font-bold">رفع البيانات الحالية للسحابة</span>
                    </div>
                  </button>

                  <button 
                    onClick={handleRestore}
                    disabled={loading}
                    className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex flex-col items-center justify-center gap-3 hover:bg-amber-100 transition-colors group"
                  >
                    <Download className="text-amber-600 group-hover:scale-110 transition-transform" size={32} />
                    <div className="text-center">
                      <span className="block font-black text-amber-800">استعادة النسخة</span>
                      <span className="text-[10px] text-amber-500 font-bold">استرجاع البيانات من السحابة</span>
                    </div>
                  </button>
               </div>

               {lastAction && (
                 <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-black ${lastAction.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {lastAction.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    {lastAction.msg}
                 </div>
               )}

               <div className="pt-4 border-t border-slate-100 text-left">
                  <button onClick={handleLogout} className="text-xs font-bold text-rose-500 flex items-center gap-1 hover:underline">
                    <LogOut size={12} /> تسجيل الخروج
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center text-[10px] text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">
         ملاحظة: يتطلب هذا النظام إعداد Client ID في Google Cloud Console وتمكين Drive API. إذا لم يعمل الزر، يرجى التأكد من الإعدادات في الكود.
      </div>
    </div>
  );
};

export default Settings;

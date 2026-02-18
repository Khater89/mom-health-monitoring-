
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdvancedAdvice, getDeepAnalysis } from '../services/geminiService';
import { UserProfile, MedicalRecord } from '../types';

const MOCK_VITALS = [
  { name: 'السبت', sugar: 140, hb: 10.5 },
  { name: 'الأحد', sugar: 135, hb: 10.7 },
  { name: 'الاثنين', sugar: 150, hb: 10.8 },
  { name: 'الثلاثاء', sugar: 125, hb: 10.9 },
  { name: 'الأربعاء', sugar: 130, hb: 11.0 },
  { name: 'الجمعة', sugar: 110, hb: 10.9 },
];

const Dashboard: React.FC = () => {
  const [doctorOpinion, setDoctorOpinion] = useState('');
  const [adviceData, setAdviceData] = useState<{ text: string; sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [isDriveLinked, setIsDriveLinked] = useState(false);

  useEffect(() => {
    const profileStr = localStorage.getItem('aman_profile');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      setIsDriveLinked(!!profile.driveFolderId);
    }
  }, []);

  const costStats = useMemo(() => {
    const saved = localStorage.getItem('aman_medical_records');
    if (!saved) return { expected: 0, actual: 0 };
    const records: MedicalRecord[] = JSON.parse(saved);
    return records.reduce((acc, curr) => ({
      expected: acc.expected + (curr.expectedCost || 0),
      actual: acc.actual + (curr.actualCost || 0)
    }), { expected: 0, actual: 0 });
  }, []);

  const handleGenerateAdvice = async () => {
    if (!doctorOpinion.trim()) return alert("يرجى إدخال نص للمناقشة.");
    setLoading(true);
    try {
      if (thinkingMode) {
        const text = await getDeepAnalysis(doctorOpinion);
        setAdviceData({ text, sources: [] });
      } else {
        const result = await getAdvancedAdvice({ name: 'دلال' } as UserProfile, doctorOpinion, []);
        setAdviceData(result);
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال بالذكاء الاصطناعي.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20 text-right">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><i className="fas fa-wallet"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black">إجمالي المصاريف</div>
            <div className="text-xl font-black text-slate-800">{costStats.actual.toFixed(1)} JOD</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><i className="fas fa-heartbeat"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black">آخر قراءة سكر</div>
            <div className="text-xl font-black text-slate-800">110 mg/dL</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><i className="fas fa-pills"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black">الأدوية النشطة</div>
            <div className="text-xl font-black text-slate-800">8 أنواع</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><i className="fas fa-calendar-alt"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black">الموعد القادم</div>
            <div className="text-xl font-black text-slate-800">بعد 4 أيام</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <i className="fas fa-chart-line text-blue-600"></i> مراقبة المؤشرات الصحية
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_VITALS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-[10px]" />
                  <YAxis axisLine={false} tickLine={false} className="text-[10px]" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sugar" stroke="#3b82f6" strokeWidth={4} fill="#3b82f610" name="السكر" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {adviceData && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-r-[12px] border-blue-600 animate-slideUp">
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-sparkles text-blue-600"></i> تحليل أمان الذكي
              </h4>
              <div className="prose prose-slate max-w-none text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                {adviceData.text}
              </div>
              {adviceData.sources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                  {adviceData.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-100 transition-colors">
                      <i className="fas fa-external-link-alt ml-1"></i> {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-8 border-blue-600 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">مناقشة ذكية (Gemini 3 Pro)</h3>
            <i className={`fas fa-brain ${loading ? 'animate-pulse text-blue-600' : 'text-slate-200'}`}></i>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-right">
              <div className="text-xs font-black text-slate-700">وضع التفكير العميق</div>
              <div className="text-[9px] text-slate-400 font-bold">للمسائل الطبية المعقدة</div>
            </div>
            <button 
              onClick={() => setThinkingMode(!thinkingMode)}
              className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${thinkingMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>

          <textarea 
            value={doctorOpinion}
            onChange={(e) => setDoctorOpinion(e.target.value)}
            className="w-full h-40 p-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
            placeholder="مثلاً: الطبيب طلب إيقاف دواء الأسبرين، هل هذا آمن بناءً على حالتها؟"
          ></textarea>
          
          <button onClick={handleGenerateAdvice} disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
            {thinkingMode ? "تحليل عميق (Gemini Thinking)" : "استشارة أمان سريعة"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

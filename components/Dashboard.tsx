
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdvancedAdvice } from '../services/geminiService';
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
  const [attachedFiles, setAttachedFiles] = useState<{ file: File; base64: string; isExcel: boolean; text?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    cost: 0,
    title: 'مراجعة طبية مجدولة'
  });

  // حساب إحصائيات التكاليف من localStorage
  const costStats = useMemo(() => {
    const saved = localStorage.getItem('aman_medical_records');
    if (!saved) return { expected: 0, actual: 0 };
    const records: MedicalRecord[] = JSON.parse(saved);
    return records.reduce((acc, curr) => ({
      expected: acc.expected + (curr.expectedCost || 0),
      actual: acc.actual + (curr.actualCost || 0)
    }), { expected: 0, actual: 0 });
  }, []);

  const isExcelFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['xlsx', 'xls', 'csv'].includes(ext || '');
  };

  const getSafeMimeType = (file: File) => {
    if (file.type && file.type !== '') return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return 'image/jpeg';
    }
  };

  const profile: UserProfile = {
    name: 'دلال',
    conditions: ['سكري نوع 2', 'ضغط الدم'],
    dietaryRestrictions: ['قليل الصوديوم'],
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isExcelFile(file)) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        let csv = "";
        workbook.SheetNames.forEach(n => csv += XLSX.utils.sheet_to_csv(workbook.Sheets[n]));
        newFiles.push({ file, base64: '', isExcel: true, text: csv });
      } else {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        newFiles.push({ file, base64, isExcel: false });
      }
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateAdvice = async () => {
    if (!doctorOpinion.trim() && attachedFiles.length === 0) return alert("يرجى إدخال نص أو ملف للمناقشة.");
    setLoading(true);
    try {
      let enhancedOpinion = doctorOpinion;
      attachedFiles.forEach(af => {
        if (af.isExcel && af.text) {
          enhancedOpinion += `\n[محتوى جدول مرفق]:\n${af.text}`;
        }
      });

      const attachments = attachedFiles
        .filter(af => !af.isExcel)
        .map(af => ({ 
          data: af.base64, 
          mimeType: getSafeMimeType(af.file) 
        }));

      const result = await getAdvancedAdvice(profile, enhancedOpinion, attachments);
      setAdviceData(result);
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSchedule = () => {
    // Add source property to fix required field error
    const newRecord: MedicalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      kind: 'visits',
      title: scheduleForm.title,
      date: scheduleForm.date,
      time: scheduleForm.time,
      place: 'سيتم التحديد',
      expectedCost: scheduleForm.cost,
      actualCost: 0,
      currency: 'JOD',
      payments: [],
      attachments: [],
      completed: false,
      recommendations: adviceData?.text || '',
      afterReviewNotes: `رأي الطبيب: ${doctorOpinion}`,
      source: 'manual'
    };

    const saved = localStorage.getItem('aman_medical_records');
    const records = saved ? JSON.parse(saved) : [];
    localStorage.setItem('aman_medical_records', JSON.stringify([newRecord, ...records]));
    
    setShowScheduleModal(false);
    alert("تمت جدولة الزيارة بنجاح.");
    window.location.reload(); // لتحديث إحصائيات التكاليف
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20 text-right">
      {/* Quick Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-wallet"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">إجمالي المصاريف</div>
            <div className="text-xl font-black text-slate-800">{costStats.actual.toFixed(1)} <span className="text-xs">JOD</span></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-amber-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-receipt"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">توقعات متبقية</div>
            <div className="text-xl font-black text-slate-800">{(costStats.expected - costStats.actual > 0 ? costStats.expected - costStats.actual : 0).toFixed(1)} <span className="text-xs">JOD</span></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-red-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-heartbeat"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">آخر قراءة سكر</div>
            <div className="text-xl font-black text-slate-800">110 mg/dL</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-emerald-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-check-circle"></i></div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">حالة الالتزام</div>
            <div className="text-xl font-black text-slate-800">ممتازة</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><i className="fas fa-chart-line text-blue-600"></i> مراقبة المؤشرات</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_VITALS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-[10px]" />
                <YAxis axisLine={false} tickLine={false} className="text-[10px]" />
                <Tooltip />
                <Area type="monotone" dataKey="sugar" stroke="#ef4444" strokeWidth={3} fill="#ef444410" name="السكر" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-4 border-blue-600 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">المناقشة الذكية</h3>
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i className="fas fa-paperclip"></i>
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,application/pdf,.xlsx,.xls,.csv" />
          </div>
          
          <textarea 
            value={doctorOpinion}
            onChange={(e) => setDoctorOpinion(e.target.value)}
            className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-600 font-bold outline-none"
            placeholder="اكتب رأي الطبيب أو ارفعي ملف Excel للمناقشة..."
          ></textarea>

          <button onClick={handleGenerateAdvice} disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : "بدء المناقشة الذكية"}
          </button>
        </div>
      </div>

      {adviceData && (
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-emerald-50 animate-slideUp">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-2xl font-black text-slate-800">تحليل وتوصيات أمان</h3>
            <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2"><i className="fas fa-calendar-check ml-2"></i> جدولة زيارة</button>
          </div>
          <div className="prose prose-slate max-w-none text-right">
            <div className="text-lg text-slate-700 leading-relaxed font-bold whitespace-pre-wrap mb-6">{adviceData.text}</div>
            {adviceData.sources && adviceData.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-400 mb-4">المصادر:</h4>
                <div className="flex flex-wrap gap-3">
                  {adviceData.sources.map((source, idx) => (
                    <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 text-right">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-slideUp">
              <h3 className="text-2xl font-black mb-6 text-slate-800">جدولة زيارة للمسار الطبي</h3>
              <div className="space-y-4">
                <input placeholder="عنوان الزيارة" value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                  <div className="relative">
                    <label className="absolute -top-2 right-4 bg-white px-2 text-[8px] font-black text-blue-500">التكلفة المتوقعة</label>
                    <input type="number" value={scheduleForm.cost} onChange={e => setScheduleForm({...scheduleForm, cost: Number(e.target.value)})} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl border-none font-black" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={handleConfirmSchedule} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">تأكيد الحفظ</button>
                  <button onClick={() => setShowScheduleModal(false)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold">إلغاء</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

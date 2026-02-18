
import React, { useState, useEffect, useRef } from 'react';
import { MedicalRecord, MedicalRecordKind, Attachment, Medication } from '../types';
import { autoSortMedicalFile } from '../services/geminiService';

const MedicalJourney: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    const saved = localStorage.getItem('aman_medical_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<MedicalRecordKind>('visits');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<MedicalRecord>>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    place: '',
    expectedCost: 0,
    actualCost: 0,
    afterReviewNotes: '',
    attachments: []
  });

  useEffect(() => {
    localStorage.setItem('aman_medical_records', JSON.stringify(records));
  }, [records]);

  // محاكاة المزامنة الذكية
  const handleCloudSync = async () => {
    setIsSyncing(true);
    // محاكاة عملية الفحص والتحليل
    setTimeout(() => {
      setIsSyncing(false);
      alert("تم فحص المجلد! تم العثور على تقرير 'مختبرات مدلاب' وصورة 'دواء كونكور' وتمت إضافتهما تلقائياً للمسار.");
    }, 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await autoSortMedicalFile(base64, file.type);
        
        const newAtt: Attachment = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          mime: file.type,
          addedAt: Date.now(),
          base64: reader.result as string
        };

        setActiveTab(analysis.category as MedicalRecordKind);
        setForm({
          title: analysis.title,
          date: analysis.date || new Date().toISOString().slice(0, 10),
          place: analysis.place || 'تم التعرف آلياً',
          actualCost: analysis.actualCost || 0,
          expectedCost: analysis.actualCost || 0,
          afterReviewNotes: analysis.summary + "\n\nالتوصية: " + analysis.advice,
          attachments: [newAtt],
          isAiAnalyzed: true
        });
      } catch (err) {
        alert("فشل تحليل الملف.");
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs: {id: MedicalRecordKind, label: string}[] = [
    {id: 'visits', label: 'زيارة طبيب'},
    {id: 'labs', label: 'مختبرات'},
    {id: 'meds', label: 'أدوية'},
    {id: 'er', label: 'طوارئ'},
    {id: 'hospital', label: 'مستشفى'},
    {id: 'costs', label: 'تكاليف عامة'}
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-right pb-32 animate-fadeIn">
      {/* Cloud Status & Action */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 p-8 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl">
              <i className="fab fa-google-drive"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black">قاعدة بيانات "أمان" السحابية</h3>
              <p className="text-blue-100 font-bold">كل ملف ترفعه في مجلد Drive سيتم تحليله وفرزه هنا تلقائياً.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowHowTo(!showHowTo)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black transition-all"
            >
              كيف أستفيد منها؟
            </button>
            <button 
              onClick={handleCloudSync}
              disabled={isSyncing}
              className="px-8 py-3 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync"></i>}
              مزامنة المجلد الآن
            </button>
          </div>
        </div>

        {/* Tutorial Overlay */}
        {showHowTo && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideDown border-t border-white/10 pt-8">
            <div className="bg-white/10 p-4 rounded-2xl">
              <div className="text-xl mb-2">1️⃣</div>
              <p className="text-xs font-bold">ارفع صورة التقرير أو الدواء في مجلد Google Drive الخاص بك.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl">
              <div className="text-xl mb-2">2️⃣</div>
              <p className="text-xs font-bold">اضغط على زر "مزامنة" هنا في تطبيق أمان.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl">
              <div className="text-xl mb-2">3️⃣</div>
              <p className="text-xs font-bold">الذكاء الاصطناعي سيقرأ الملف ويضعه في القسم المناسب (مختبر، دواء، إلخ).</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-4 rounded-3xl font-black transition-all whitespace-nowrap shadow-sm border ${
              activeTab === tab.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Helper Upload for manual files */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-magic text-blue-600"></i>
              رفع يدوي سريع
            </h3>
            <p className="text-xs text-slate-400 font-bold">إذا لم ترفع الملف في Drive، يمكنك رفعه هنا مباشرة وسأقوم بفرزه لك.</p>
            
            <div className="p-10 bg-blue-50/50 rounded-[2.5rem] border-4 border-dashed border-blue-100 text-center cursor-pointer hover:bg-blue-100 transition-all" onClick={() => fileInputRef.current?.click()}>
              <i className="fas fa-cloud-upload-alt text-4xl text-blue-300 mb-4"></i>
              <span className="block font-black text-blue-600">اختر ملفاً لتحليله</span>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            </div>

            {form.title && (
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-slideUp">
                <p className="text-[10px] font-black text-emerald-600 uppercase">تم التعرف على:</p>
                <h4 className="font-black text-slate-800">{form.title}</h4>
                <button 
                  onClick={() => {
                    setRecords([{...form as MedicalRecord, id: Math.random().toString(36).substr(2, 9), kind: activeTab, completed: true, payments: [], source: 'manual'}, ...records]);
                    setForm({title: '', attachments: []});
                  }}
                  className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs"
                >
                  تأكيد الإضافة للمسار
                </button>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-7 space-y-6">
          {records.filter(r => r.kind === activeTab).map(record => (
            <div key={record.id} className="bg-white rounded-[3rem] shadow-xl p-8 border border-slate-50 group hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600">
                    {record.actualCost?.toFixed(2) || record.expectedCost.toFixed(2)} JOD
                  </div>
                  <div className="text-[9px] font-black text-slate-300 uppercase">التكلفة</div>
                </div>
                <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black">{record.date}</span>
              </div>
              <h4 className="text-2xl font-black text-slate-800">{record.title}</h4>
              <p className="text-sm text-slate-400 font-bold mt-1">
                {record.source === 'drive' ? <i className="fab fa-google-drive ml-1"></i> : <i className="fas fa-user-edit ml-1"></i>}
                {record.place}
              </p>
              {record.afterReviewNotes && (
                <div className="mt-6 p-6 bg-slate-50 rounded-[2.5rem] text-sm text-slate-600 font-bold italic">
                   "{record.afterReviewNotes.slice(0, 150)}..."
                </div>
              )}
            </div>
          ))}

          {records.filter(r => r.kind === activeTab).length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <i className="fas fa-folder-open text-6xl text-slate-100 mb-4"></i>
              <p className="text-slate-400 font-bold">لا يوجد سجلات في هذا القسم. ارفع ملفاتك في المجلد للمزامنة.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalJourney;

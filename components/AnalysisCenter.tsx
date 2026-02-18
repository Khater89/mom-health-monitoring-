
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { analyzeMedicalDocument, analyzeMedicalText } from '../services/geminiService';
import { MedicalRecord, Medication, Payment } from '../types';
import { PAYERS } from '../constants';

const AnalysisCenter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showScheduleModal, setShowScheduleModal] = useState<'meds' | 'labs' | null>(null);
  const [scheduleData, setScheduleData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    cost: 0,
    place: '',
    selectedPayer: PAYERS[0]
  });

  const isExcel = (file: File | null) => {
    if (!file) return false;
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
      default: return 'application/octet-stream'; 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setQuotaError(false);
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    setQuotaError(false);

    try {
      if (isExcel(file)) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        let allContent = "";
        workbook.SheetNames.forEach(name => {
          const worksheet = workbook.Sheets[name];
          allContent += `--- Sheet: ${name} ---\n` + XLSX.utils.sheet_to_csv(worksheet) + "\n";
        });
        
        const analysis = await analyzeMedicalText(allContent);
        setResult(analysis);
      } else {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const mimeType = getSafeMimeType(file);
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
               throw new Error("يرجى رفع الملف كجدول بيانات صحيح ليتم تحليله برمجياً.");
            }
            const analysis = await analyzeMedicalDocument(base64, mimeType);
            setResult(analysis);
          } catch (err: any) {
            handleError(err);
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
        return; 
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      if (isExcel(file)) setLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error("Gemini API Error:", err);
    if (err.message?.includes('429')) {
      setQuotaError(true);
    } else {
      alert("عذراً، " + (err.message || "حدث خطأ غير متوقع."));
    }
  };

  const saveToJourney = (type: 'meds' | 'labs') => {
    if (!result) return;
    
    const payment: Payment[] = scheduleData.cost > 0 ? [{
      id: Math.random().toString(36).substr(2, 9),
      payer: scheduleData.selectedPayer,
      kind: type === 'meds' ? 'دواء' : 'مختبرات',
      amount: scheduleData.cost,
      currency: 'JOD',
      date: scheduleData.date
    }] : [];

    // Add source property to fix required field error
    const mainRecord: MedicalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      kind: type,
      title: type === 'meds' ? "تحليل أدوية من ملف" : "نتائج مختبر من ملف",
      date: scheduleData.date,
      time: scheduleData.time,
      place: scheduleData.place || "تم المسح آلياً",
      expectedCost: scheduleData.cost,
      currency: 'JOD',
      payments: payment,
      attachments: [],
      completed: true,
      recommendations: result.advice,
      afterReviewNotes: result.summary,
      source: 'manual'
    };

    const savedRecords = localStorage.getItem('aman_medical_records');
    const records = savedRecords ? JSON.parse(savedRecords) : [];
    localStorage.setItem('aman_medical_records', JSON.stringify([mainRecord, ...records]));

    if (type === 'meds' && result.medications && result.medications.length > 0) {
      const savedMeds = localStorage.getItem('aman_medications');
      let currentMeds: Medication[] = savedMeds ? JSON.parse(savedMeds) : [];
      
      let addedCount = 0;
      let skippedCount = 0;

      result.medications.forEach((m: any) => {
        // منع التكرار: لا تضف الدواء إذا كان موجوداً ونشطاً بنفس الاسم
        const isDuplicate = currentMeds.find(existing => 
          existing.status === 'active' && 
          existing.nameAr.trim().toLowerCase() === m.nameAr.trim().toLowerCase()
        );

        if (!isDuplicate) {
          // Add source property to fix required field error
          currentMeds.push({
            id: Math.random().toString(36).substr(2, 9),
            nameAr: m.nameAr,
            nameEn: m.nameEn || '',
            scientificName: m.scientificName || '',
            dosage: m.dosage || '',
            time: m.time || '',
            purpose: m.purpose || '',
            categoryAr: m.categoryAr || 'أخرى',
            status: 'active',
            price: 0,
            paidBy: scheduleData.selectedPayer,
            payments: [],
            attachments: [],
            source: 'manual'
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      });

      localStorage.setItem('aman_medications', JSON.stringify(currentMeds));
      alert(`تم بنجاح إضافة ${addedCount} دواء جديد. (تم تخطي ${skippedCount} أدوية مكررة نشطة).`);
    } else {
      alert("تم حفظ السجل الطبي بنجاح.");
    }

    setShowScheduleModal(null);
    setResult(null);
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-32 text-right">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-blue-50 relative overflow-hidden">
        <h2 className="text-3xl font-black text-slate-800 mb-2">مركز التحليل الذكي</h2>
        <p className="text-slate-500 mb-8 font-bold">ارفعي ملف Excel للأدوية أو صورة للتقرير، وسأقوم بفرز "كافة" البيانات آلياً مع منع التكرار.</p>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer flex flex-col items-center justify-center p-12 border-4 border-dashed rounded-[3rem] transition-all duration-500 ${
            file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-blue-50'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-3xl shadow-xl mb-4" />
          ) : isExcel(file) ? (
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-lg">
              <i className="fas fa-file-excel"></i>
            </div>
          ) : (
            <div className="w-20 h-20 bg-white text-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg mb-4">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
          )}
          <span className="block text-lg font-black text-slate-700">{file ? file.name : 'اسحبي ملف Excel أو صورة تقرير هنا'}</span>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={processFile} 
            disabled={!file || loading}
            className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center gap-4"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
            تحليل الملف وفرز الأدوية
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-r-[12px] border-emerald-500 animate-slideUp">
           <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-2xl shadow-inner shrink-0">
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">اكتشاف أمان الذكي</h3>
                  <p className="text-xs text-slate-400 font-black">وجدنا {result.medications?.length || 0} دواء في الملف</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                 <button onClick={() => setShowScheduleModal('meds')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                   <i className="fas fa-pills"></i> حفظ الأدوية غير المكررة
                 </button>
                 <button onClick={() => setShowScheduleModal('labs')} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                   <i className="fas fa-vial"></i> حفظ في سجل المختبر
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg w-fit">ملخص الحالة:</h4>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{result.summary}</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg w-fit">توصية فورية:</h4>
                 <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                    <p className="text-emerald-800 font-black leading-relaxed italic">"{result.advice}"</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-slideUp text-right relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <i className="fas fa-check-circle text-emerald-500"></i>
                  تأكيد وحفظ البيانات
                </h3>
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">المسؤول عن الدفع</label>
                    <select 
                      value={scheduleData.selectedPayer}
                      onChange={e => setScheduleData({...scheduleData, selectedPayer: e.target.value})}
                      className="w-full p-4 bg-blue-50 text-blue-800 rounded-2xl border-none font-black text-lg"
                    >
                      {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">التاريخ</label>
                      <input type="date" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">التكلفة</label>
                      <input type="number" placeholder="0" onChange={e => setScheduleData({...scheduleData, cost: Number(e.target.value)})} className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl border-none font-black text-center" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => saveToJourney(showScheduleModal)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">حفظ ومزامنة</button>
                    <button onClick={() => setShowScheduleModal(null)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold">إلغاء</button>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,.xlsx,.xls,.csv" />
    </div>
  );
};

export default AnalysisCenter;

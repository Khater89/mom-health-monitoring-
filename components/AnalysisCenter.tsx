
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
// Fix: Removed non-existent analyzeMedicalText import member
import { analyzeMedicalDocument } from '../services/geminiService';
import { MedicalRecord, Medication, Payment } from '../types';
import { PAYERS, STORAGE_KEYS } from '../constants';

const AnalysisCenter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPayer, setSelectedPayer] = useState(PAYERS[0]);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeMedicalDocument(base64, file.type || 'image/jpeg');
        setResult(analysis);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("خطأ: " + err.message);
      setLoading(false);
    }
  };

  const saveToPharmacy = () => {
    if (!result?.medications) return;

    // تحميل الأدوية الحالية
    const saved = localStorage.getItem(STORAGE_KEYS.MEDS);
    const currentMeds = saved ? JSON.parse(saved) : [];

    // إضافة الأدوية الجديدة
    const newMeds = result.medications.map((m: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      nameAr: m.nameAr,
      dosage: m.dosage || '',
      purpose: m.purpose || '',
      categoryAr: m.categoryAr || 'أخرى',
      time: 'صباحاً',
      status: 'active',
      paidBy: selectedPayer,
      price: 0,
      attachments: [],
      payments: [],
      source: 'manual'
    }));

    const finalMeds = [...newMeds, ...currentMeds];
    localStorage.setItem(STORAGE_KEYS.MEDS, JSON.stringify(finalMeds));
    
    // إرسال تنبيه للمزامنة الفورية
    window.dispatchEvent(new CustomEvent('aman-meds-updated'));
    
    alert("تمت إضافة " + newMeds.length + " أدوية للصيدلية بنجاح!");
    setResult(null);
    setFile(null);
    setShowConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-32 text-right">
      <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-xl border border-blue-50">
        <h2 className="text-3xl font-black text-slate-800 mb-4 flex items-center gap-4">
           <i className="fas fa-magic text-blue-600"></i> فرز الأدوية الذكي
        </h2>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer p-16 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50 flex flex-col items-center justify-center hover:bg-blue-50 transition-all"
        >
          {preview ? <img src={preview} className="w-32 h-32 object-cover rounded-2xl mb-4" /> : <i className="fas fa-file-medical text-5xl text-blue-200 mb-4"></i>}
          <span className="font-black text-slate-700">{file ? file.name : 'اختاري الوصفة الطبية'}</span>
        </div>

        <button 
          onClick={processFile} 
          disabled={!file || loading}
          className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <i className="fas fa-spinner fa-spin ml-2"></i> : <i className="fas fa-bolt ml-2"></i>}
          تحليل الوصفة الآن
        </button>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-r-[10px] border-emerald-500 animate-slideUp">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">الأدوية المكتشفة</h3>
              <button onClick={() => setShowConfirm(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-md">إضافة للصيدلية</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.medications?.map((m: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                   <div>
                     <div className="font-black text-slate-800">{m.nameAr}</div>
                     <div className="text-[10px] text-blue-500 font-bold">{m.purpose}</div>
                   </div>
                   <div className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg font-black">{m.categoryAr}</div>
                </div>
              ))}
           </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl text-right max-w-sm w-full">
              <h4 className="text-lg font-black mb-4">من المسؤول عن دفع الفاتورة؟</h4>
              <select value={selectedPayer} onChange={e => setSelectedPayer(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold mb-6">
                 {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex gap-4">
                <button onClick={saveToPharmacy} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">تأكيد الحفظ</button>
                <button onClick={() => setShowConfirm(false)} className="px-6 py-4 text-slate-400 font-bold">إلغاء</button>
              </div>
           </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
};

export default AnalysisCenter;

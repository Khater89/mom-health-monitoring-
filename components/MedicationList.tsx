
import React, { useState, useEffect, useRef } from 'react';
import { Medication } from '../types';
import { PAYERS, STORAGE_KEYS, MEDICAL_CATEGORIES } from '../constants';
import { analyzeMedicalDocument } from '../services/geminiService';
import { Pill, Plus, Wand2, Trash2, Repeat, Clock, Activity } from 'lucide-react';

const MedicationList: React.FC = () => {
  const [meds, setMeds] = useState<Medication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDS);
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingMed, setEditingMed] = useState<Partial<Medication> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDS, JSON.stringify(meds));
  }, [meds]);

  const handleAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeMedicalDocument(base64, file.type || 'image/jpeg');
        const m = result.medications?.[0] || {};
        setEditingMed({
          nameAr: m.nameAr || "دواء جديد",
          purpose: m.purpose || result.summary,
          categoryAr: m.categoryAr || "أخرى",
          status: 'active',
          paidBy: PAYERS[0],
          price: result.actualCost || 0,
          isRepeatable: true,
          time: 'صباحاً'
        });
        setIsModalOpen(true);
      } catch (err) { alert("فشل التحليل الذكي."); }
      finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed?.nameAr) return;
    const finalMed: Medication = {
      id: editingMed.id || Math.random().toString(36).substr(2, 9),
      nameAr: editingMed.nameAr,
      purpose: editingMed.purpose || '',
      categoryAr: editingMed.categoryAr || 'أخرى',
      time: editingMed.time || 'صباحاً',
      status: editingMed.status || 'active',
      paidBy: editingMed.paidBy || PAYERS[0],
      price: Number(editingMed.price) || 0,
      isRepeatable: !!editingMed.isRepeatable
    };
    setMeds(editingMed.id ? meds.map(m => m.id === editingMed.id ? finalMed : m) : [finalMed, ...meds]);
    setIsModalOpen(false);
    setEditingMed(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 text-right px-2 pb-24">
      {/* Header */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h3 className="text-xl font-black text-slate-800">صيدلية المنزل</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">قائمة الأدوية المتوفرة ومواعيدها.</p>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => { setEditingMed({ status: 'active', paidBy: PAYERS[0], price: 0 }); setIsModalOpen(true); }} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2">
              <Plus size={18} /> إضافة يدوي
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2">
              {isScanning ? <Wand2 className="animate-spin" /> : <Wand2 size={18} />} مسح علبة الدواء
            </button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {meds.map(med => (
          <div key={med.id} onClick={() => { setEditingMed(med); setIsModalOpen(true); }} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group">
            {med.isRepeatable && <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 px-3 py-1 rounded-bl-xl text-[9px] font-black flex items-center gap-1"><Repeat size={10}/> يكرر</div>}
            <div className="flex justify-between items-center mb-4">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors"><Pill size={24} /></div>
               <p className="text-blue-600 font-black text-sm">{med.price} JOD</p>
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2">{med.nameAr}</h4>
            <div className="flex gap-2 mb-4">
               <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1"><Clock size={10}/> {med.time}</span>
               <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{med.categoryAr}</span>
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed line-clamp-2 italic">{med.purpose || "لا يوجد وصف."}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && editingMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
           <form onSubmit={handleSave} className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[3rem] p-8 shadow-2xl text-right my-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800">بيانات الدواء</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">✕</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">الاسم</label><input value={editingMed.nameAr || ''} onChange={e => setEditingMed({...editingMed, nameAr: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">الوقت</label><input value={editingMed.time || ''} onChange={e => setEditingMed({...editingMed, time: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">التصنيف</label><select value={editingMed.categoryAr || 'أخرى'} onChange={e => setEditingMed({...editingMed, categoryAr: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">{MEDICAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">الغرض</label><textarea value={editingMed.purpose || ''} onChange={e => setEditingMed({...editingMed, purpose: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold h-24" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">السعر</label><input type="number" value={editingMed.price || 0} onChange={e => setEditingMed({...editingMed, price: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">الدافع</label><select value={editingMed.paidBy || PAYERS[0]} onChange={e => setEditingMed({...editingMed, paidBy: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">{PAYERS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                   <div className="flex items-center gap-2"><Repeat className="text-amber-600" size={18} /><span className="text-sm font-black text-amber-900">دواء مكرر؟</span></div>
                   <button type="button" onClick={() => setEditingMed({...editingMed, isRepeatable: !editingMed.isRepeatable})} className={`w-14 h-8 rounded-full transition-all relative ${editingMed.isRepeatable ? 'bg-amber-600' : 'bg-slate-300'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${editingMed.isRepeatable ? 'right-7' : 'right-1'}`}></div></button>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl">حفظ</button>
              </div>
           </form>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleAnalysis} className="hidden" accept="image/*" />
    </div>
  );
};

export default MedicationList;

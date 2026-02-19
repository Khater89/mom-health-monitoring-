
import React, { useState, useEffect, useRef } from 'react';
import { MedicalRecord, MedicalRecordKind } from '../types';
import { analyzeMedicalDocument } from '../services/geminiService';
import { PAYERS, STORAGE_KEYS } from '../constants';
import { 
  Stethoscope, Beaker, Ambulance, Hospital, Wallet, Plus, Wand2, 
  Calendar, Trash2, CheckCircle2, Clock, FileSearch, ArrowLeftRight, 
  AlertCircle, Activity
} from 'lucide-react';

const MedicalJourney: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<MedicalRecordKind>('visits');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<MedicalRecord> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const finalRecord: MedicalRecord = {
      id: editingRecord.id || Math.random().toString(36).substr(2, 9),
      kind: activeTab === 'costs' ? 'costs' : (editingRecord.kind as MedicalRecordKind || activeTab),
      title: editingRecord.title || editingRecord.specialty || 'سجل جديد',
      date: editingRecord.date || new Date().toISOString().slice(0, 10),
      place: editingRecord.place || '',
      specialty: editingRecord.specialty || '',
      doctorName: editingRecord.doctorName || '',
      visitType: editingRecord.visitType || 'كشفية',
      expectedCost: Number(editingRecord.expectedCost) || 0,
      actualCost: Number(editingRecord.actualCost) || 0,
      preVisitNote: editingRecord.preVisitNote || '',
      postVisitNote: editingRecord.postVisitNote || '',
      recommendedBy: editingRecord.recommendedBy || '',
      doctorRecommendations: editingRecord.doctorRecommendations || '',
      afterReviewNotes: editingRecord.afterReviewNotes || '',
      paidBy: editingRecord.paidBy || PAYERS[0],
      attachments: editingRecord.attachments || [],
      completed: !!editingRecord.completed
    };

    setRecords(editingRecord.id ? records.map(r => r.id === editingRecord.id ? finalRecord : r) : [finalRecord, ...records]);
    setShowAddModal(false);
    setEditingRecord(null);
  };

  const tabs = [
    { id: 'visits', label: 'الزيارات', icon: Stethoscope },
    { id: 'labs', label: 'المختبر', icon: Beaker },
    { id: 'hospital', label: 'المستشفى', icon: Hospital },
    { id: 'er', label: 'الطوارئ', icon: Ambulance },
    { id: 'costs', label: 'التكاليف', icon: Wallet },
  ] as const;

  const filteredRecords = activeTab === 'costs' ? records : records.filter(r => r.kind === activeTab);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 pb-24 text-right">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">السجل الطبي العائلي</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">متابعة دقيقة لكافة الزيارات والفحوصات.</p>
        </div>
        <button 
          onClick={() => { setEditingRecord({ kind: activeTab, date: new Date().toISOString().slice(0, 10), completed: false }); setShowAddModal(true); }}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-all"
        >
          <Plus size={18} /> إضافة سجل جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar sticky top-0 bg-[#fcfdfe]/95 backdrop-blur-sm z-30 py-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MedicalRecordKind)}
            className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap border flex items-center gap-2 text-xs transition-all ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg border-blue-600' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
          <div 
            key={record.id} 
            onClick={() => { setEditingRecord(record); setShowAddModal(true); }}
            className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-xl transition-all cursor-pointer relative ${!record.completed ? 'border-r-8 border-r-amber-400' : 'border-r-8 border-r-emerald-500'}`}
          >
            <div className="flex justify-between items-start">
               <div className="text-left">
                  <p className="text-blue-600 font-black text-lg">{record.actualCost || record.expectedCost} JOD</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{record.paidBy}</p>
               </div>
               <div className="text-right">
                  <h4 className="font-black text-slate-800">{record.title}</h4>
                  <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400">
                    {record.date} <Calendar size={12} />
                  </div>
               </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
               {!record.completed ? (
                  <div className="flex items-center gap-2 text-amber-600 text-[10px] font-black bg-amber-50 px-3 py-1 rounded-xl">
                    <Clock size={12} /> قيد الانتظار
                  </div>
               ) : (
                  <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black bg-emerald-50 px-3 py-1 rounded-xl">
                    <CheckCircle2 size={12} /> مكتمل
                  </div>
               )}
               {record.afterReviewNotes && <FileSearch className="text-blue-400" size={16} />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && editingRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
           <form onSubmit={handleSave} className="bg-white w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl animate-slideUp text-right my-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800">بيانات {tabs.find(t=>t.id===activeTab)?.label}</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400">العنوان / الطبيب</label>
                   <input value={editingRecord.title || ''} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" required />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400">التاريخ</label>
                   <input type="date" value={editingRecord.date || ''} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" required />
                </div>
                
                {activeTab === 'labs' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400">بتوصية من</label>
                    <input value={editingRecord.recommendedBy || ''} onChange={e => setEditingRecord({...editingRecord, recommendedBy: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                  </div>
                )}

                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400">الدافع</label>
                   <select value={editingRecord.paidBy || PAYERS[0]} onChange={e => setEditingRecord({...editingRecord, paidBy: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                      {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400">التكلفة (JOD)</label>
                   <input type="number" value={editingRecord.actualCost || 0} onChange={e => setEditingRecord({...editingRecord, actualCost: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                </div>

                <div className="space-y-2 md:col-span-2">
                   <label className="text-xs font-black text-blue-600">ملاحظات / أعراض</label>
                   <textarea value={editingRecord.preVisitNote || ''} onChange={e => setEditingRecord({...editingRecord, preVisitNote: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold h-24" />
                </div>

                {editingRecord.id && (
                  <div className="md:col-span-2 bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <h4 className="font-black text-sm flex items-center gap-2"><Activity size={16}/> المتابعة والنتائج</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500">ملاحظات الطبيب</label>
                        <textarea value={editingRecord.doctorRecommendations || ''} onChange={e => setEditingRecord({...editingRecord, doctorRecommendations: e.target.value})} className="w-full p-4 bg-white rounded-xl border-none font-bold h-24" />
                      </div>
                      
                      <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-blue-50 cursor-pointer h-full min-h-[100px]"
                      >
                         {isScanning ? <Wand2 className="animate-spin text-blue-600" /> : <ArrowLeftRight className="text-blue-300" />}
                         <span className="text-[10px] font-black text-blue-400 mt-2">اضغط لرفع وتحليل التقرير</span>
                      </div>
                    </div>

                    {editingRecord.afterReviewNotes && (
                      <div className="p-4 bg-white rounded-2xl border-r-4 border-emerald-500">
                         <div className="flex items-center gap-2 text-emerald-700 font-black text-xs mb-1"><FileSearch size={14}/> تحليل أمان:</div>
                         <p className="text-xs font-bold text-slate-600 italic">{editingRecord.afterReviewNotes}</p>
                      </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                       <input type="checkbox" checked={editingRecord.completed} onChange={e => setEditingRecord({...editingRecord, completed: e.target.checked})} className="w-5 h-5 accent-emerald-800" />
                       <span className="font-black text-sm">تم الإجراء بنجاح (إغلاق السجل)</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl">حفظ</button>
                {editingRecord.id && <button type="button" onClick={() => { if(confirm('حذف؟')) setRecords(records.filter(r=>r.id!==editingRecord.id)); setShowAddModal(false); }} className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><Trash2 size={24}/></button>}
              </div>
           </form>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editingRecord) return;
        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const analysis = await analyzeMedicalDocument(base64, file.type || 'image/jpeg');
          setEditingRecord(prev => ({ ...prev, afterReviewNotes: analysis.summary, completed: true }));
          setIsScanning(false);
        };
        reader.readAsDataURL(file);
      }} className="hidden" accept="image/*,application/pdf" />
    </div>
  );
};

export default MedicalJourney;

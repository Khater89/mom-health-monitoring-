
import React, { useState, useMemo, useEffect } from 'react';
import { Medication, Payment } from '../types';
import { PAYERS } from '../constants';

const MedicationList: React.FC = () => {
  const [meds, setMeds] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('aman_medications');
    return saved ? JSON.parse(saved) : [];
  });

  // حالات الفلاتر والبحث
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'stopped'>('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // حالات الـ Modal (إضافة/تعديل)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Partial<Medication> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('aman_medications', JSON.stringify(meds));
  }, [meds]);

  const categories = useMemo(() => {
    const cats = new Set(meds.map(m => m.categoryAr || 'أخرى'));
    return ['all', ...Array.from(cats)];
  }, [meds]);

  const filteredMeds = useMemo(() => {
    return meds.filter(med => {
      const matchesSearch = med.nameAr.includes(searchTerm) || (med.nameEn && med.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || med.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || med.categoryAr === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [meds, searchTerm, statusFilter, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingMed({
      id: Math.random().toString(36).substr(2, 9),
      nameAr: '',
      dosage: '',
      time: 'صباحاً',
      dosageSchedule: '',
      status: 'active',
      price: 0,
      paidBy: PAYERS[0],
      purpose: '',
      categoryAr: 'عام'
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingMed?.nameAr || !editingMed?.dosage) {
      setError("يرجى إدخال اسم الدواء والجرعة على الأقل.");
      return;
    }

    // منطق التحقق من التكرار (اسم الدواء + الحالة النشطة)
    const isDuplicate = meds.find(m => 
      m.status === 'active' && 
      m.nameAr.trim() === editingMed.nameAr?.trim() && 
      m.id !== editingMed.id
    );

    if (isDuplicate) {
      setError("هذا الدواء مسجل مسبقاً لهذا المريض وهو 'نشط'. هل تريد التعديل عليه بدلاً من الإضافة؟");
      return;
    }

    if (editingMed.id) {
      const exists = meds.findIndex(m => m.id === editingMed.id);
      if (exists > -1) {
        const updated = [...meds];
        updated[exists] = editingMed as Medication;
        setMeds(updated);
      } else {
        setMeds([editingMed as Medication, ...meds]);
      }
    }
    
    setIsModalOpen(false);
    setEditingMed(null);
    setError(null);
  };

  const toggleMedStatus = (id: string, currentStatus: 'active' | 'stopped') => {
    if (currentStatus === 'active') {
      const reason = prompt("يرجى ذكر سبب إيقاف الدواء (بناءً على مراجعة الطبيب):");
      if (reason === null) return; // إلغاء العملية
      setMeds(meds.map(m => m.id === id ? { ...m, status: 'stopped', stopReason: reason || 'بناءً على مراجعة الطبيب' } : m));
    } else {
      if (confirm("هل تريد إعادة تفعيل هذا الدواء؟")) {
        setMeds(meds.map(m => m.id === id ? { ...m, status: 'active', stopReason: undefined } : m));
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-32 text-right">
      {/* Header & Main Actions */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800">صيدلية الوالدة الذكية</h2>
            <p className="text-slate-400 font-bold">إدارة الجرعات، مراقبة التكاليف، ومنع التكرار الطبي.</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3"
          >
            <i className="fas fa-plus-circle text-xl"></i>
            إضافة دواء جديد
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
          <div className="relative">
            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              placeholder="بحث باسم الدواء..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-slate-50 rounded-2xl border-none font-bold"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600"
          >
            <option value="active">الأدوية النشطة</option>
            <option value="stopped">الأدوية الموقوفة</option>
            <option value="all">كل الأدوية</option>
          </select>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600"
          >
            <option value="all">كل التصنيفات</option>
            {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-2xl font-black">
             {filteredMeds.length} دواء معروض
          </div>
        </div>
      </div>

      {/* Medication Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMeds.map(med => (
          <div 
            key={med.id} 
            onClick={() => { setEditingMed(med); setError(null); setIsModalOpen(true); }}
            className={`bg-white rounded-[2.5rem] shadow-lg border border-slate-100 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group relative ${med.status === 'stopped' ? 'opacity-60 grayscale' : ''}`}
          >
            <div className={`absolute top-0 right-0 w-2 h-full ${med.status === 'active' ? 'bg-blue-500' : 'bg-red-400'}`}></div>
            <div className="p-8 space-y-4">
               <div className="flex justify-between items-start">
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl shadow-inner">
                   <i className="fas fa-pills"></i>
                 </div>
                 {med.paidBy && (
                   <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black">مدفوع بـ: {med.paidBy}</span>
                 )}
               </div>
               
               <div>
                 <h4 className="text-xl font-black text-slate-800">{med.nameAr}</h4>
                 <p className="text-xs text-slate-400 font-bold">{med.scientificName || med.categoryAr}</p>
               </div>

               <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase">
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-500"><i className="fas fa-clock ml-1"></i> {med.time}</div>
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-500"><i className="fas fa-vial ml-1"></i> {med.dosage}</div>
               </div>

               {med.price && med.price > 0 && (
                 <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400">التكلفة:</span>
                    <span className="text-sm font-black text-blue-600">{med.price} JOD</span>
                 </div>
               )}
            </div>
          </div>
        ))}

        {filteredMeds.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <i className="fas fa-box-open text-6xl text-slate-100 mb-4"></i>
             <p className="text-slate-400 font-bold">لم يتم العثور على أدوية تطابق خياراتك.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && editingMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl animate-slideUp relative overflow-hidden text-right">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-16 -mt-16"></div>
              
              <div className="relative z-10 space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800">
                      {editingMed.status === 'stopped' ? 'تفاصيل الدواء الموقوف' : 'إدارة بيانات الدواء'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600"><i className="fas fa-times text-2xl"></i></button>
                 </div>

                 {error && (
                   <div className="p-4 bg-red-50 border-r-4 border-red-500 rounded-xl text-red-700 text-xs font-bold animate-pulse">
                     <i className="fas fa-exclamation-triangle ml-2"></i> {error}
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">اسم الدواء (بالعربي)</label>
                      <input 
                        value={editingMed.nameAr} 
                        onChange={e => setEditingMed({...editingMed, nameAr: e.target.value})}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        placeholder="مثال: كونكور"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">الجرعة</label>
                      <input 
                        value={editingMed.dosage} 
                        onChange={e => setEditingMed({...editingMed, dosage: e.target.value})}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        placeholder="مثال: 5 ملغ"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">الجدول الزمني (فترات أخذ الدواء)</label>
                      <input 
                        value={editingMed.dosageSchedule} 
                        onChange={e => setEditingMed({...editingMed, dosageSchedule: e.target.value})}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        placeholder="مثال: كل 8 ساعات"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">وقت التناول</label>
                      <select 
                        value={editingMed.time}
                        onChange={e => setEditingMed({...editingMed, time: e.target.value})}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                      >
                        <option>صباحاً</option>
                        <option>ظهراً</option>
                        <option>مساءً</option>
                        <option>قبل النوم</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">السعر (التكلفة)</label>
                      <input 
                        type="number"
                        value={editingMed.price} 
                        onChange={e => setEditingMed({...editingMed, price: Number(e.target.value)})}
                        className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl border-none font-black" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">القائم بالدفع</label>
                      <select 
                        value={editingMed.paidBy}
                        onChange={e => setEditingMed({...editingMed, paidBy: e.target.value})}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                      >
                        {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">ملاحظات طبية / غرض الاستخدام</label>
                    <textarea 
                      value={editingMed.purpose}
                      onChange={e => setEditingMed({...editingMed, purpose: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold h-24"
                      placeholder="اكتب أي ملاحظات أو تعليمات من الطبيب هنا..."
                    />
                 </div>

                 {editingMed.status === 'stopped' && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-bold">
                       <strong>سبب الإيقاف:</strong> {editingMed.stopReason}
                    </div>
                 )}

                 <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-50">
                    <button 
                      onClick={handleSave}
                      className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700"
                    >
                      {editingMed.id && meds.find(m => m.id === editingMed.id) ? 'تحديث البيانات' : 'حفظ الدواء الجديد'}
                    </button>
                    
                    {editingMed.id && (
                      <button 
                        onClick={() => toggleMedStatus(editingMed.id!, editingMed.status!)}
                        className={`px-8 py-5 rounded-2xl font-black transition-all ${
                          editingMed.status === 'active' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {editingMed.status === 'active' ? 'إيقاف الدواء 🛑' : 'إعادة تفعيل الدواء ⚡'}
                      </button>
                    )}
                    
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-slate-100 text-slate-400 rounded-2xl font-bold">إلغاء</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MedicationList;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MedicalRecord, MedicalRecordKind, Attachment, Payment } from '../types';
import { autoSortMedicalFile } from '../services/geminiService';
import { PAYERS } from '../constants';

const MedicalJourney: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    const saved = localStorage.getItem('aman_medical_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<MedicalRecordKind>('visits');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // نموذج إدخال الزيارات المحدث ليشمل التاريخ والتخصص ورقم الدكتور
  const [visitForm, setVisitForm] = useState({
    type: 'كشفية',
    specialty: '',
    phone: '',
    cost: 0,
    payer: PAYERS[0],
    date: new Date().toISOString().slice(0, 10),
    doctorNote: ''
  });

  useEffect(() => {
    localStorage.setItem('aman_medical_records', JSON.stringify(records));
  }, [records]);

  // فرز التكاليف بحسب الدافع
  const costSummary = useMemo(() => {
    const summary: Record<string, { total: number, items: any[] }> = {};
    PAYERS.forEach(p => summary[p] = { total: 0, items: [] });

    records.forEach(r => {
      const amount = r.actualCost || r.expectedCost || 0;
      const payer = r.payments?.[0]?.payer || 'أمي';
      if (summary[payer]) {
        summary[payer].total += amount;
        summary[payer].items.push({ title: r.title, amount, date: r.date });
      }
    });
    return summary;
  }, [records]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const mimeType = file.type || 'image/jpeg';
        
        // استخدام Gemini 3 Pro للتحليل العميق
        const analysis = await autoSortMedicalFile(base64, mimeType);
        
        const newRecord: MedicalRecord = {
          id: Math.random().toString(36).substr(2, 9),
          kind: (analysis.category as MedicalRecordKind) || activeTab,
          title: analysis.title || `تحليل آلي: ${file.name}`,
          date: analysis.date || new Date().toISOString().slice(0, 10),
          place: analysis.place || 'تم التعرف آلياً',
          doctorSpecialty: analysis.specialty || '',
          doctorPhone: analysis.phone || '',
          expectedCost: analysis.actualCost || 0,
          actualCost: analysis.actualCost || 0,
          currency: 'JOD',
          recommendations: analysis.recommendations || analysis.summary,
          afterReviewNotes: analysis.summary || '',
          attachments: [{
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            mime: mimeType,
            addedAt: Date.now(),
            base64: reader.result as string
          }],
          completed: true,
          payments: [{
            id: Math.random().toString(36).substr(2, 9),
            payer: PAYERS[0],
            kind: 'آلي',
            amount: analysis.actualCost || 0,
            currency: 'JOD',
            date: analysis.date || new Date().toISOString().slice(0, 10)
          }],
          source: 'manual',
          isAiAnalyzed: true
        };

        setRecords([newRecord, ...records]);
        alert("تم تحليل التقرير وإضافته للمسار بنجاح ✨");
      } catch (err) {
        console.error(err);
        alert("عذراً، فشل التحليل الذكي. يرجى التأكد من وضوح الصورة.");
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddVisit = () => {
    const newRecord: MedicalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      kind: 'visits',
      title: `زيارة: ${visitForm.type}${visitForm.specialty ? ' - ' + visitForm.specialty : ''}`,
      date: visitForm.date,
      place: 'العيادة',
      doctorSpecialty: visitForm.specialty,
      doctorPhone: visitForm.phone,
      expectedCost: visitForm.cost,
      actualCost: visitForm.cost,
      currency: 'JOD',
      payments: [{
        id: Math.random().toString(36).substr(2, 9),
        payer: visitForm.payer,
        kind: 'كشفية',
        amount: visitForm.cost,
        currency: 'JOD',
        date: visitForm.date
      }],
      attachments: [],
      completed: true,
      afterReviewNotes: visitForm.doctorNote,
      source: 'manual'
    };
    setRecords([newRecord, ...records]);
    setVisitForm({ ...visitForm, cost: 0, doctorNote: '', specialty: '', phone: '', date: new Date().toISOString().slice(0, 10) });
    alert("تم تسجيل الزيارة بنجاح.");
  };

  const handleUpdateRecord = (recordId: string, updates: Partial<MedicalRecord>) => {
    const updatedRecords = records.map(r => {
      if (r.id === recordId) {
        const newRecord = { ...r, ...updates };
        if (updates.actualCost !== undefined || (updates.payments && updates.payments[0]?.payer)) {
           const currentPayer = updates.payments?.[0]?.payer || r.payments?.[0]?.payer || 'أمي';
           const currentAmount = updates.actualCost ?? r.actualCost ?? 0;
           newRecord.payments = [{
             ...r.payments[0],
             payer: currentPayer,
             amount: currentAmount,
             date: updates.date || r.date
           }];
        }
        return newRecord;
      }
      return r;
    });
    setRecords(updatedRecords);
    if (selectedRecord?.id === recordId) {
      setSelectedRecord(updatedRecords.find(r => r.id === recordId) || null);
    }
  };

  const tabs: {id: MedicalRecordKind, label: string, icon: string}[] = [
    {id: 'visits', label: 'زيارة طبيب', icon: 'fa-user-md'},
    {id: 'labs', label: 'المختبرات', icon: 'fa-vials'},
    {id: 'meds', label: 'الأدوية', icon: 'fa-pills'},
    {id: 'costs', label: 'كشف التكاليف', icon: 'fa-file-invoice-dollar'},
    {id: 'hospital', label: 'المستشفى', icon: 'fa-hospital'}
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-right pb-32 animate-fadeIn">
      {/* Navigation Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-5 rounded-[2rem] font-black transition-all whitespace-nowrap shadow-sm border flex items-center gap-3 ${
              activeTab === tab.id ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          
          {/* نموذج التسجيل + زر المسح الذكي */}
          {(activeTab === 'visits' || activeTab === 'labs') && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-8 border-blue-600 space-y-6 animate-slideUp relative overflow-hidden">
              {isScanning && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xl font-black text-blue-600 animate-pulse">Gemini يحلل التقرير الآن...</div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">إضافة سجل {activeTab === 'visits' ? 'زيارة' : 'مختبر'}</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                >
                  <i className="fas fa-magic"></i>
                  مسح ذكي للصورة/التقرير
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
              </div>

              {activeTab === 'visits' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">نوع الزيارة</label>
                      <select value={visitForm.type} onChange={e => setVisitForm({...visitForm, type: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                        <option>كشفية</option>
                        <option>مراجعة</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">تخصص الطبيب</label>
                      <input type="text" placeholder="مثال: دكتور عظام" value={visitForm.specialty} onChange={e => setVisitForm({...visitForm, specialty: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم هاتف الطبيب</label>
                      <input type="tel" placeholder="07xxxxxxxx" value={visitForm.phone} onChange={e => setVisitForm({...visitForm, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">تاريخ الزيارة</label>
                      <input type="date" value={visitForm.date} onChange={e => setVisitForm({...visitForm, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">التكلفة (JOD)</label>
                      <input type="number" value={visitForm.cost} onChange={e => setVisitForm({...visitForm, cost: Number(e.target.value)})} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl border-none font-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mr-2">الدافع</label>
                      <select value={visitForm.payer} onChange={e => setVisitForm({...visitForm, payer: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                        {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <textarea placeholder="رأي الطبيب بعد الزيارة (اختياري)..." value={visitForm.doctorNote} onChange={e => setVisitForm({...visitForm, doctorNote: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold h-24" />
                  <button onClick={handleAddVisit} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">حفظ الزيارة يدوياً</button>
                </>
              )}
            </div>
          )}

          {/* التكاليف المفصلة */}
          {activeTab === 'costs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PAYERS.map(payer => (
                  <div key={payer} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-black text-slate-800">{costSummary[payer].total.toFixed(2)} JOD</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">مدفوعات {payer}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {costSummary[payer].items.map((item, i) => (
                        <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs font-bold">
                          <span className="text-slate-600">{item.title} ({item.date})</span>
                          <span className="text-blue-600">{item.amount} JOD</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* قائمة السجلات */}
          {activeTab !== 'costs' && (
            <div className="space-y-4">
              {records.filter(r => r.kind === activeTab).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                <div 
                  key={record.id} 
                  onClick={() => setSelectedRecord(record)}
                  className="bg-white rounded-[2.5rem] shadow-lg p-6 border border-slate-50 hover:shadow-2xl transition-all cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${record.kind === 'labs' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {record.isAiAnalyzed ? <i className="fas fa-sparkles text-sm absolute -mr-8 -mt-8 text-blue-400 animate-pulse"></i> : null}
                      <i className={`fas ${tabs.find(t => t.id === record.kind)?.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{record.title}</h4>
                      <div className="flex gap-2">
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{record.date}</p>
                        {record.doctorSpecialty && <p className="text-[10px] font-black text-blue-500 uppercase">| {record.doctorSpecialty}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-blue-600 font-black">{record.actualCost || record.expectedCost} JOD</div>
                    <div className="text-[9px] font-black text-slate-300 uppercase">بواسطة: {record.payments?.[0]?.payer || 'أمي'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-6 sticky top-8">
            <h3 className="text-xl font-black">إجمالي المصاريف</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">المجموع الكلي</span>
                <span className="text-2xl font-black text-blue-400">{records.reduce((acc, curr) => acc + (curr.actualCost || 0), 0).toFixed(1)} JOD</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] p-10 shadow-2xl animate-slideUp overflow-y-auto max-h-[90vh] text-right">
            <div className="flex justify-between items-start mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-2xl shadow-inner relative">
                    {selectedRecord.isAiAnalyzed && <i className="fas fa-sparkles text-xs absolute top-2 right-2 text-blue-400 animate-pulse"></i>}
                    <i className="fas fa-file-medical"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{selectedRecord.title}</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase">{selectedRecord.date}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedRecord(null)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                 <i className="fas fa-times text-xl"></i>
               </button>
            </div>

            <div className="space-y-8">
              {/* صورة التقرير المرفقة إن وجدت */}
              {selectedRecord.attachments?.[0]?.base64 && (
                <div className="rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner group relative">
                  <img src={selectedRecord.attachments[0].base64} alt="Medical Report" className="w-full h-auto object-cover max-h-64 group-hover:scale-105 transition-transform cursor-zoom-in" onClick={() => window.open(selectedRecord.attachments![0].base64, '_blank')} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black text-slate-700 shadow-sm">صورة التقرير الأصلية</div>
                </div>
              )}

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">تاريخ السجل</label>
                    <input type="date" value={selectedRecord.date} onChange={(e) => handleUpdateRecord(selectedRecord.id, { date: e.target.value })} className="w-full p-3 bg-white rounded-xl border-none font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">تخصص الطبيب</label>
                    <input type="text" value={selectedRecord.doctorSpecialty || ''} onChange={(e) => handleUpdateRecord(selectedRecord.id, { doctorSpecialty: e.target.value })} className="w-full p-3 bg-white rounded-xl border-none font-bold text-sm" placeholder="التخصص" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">رقم الطبيب</label>
                    <input type="tel" value={selectedRecord.doctorPhone || ''} onChange={(e) => handleUpdateRecord(selectedRecord.id, { doctorPhone: e.target.value })} className="w-full p-3 bg-white rounded-xl border-none font-bold text-sm" placeholder="رقم الهاتف" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">التكلفة (JOD)</label>
                    <input type="number" value={selectedRecord.actualCost} onChange={(e) => handleUpdateRecord(selectedRecord.id, { actualCost: Number(e.target.value) })} className="w-full p-3 bg-white rounded-xl border-none font-bold text-sm text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">الدافع</label>
                    <select value={selectedRecord.payments?.[0]?.payer || 'أمي'} onChange={(e) => handleUpdateRecord(selectedRecord.id, { payments: [{ ...selectedRecord.payments[0], payer: e.target.value }] })} className="w-full p-3 bg-white rounded-xl border-none font-bold text-sm">
                      {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {selectedRecord.recommendations && (
                <div className={`p-8 rounded-[2.5rem] border space-y-4 ${selectedRecord.kind === 'labs' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                  <h4 className={`${selectedRecord.kind === 'labs' ? 'text-emerald-800' : 'text-blue-800'} font-black flex items-center gap-2`}>
                    <i className={`fas ${selectedRecord.kind === 'labs' ? 'fa-microscope' : 'fa-sparkles'}`}></i> 
                    {selectedRecord.isAiAnalyzed ? 'التحليل الذكي لـ Gemini' : 'التوصيات الطبية'}
                  </h4>
                  <div className={`${selectedRecord.kind === 'labs' ? 'text-emerald-900' : 'text-blue-900'} font-bold text-sm leading-relaxed whitespace-pre-wrap`}>
                    {selectedRecord.recommendations}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-slate-800 font-black flex items-center gap-2">
                  <i className="fas fa-comment-medical text-blue-600"></i> رأي الطبيب والملاحظات العائلية
                </h4>
                <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] border-none font-bold text-slate-700 min-h-[150px] focus:ring-2 focus:ring-blue-600" placeholder="اكتب هنا ما قاله الطبيب أو أي تحديثات عن الحالة..." value={selectedRecord.afterReviewNotes || ''} onChange={(e) => handleUpdateRecord(selectedRecord.id, { afterReviewNotes: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalJourney;

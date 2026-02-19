
import React, { useState } from 'react';
import { Visit, PayerName } from '../types';
import { Calendar, User, MapPin, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { PAYERS } from '../constants';

const VisitsManager: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([
    {
      id: '1',
      specialty: 'قلب وأوعية دموية',
      doctor_name: 'د. سامر الحلبي',
      visit_date: '2024-06-20',
      visit_type: 'مراجعة دورية',
      status: 'Scheduled',
      cost: 45,
      payer: 'عبدالرحمن',
      pre_visit_note: 'إحضار فحوصات الدم الأخيرة'
    }
  ]);

  const toggleStatus = (id: string) => {
    setVisits(prev => prev.map(v => 
      v.id === id ? { ...v, status: v.status === 'Scheduled' ? 'Completed' : 'Scheduled' } : v
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visits.map(visit => (
          <div key={visit.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={`p-6 ${visit.status === 'Completed' ? 'bg-indigo-50/50' : 'bg-blue-50/50'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  visit.status === 'Completed' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {visit.status === 'Completed' ? 'تمت الزيارة' : 'موعد قادم'}
                </span>
                <button onClick={() => toggleStatus(visit.id)}>
                   {visit.status === 'Completed' ? <CheckCircle2 className="text-indigo-600" /> : <Clock className="text-blue-600" />}
                </button>
              </div>
              <h3 className="text-xl font-black text-slate-800">{visit.specialty}</h3>
              <p className="text-slate-500 text-sm font-bold mt-1 flex items-center gap-2">
                <User size={14} /> {visit.doctor_name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  <span>{visit.visit_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-amber-500" />
                  <span>{visit.cost} JOD ({visit.payer})</span>
                </div>
              </div>

              {visit.pre_visit_note && (
                <div className="p-4 bg-slate-50 rounded-2xl border-r-4 border-amber-400">
                   <p className="text-[10px] text-slate-400 font-black mb-1">ملاحظة قبل الزيارة</p>
                   <p className="text-xs font-bold text-slate-700">{visit.pre_visit_note}</p>
                </div>
              )}

              {visit.status === 'Completed' && (
                <button className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100">
                  إدخال ملاحظات الطبيب
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitsManager;

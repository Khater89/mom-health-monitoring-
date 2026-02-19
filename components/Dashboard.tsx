
import React, { useMemo } from 'react';
import { STORAGE_KEYS, PAYERS } from '../constants';
import { MedicalRecord, Medication } from '../types';
import { 
  Pill, Wallet, TrendingUp, Activity, User2, MessageCircle, AlertCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const records: MedicalRecord[] = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return saved ? JSON.parse(saved) : [];
  }, []);

  const meds: Medication[] = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDS);
    return saved ? JSON.parse(saved) : [];
  }, []);

  const financialSummary = useMemo(() => {
    let totalActual = 0;
    let totalExpected = 0;
    const perPayer: Record<string, number> = {};
    [...PAYERS, "الوالدة", "آخر"].forEach(p => perPayer[p] = 0);

    records.forEach(r => {
      totalActual += Number(r.actualCost) || 0;
      totalExpected += Number(r.expectedCost) || 0;
      const p = r.paidBy || 'آخر';
      perPayer[p] = (perPayer[p] || 0) + (Number(r.actualCost) || 0);
    });

    return { totalActual, totalExpected, perPayer };
  }, [records]);

  const stats = [
    // Corrected icon from Pills to Pill
    { label: 'أدوية نشطة', value: meds.filter(m => m.status === 'active').length.toString(), icon: <Pill />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'المنفق فعلياً', value: `${financialSummary.totalActual.toFixed(1)} JOD`, icon: <Wallet />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'الميزانية المتوقعة', value: `${financialSummary.totalExpected.toFixed(1)} JOD`, icon: <Activity />, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'أكثر مساهم', value: (Object.entries(financialSummary.perPayer) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'لا يوجد', icon: <User2 />, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn text-right pb-24 px-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-3 text-xl shadow-inner`}>
              {stat.icon}
            </div>
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">{stat.label}</div>
            <div className="text-sm font-black text-slate-800">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3 justify-end">
             <span>حالة الميزانية الصحية</span>
             <TrendingUp className="text-blue-600" />
          </h3>
          <div className="space-y-6">
             <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-left"><span className="text-xs font-black text-blue-600">{((financialSummary.totalActual / (financialSummary.totalExpected || 1)) * 100).toFixed(0)}%</span></div>
                  <div className="text-right"><span className="text-xs font-black text-slate-400">كفاءة الصرف</span></div>
                </div>
                <div className="overflow-hidden h-3 mb-4 flex rounded-full bg-slate-100">
                  <div style={{ width: `${Math.min((financialSummary.totalActual / (financialSummary.totalExpected || 1)) * 100, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 rounded-full transition-all duration-1000"></div>
                </div>
             </div>
             <div className="flex gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  تم صرف {financialSummary.totalActual.toFixed(1)} JOD من إجمالي ميزانية مخططة بقيمة {financialSummary.totalExpected.toFixed(1)} JOD. 
                  {financialSummary.totalActual > financialSummary.totalExpected ? ' هناك زيادة طفيفة عن المتوقع هذا الشهر.' : ' الإدارة المالية تحت السيطرة تماماً.'}
                </p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl flex flex-col justify-center text-right overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4 flex items-center gap-3 justify-end">
               <span>رسالة أمان العائلية</span>
               <MessageCircle className="text-amber-400" size={24} />
            </h3>
            <p className="text-slate-300 font-bold text-base leading-loose italic">
              "يا جماعة، الله يجزيكو الخير، المصاريف هالشهر مرتبة والوالدة وضعها الصحي مستقر والحمد لله. بس لا ننسى نحدث مواعيد المختبر أول بأول عشان نضل متبعين."
            </p>
          </div>
          <Activity className="absolute -bottom-10 -left-10 text-white/5 w-64 h-64" />
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
         <h3 className="text-lg font-black text-slate-800 mb-8">توزيع المساهمات المالية (كشف حساب)</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PAYERS.map(payer => {
              const amount = financialSummary.perPayer[payer] || 0;
              const percent = (amount / (financialSummary.totalActual || 1)) * 100;
              return (
                <div key={payer} className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-black text-blue-600">{amount.toFixed(1)} JOD</span>
                      <span className="text-sm font-black text-slate-700">{payer}</span>
                   </div>
                   <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-sm" style={{ width: `${percent}%` }}></div>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;

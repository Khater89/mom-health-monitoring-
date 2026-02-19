
import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, User2, PieChart } from 'lucide-react';
import { PAYERS } from '../constants';

const FinancialDashboard: React.FC = () => {
  const totals = {
    total: 840,
    monthly: 120,
    perPayer: {
      'عبدالرحمن': 320,
      'عبدالرؤوف': 210,
      'مصطفى': 150,
      'خليل': 160
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <Wallet className="absolute -top-4 -left-4 w-32 h-32 text-white/5" />
          <p className="text-slate-400 text-sm font-bold mb-2">إجمالي المصاريف الطبية</p>
          <h2 className="text-4xl font-black">{totals.total} JOD</h2>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-black">
            <ArrowUpRight size={14} />
            <span>+١٥٪ عن العام الماضي</span>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm font-bold mb-2">مصاريف الشهر الحالي</p>
          <h2 className="text-4xl font-black text-slate-800">{totals.monthly} JOD</h2>
          <div className="mt-4 flex items-center gap-2 text-rose-500 text-xs font-black">
            <ArrowDownRight size={14} />
            <span>-٥٪ عن الشهر الماضي</span>
          </div>
        </div>

        <div className="bg-blue-600 rounded-[3rem] p-8 text-white shadow-xl shadow-blue-100">
          <p className="text-blue-200 text-sm font-bold mb-2">الممول الأكثر نشاطاً</p>
          <h2 className="text-4xl font-black">عبدالرحمن</h2>
          <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs font-black">
            <PieChart size={14} />
            <span>يغطي ٣٨٪ من التكاليف</span>
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8">توزيع التكاليف حسب الممول</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(totals.perPayer).map(([name, amount]) => (
            <div key={name} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                     <User2 size={20} />
                   </div>
                   <span className="font-black text-slate-700 text-sm">{name}</span>
                </div>
                <span className="font-black text-blue-600 text-sm">{amount} JOD</span>
              </div>
              <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(amount / totals.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;

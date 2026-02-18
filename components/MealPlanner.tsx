
import React, { useState } from 'react';
import { generateMealPlan } from '../services/geminiService';
import { MealPlan, UserProfile } from '../types';

const MealPlanner: React.FC = () => {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile] = useState<UserProfile>({
    name: 'Sarah',
    stage: 'Postpartum',
    goals: ['Energy', 'Iron Intake'],
    dietaryRestrictions: ['None']
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateMealPlan(profile);
      setPlans(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-gray-800">Healthy Meal Planner</h2>
          <p className="text-gray-500">Personalized weekly nutrition tailored to your stage.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-3 bg-[#a1b5a3] text-white rounded-2xl font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
        >
          {loading ? (
             <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-magic"></i>
          )}
          Generate New Plan
        </button>
      </div>

      {!plans.length && !loading && (
        <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-100 text-center space-y-4">
          <div className="w-20 h-20 bg-[#f7d6d0] text-[#e89b93] rounded-full flex items-center justify-center mx-auto text-3xl">
            <i className="fas fa-utensils"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-700">No plan active</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Click generate to let your AI Mentor create a 7-day plan based on your postpartum goals.</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white h-80 rounded-3xl animate-pulse border border-gray-50"></div>
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-[#a1b5a3] bg-opacity-10 p-4 border-b border-[#a1b5a3] border-opacity-20">
                <h4 className="font-bold text-[#6a8b6e] text-lg">{plan.day}</h4>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Breakfast</p>
                  <p className="text-sm text-gray-700 font-medium">{plan.breakfast}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Lunch</p>
                  <p className="text-sm text-gray-700 font-medium">{plan.lunch}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dinner</p>
                  <p className="text-sm text-gray-700 font-medium">{plan.dinner}</p>
                </div>
                <div className="pt-2 border-t border-gray-50">
                   <p className="text-[10px] uppercase font-bold text-[#e89b93] tracking-wider">Snack</p>
                   <p className="text-sm text-gray-500 italic">{plan.snack}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlanner;

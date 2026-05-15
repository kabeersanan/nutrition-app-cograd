import React from 'react';
import { Zap, Activity, Target } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center py-10 animate-pulse">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-medium">Identifying food & calculating macros...</p>
    </div>
  );
}

export function NutritionResult({ data }) {
  // data expected: { calories, protein, carbs, fats, items: [] }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MacroCard label="Calories" value={data.calories} unit="kcal" icon={<Zap className="text-yellow-500"/>} />
        <MacroCard label="Protein" value={data.protein} unit="g" icon={<Target className="text-red-500"/>} />
        <MacroCard label="Carbs" value={data.carbs} unit="g" icon={<Activity className="text-green-500"/>} />
        <MacroCard label="Fats" value={data.fats} unit="g" icon={<Activity className="text-orange-500"/>} />
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-bold mb-2">Breakdown</h3>
        {data.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1 border-b last:border-0 text-sm">
            <span>{item.name} ({item.portion})</span>
            <span className="font-mono text-gray-600">{item.calories} cal</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col items-center">
      {icon}
      <span className="text-2xl font-bold mt-1">{value}</span>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label} ({unit})</span>
    </div>
  );
}
import React, { useState } from 'react';
import { Zap, Activity, Target } from 'lucide-react';

//A. Loading State
export function LoadingState() {
  return (
    <div className="flex flex-col items-center py-10 animate-pulse">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-medium">Identifying food & calculating macros...</p>
    </div>
  );
}

//B. State Management
export function NutritionResult({ data }) {
  // 1. Initialize state with original items, adding a 'checked' flag
  //adds an empty array mapped, to avoid crashing if missing values found
  const [items, setItems] = useState(
    (data?.items || []).map(item => ({ ...item, checked: true }))
  );

  // Form state for adding missing items
  const [newItemName, setNewItemName] = useState('');
  const [newItemCals, setNewItemCals] = useState('');

  // 2. Dynamically calculate ALL macros based ONLY on checked items
  const activeItems = items.filter(item => item.checked);
  //.reduce runs a for loop in jsx 
  //defaults to zero instead of NaN to avoid crashing
  const currentCalories = activeItems.reduce((sum, item) => sum + (item.calories || 0), 0);
  const currentProtein = activeItems.reduce((sum, item) => sum + (item.protein || 0), 0);
  const currentCarbs = activeItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const currentFats = activeItems.reduce((sum, item) => sum + (item.fats || 0), 0);
  const currentZinc = activeItems.reduce((sum, item) => sum + (item.zinc_mg || 0), 0);
  const currentCalcium = activeItems.reduce((sum, item) => sum + (item.calcium_mg || 0), 0);
  const currentIron = activeItems.reduce((sum, item) => sum + (item.iron_mg || 0), 0);

  // C. Handlers-Toggling
  const toggleItem = (index) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemCals) return;
    
    setItems([...items, { 
      name: newItemName, 
      portion: 'Custom', 
      calories: parseInt(newItemCals, 10),
      protein: 0, carbs: 0, fats: 0, 
      zinc_mg: 0, calcium_mg: 0, iron_mg: 0, 
      checked: true,
      isManual: true 
    }]);
    
    setNewItemName('');
    setNewItemCals('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MacroCard label="Calories" value={currentCalories} unit="kcal" icon={<Zap className="text-yellow-500"/>} />
        <MacroCard label="Protein" value={currentProtein} unit="g" icon={<Target className="text-red-500"/>} />
        <MacroCard label="Carbs" value={currentCarbs} unit="g" icon={<Activity className="text-green-500"/>} />
        <MacroCard label="Fats" value={currentFats} unit="g" icon={<Activity className="text-orange-500"/>} />
      </div>

      <div className="flex justify-between bg-white p-3 rounded-xl shadow-sm border text-sm">
        <div className="flex flex-col items-center flex-1 border-r border-gray-100 last:border-0">
          <span className="text-gray-400 font-medium text-xs uppercase">Zinc</span>
          <span className="font-bold text-gray-700">{currentZinc} <span className="font-normal text-xs">mg</span></span>
        </div>
        <div className="flex flex-col items-center flex-1 border-r border-gray-100 last:border-0">
          <span className="text-gray-400 font-medium text-xs uppercase">Calcium</span>
          <span className="font-bold text-gray-700">{currentCalcium} <span className="font-normal text-xs">mg</span></span>
        </div>
        <div className="flex flex-col items-center flex-1 border-r border-gray-100 last:border-0">
          <span className="text-gray-400 font-medium text-xs uppercase">Iron</span>
          <span className="font-bold text-gray-700">{currentIron} <span className="font-normal text-xs">mg</span></span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-bold mb-3">Breakdown</h3>
        
        {/* Updated Breakdown: Now an interactive checklist */}
        <div className="space-y-2 mb-4">
          {items.map((item, i) => (
            <label key={i} className="flex justify-between py-2 border-b last:border-0 text-sm cursor-pointer items-start group">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(i)}
                  className="rounded text-blue-500 w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col min-w-0">
                  <span className={item.checked ? "text-gray-900" : "text-gray-400 line-through"}>
                    {item.name} ({item.portion}) {item.isManual && <span className="text-xs font-medium text-blue-500 ml-1">Added</span>}
                  </span>
                  <div className={`flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs ${item.checked ? "" : "opacity-40 line-through"}`}>
                    <span className="text-red-500">Protein {item.protein ?? 0}g</span>
                    <span className="text-green-600">Carbs {item.carbs ?? 0}g</span>
                    <span className="text-orange-500">Fats {item.fats ?? 0}g</span>
                  </div>
                </div>
              </div>
              <span className={`font-mono whitespace-nowrap ml-2 ${item.checked ? "text-gray-600" : "text-gray-300 line-through"}`}>
                {item.calories} cal
              </span>
            </label>
          ))}
        </div>

        {/* New inline form to add missing items */}
        <form onSubmit={handleAddItem} className="flex gap-2 text-sm pt-3 border-t border-dashed">
          <input 
            type="text" 
            placeholder="Missing item?" 
            className="flex-1 px-3 py-1.5 border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-300"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Cal" 
            className="w-20 px-3 py-1.5 border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-300"
            value={newItemCals}
            onChange={(e) => setNewItemCals(e.target.value)}
          />
          <button type="submit" className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            Add
          </button>
        </form>
      </div>

      <button className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-sm hover:bg-gray-800 transition-colors">
        Approve & Log Plate
      </button>

      {/* Attribution Footer */}
      <div className="text-center text-xs text-gray-400 mt-2">
        Data sourced via USDA & AI Estimations
      </div>
    </div>
  );
}

//D. MacroCard for repetition
function MacroCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col items-center transition-all hover:shadow-md">
      {icon}
      <span className="text-2xl font-bold mt-1">{value}</span>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label} ({unit})</span>
    </div>
  );
}
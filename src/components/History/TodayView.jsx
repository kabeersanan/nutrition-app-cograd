import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Target, Activity, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { MacroCard } from '../Nutrition/NutritionDisplay';

// Fixed display order so meals always read breakfast -> snack, regardless of the
// order the backend's grouping happened to produce.
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function TodayView() {
  const [data, setData] = useState(null);     // { date, meals_by_type, daily_totals }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useCallback so the same function identity can be reused by useEffect (load on
  // mount) AND by the delete handler (reload after removing a meal).
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/meals?date=today');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not load history. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/meals/${id}`);
      load(); // re-fetch so totals + lists reflect the deletion
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-10">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading today's intake…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl flex flex-col items-center text-center">
        <AlertCircle className="text-red-500 w-10 h-10 mb-2" />
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button onClick={load} className="flex items-center text-red-600 font-bold hover:underline">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </button>
      </div>
    );
  }

  const totals = data.daily_totals;
  const byType = data.meals_by_type;
  const loggedTypes = MEAL_ORDER.filter((t) => byType[t]?.length);

  return (
    <div className="space-y-6">
      {/* Daily total intake — reuses MacroCard so it matches the analyze screen */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Today's Total Intake</h2>
        <div className="grid grid-cols-2 gap-4">
          <MacroCard label="Calories" value={totals.calories} unit="kcal" icon={<Zap className="text-yellow-500" />} />
          <MacroCard label="Protein" value={totals.protein} unit="g" icon={<Target className="text-red-500" />} />
          <MacroCard label="Carbs" value={totals.carbs} unit="g" icon={<Activity className="text-green-500" />} />
          <MacroCard label="Fats" value={totals.fats} unit="g" icon={<Activity className="text-orange-500" />} />
        </div>
        <div className="flex justify-between bg-white p-3 rounded-xl shadow-sm border text-sm mt-4">
          <Micro label="Zinc" value={totals.zinc_mg} />
          <Micro label="Calcium" value={totals.calcium_mg} />
          <Micro label="Iron" value={totals.iron_mg} />
        </div>
      </div>

      {/* Empty state */}
      {loggedTypes.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <p className="font-medium">No meals logged today.</p>
          <p className="text-sm mt-1">Analyze a plate and tap “Approve &amp; Log Plate”.</p>
        </div>
      )}

      {/* Meals grouped by type */}
      {loggedTypes.map((type) => (
        <section key={type}>
          <h3 className="font-bold text-gray-700 capitalize mb-2">{type}</h3>
          <div className="space-y-2">
            {byType[type].map((meal) => (
              <div key={meal.id} className="bg-white p-3 rounded-xl shadow-sm border flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{meal.calories} cal</span>
                    <span className="text-xs text-gray-400">{formatTime(meal.logged_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {meal.items?.map((it) => it.name).join(', ') || '—'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-xs">
                    <span className="text-red-500">P {meal.protein}g</span>
                    <span className="text-green-600">C {meal.carbs}g</span>
                    <span className="text-orange-500">F {meal.fats}g</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="text-gray-300 hover:text-red-500 transition p-1 shrink-0"
                  aria-label="Delete meal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Micro({ label, value }) {
  return (
    <div className="flex flex-col items-center flex-1 border-r border-gray-100 last:border-0">
      <span className="text-gray-400 font-medium text-xs uppercase">{label}</span>
      <span className="font-bold text-gray-700">{value} <span className="font-normal text-xs">mg</span></span>
    </div>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

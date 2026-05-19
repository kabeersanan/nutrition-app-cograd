import { useState } from 'react';

export default function AddFoodForm({ onAddFood }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!foodName || !calories) return;

    onAddFood({
      id: Date.now(), // simple unique ID
      name: foodName,
      calories: parseInt(calories, 10),
      checked: true,
      isManual: true, // Tag for Phase 2 API tracking
    });

    // Reset form
    setFoodName('');
    setCalories('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="add-item-btn"
      >
        + Add missing item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="add-food-form">
      <input 
        type="text" 
        placeholder="Food Name (e.g., Extra Ghee)" 
        value={foodName} 
        onChange={(e) => setFoodName(e.target.value)} 
        required
      />
      <input 
        type="number" 
        placeholder="Calories" 
        value={calories} 
        onChange={(e) => setCalories(e.target.value)} 
        required
      />
      <button type="submit">Add Item</button>
      <button type="button" onClick={() => setIsExpanded(false)}>Cancel</button>
    </form>
  );
}
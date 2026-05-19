export default function NutritionChecklist({ items, onToggle }) {
  return (
    <div className="nutrition-checklist">
      {items.map((item) => (
        <label key={item.id} className="checklist-item">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => onToggle(item.id)}
          />
          <span className="item-name">
            {item.name} {item.isManual && '(Manual)'}
          </span>
          <span className="item-calories">{item.calories} cal</span>
        </label>
      ))}
    </div>
  );
}
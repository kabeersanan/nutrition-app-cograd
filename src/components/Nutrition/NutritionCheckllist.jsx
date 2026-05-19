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
          <div className="item-info">
            <span className="item-name">
              {item.name} {item.isManual && '(Manual)'}
            </span>
            <div className="item-macros">
              <span className="macro macro-protein">Protein {item.protein ?? 0}g</span>
              <span className="macro macro-carbs">Carbs {item.carbs ?? 0}g</span>
              <span className="macro macro-fats">Fats {item.fats ?? 0}g</span>
            </div>
          </div>
          <span className="item-calories">{item.calories} cal</span>
        </label>
      ))}
    </div>
  );
}
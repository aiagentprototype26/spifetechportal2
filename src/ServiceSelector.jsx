import { useState } from "react";
import { SERVICE_CATEGORIES, serviceKey } from "./services";

// selected: array of "Category > Item" strings
// onChange: (newSelectedArray) => void
export default function ServiceSelector({ selected, onChange }) {
  const [openCategory, setOpenCategory] = useState(null);

  const toggleItem = (key) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const categoryKeys = (category, items) => items.map((i) => serviceKey(category, i));

  const isCategoryFullySelected = (category, items) =>
    categoryKeys(category, items).every((k) => selected.includes(k));

  const toggleAllInCategory = (category, items) => {
    const keys = categoryKeys(category, items);
    const allSelected = keys.every((k) => selected.includes(k));
    if (allSelected) {
      onChange(selected.filter((k) => !keys.includes(k)));
    } else {
      onChange([...new Set([...selected, ...keys])]);
    }
  };

  const countSelectedInCategory = (category, items) =>
    categoryKeys(category, items).filter((k) => selected.includes(k)).length;

  return (
    <div className="space-y-2">
      {SERVICE_CATEGORIES.map(({ category, items }) => {
        const isOpen = openCategory === category;
        const selectedCount = countSelectedInCategory(category, items);
        const fullySelected = isCategoryFullySelected(category, items);

        return (
          <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenCategory(isOpen ? null : category)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-slate-700">{category}</span>
              <span className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {selectedCount}/{items.length}
                  </span>
                )}
                <span className="text-slate-400 text-xs">{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>

            {isOpen && (
              <div className="p-3 space-y-2 bg-white">
                <label className="flex items-center gap-2 pb-2 border-b border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fullySelected}
                    onChange={() => toggleAllInCategory(category, items)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-xs font-bold text-slate-600">All {category}</span>
                </label>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {items.map((item) => {
                    const key = serviceKey(category, item);
                    return (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.includes(key)}
                          onChange={() => toggleItem(key)}
                          className="w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                        />
                        <span className="text-xs text-slate-600">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

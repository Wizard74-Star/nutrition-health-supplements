import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Check, Copy, Printer, ChevronDown, ChevronUp,
  Package, Calendar
} from 'lucide-react';
import { MealPlan, generateGroceryList, GroceryItem } from '@/utils/mealPlanGenerator';

const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_COLORS: Record<string, string> = {
  'Fruits': 'bg-red-50 text-red-700 border-red-200',
  'Vegetables': 'bg-green-50 text-green-700 border-green-200',
  'Proteins': 'bg-amber-50 text-amber-700 border-amber-200',
  'Grains': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Dairy': 'bg-blue-50 text-blue-700 border-blue-200',
  'Nuts & Seeds': 'bg-orange-50 text-orange-700 border-orange-200',
  'Fish & Seafood': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Beverages': 'bg-purple-50 text-purple-700 border-purple-200',
  'Snacks': 'bg-pink-50 text-pink-700 border-pink-200',
  'Legumes': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

interface GroceryListProps {
  plan: MealPlan;
}

const GroceryList: React.FC<GroceryListProps> = ({ plan }) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const groceryItems = useMemo(() => {
    return generateGroceryList(plan, selectedDays);
  }, [plan, selectedDays]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    groceryItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [groceryItems]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const toggleCheck = (foodId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(foodId)) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const copyToClipboard = () => {
    const lines: string[] = ['GROCERY LIST', ''];
    Object.entries(groupedByCategory).forEach(([cat, items]) => {
      lines.push(`── ${cat} ──`);
      items.forEach(item => {
        const check = checkedItems.has(item.food.id) ? '[x]' : '[ ]';
        lines.push(`${check} ${item.food.name} (${item.totalServings}x ${item.food.servingSize})`);
      });
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    let html = `<html><head><title>Grocery List</title><style>
      body { font-family: -apple-system, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 15px; margin: 16px 0 6px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      .item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 14px; }
      .checkbox { width: 14px; height: 14px; border: 1.5px solid #999; border-radius: 3px; flex-shrink: 0; }
      .serving { color: #888; font-size: 12px; }
      .subtitle { font-size: 12px; color: #888; margin-bottom: 16px; }
    </style></head><body>`;
    html += `<h1>Grocery List</h1>`;
    html += `<p class="subtitle">${groceryItems.length} items for ${selectedDays.length} days</p>`;
    Object.entries(groupedByCategory).forEach(([cat, items]) => {
      html += `<h2>${cat}</h2>`;
      items.forEach(item => {
        html += `<div class="item"><div class="checkbox"></div><span>${item.food.name}</span><span class="serving">${item.totalServings}x ${item.food.servingSize}</span></div>`;
      });
    });
    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const checkedCount = checkedItems.size;
  const totalCount = groceryItems.length;

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-gray-800">Days to shop for</span>
          </div>
          <button
            onClick={() => setSelectedDays(selectedDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6])}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            {selectedDays.length === 7 ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div className="flex gap-1.5">
          {DAY_LABELS_SHORT.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedDays.includes(i)
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-teal-600" />
          <span className="text-sm font-semibold text-gray-800">
            {totalCount} items
          </span>
          {checkedCount > 0 && (
            <span className="text-xs text-gray-400">
              ({checkedCount} checked)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={printList}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(checkedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Category groups */}
      {totalCount === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Select days above to generate your grocery list.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedByCategory).map(([category, items]) => {
            const isExpanded = !expandedCategories.has(category); // default expanded
            const catChecked = items.filter(i => checkedItems.has(i.food.id)).length;
            const colorClass = CATEGORY_COLORS[category] || 'bg-gray-50 text-gray-700 border-gray-200';

            return (
              <div key={category} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${colorClass}`}>
                      {category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                      {catChecked > 0 && ` · ${catChecked} done`}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1">
                    {items.map(item => {
                      const isChecked = checkedItems.has(item.food.id);
                      return (
                        <button
                          key={item.food.id}
                          onClick={() => toggleCheck(item.food.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                            isChecked
                              ? 'bg-green-50/50 opacity-60'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.food.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {item.totalServings > 1 ? `${item.totalServings}x ` : ''}{item.food.servingSize}
                            </span>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {item.daysNeeded.map(d => (
                              <span key={d} className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                                {DAY_LABELS_SHORT[d]}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroceryList;

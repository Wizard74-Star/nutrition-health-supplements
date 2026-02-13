import React from 'react';

const stats = [
  { value: '2B+', label: 'People with nutrient deficiencies globally' },
  { value: '47+', label: 'Essential nutrients your body requires daily' },
  { value: '80%', label: 'Of deficiencies go undiagnosed for years' },
  { value: '3-5x', label: 'Faster recovery with targeted supplementation' },
];

const StatsBar: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;

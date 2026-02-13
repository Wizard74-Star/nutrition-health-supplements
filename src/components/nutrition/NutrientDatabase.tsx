import React, { useMemo } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { allNutrients, categoryInfo, NutrientCategory } from '@/data/nutrients';
import NutrientCard from './NutrientCard';
import { Search, Filter, Database, ArrowRight } from 'lucide-react';

const NutrientDatabase: React.FC = () => {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, setCurrentView } = useAssessment();

  const categories = [
    { id: 'all', label: 'All Nutrients', count: allNutrients.length },
    ...Object.entries(categoryInfo).map(([id, info]) => ({
      id,
      label: info.label,
      count: info.count
    }))
  ];

  const filteredNutrients = useMemo(() => {
    return allNutrients.filter(n => {
      const matchesCategory = activeCategory === 'all' || n.category === activeCategory;
      const matchesSearch = !searchQuery || 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.alternateNames?.some(an => an.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        n.criticalFor.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.deficiencySymptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.foodSources.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 mb-6">
            <Database className="w-4 h-4 text-teal-600" />
            <span className="text-teal-700 text-sm font-medium">Complete Reference Guide</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Nutrient Database
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Explore our comprehensive database of essential vitamins, minerals, amino acids, and fatty acids.
            Each entry includes RDA, functions, deficiency signs, and food sources.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nutrients, symptoms, food sources..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
              <span className={`ml-2 text-xs ${activeCategory === cat.id ? 'text-gray-400' : 'text-gray-400'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filteredNutrients.length}</span> nutrients
            {searchQuery && <span> matching "<span className="text-teal-600">{searchQuery}</span>"</span>}
          </p>
          <button
            onClick={() => setCurrentView('assessment')}
            className="hidden sm:flex items-center gap-2 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
          >
            Check your deficiencies
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid */}
        {filteredNutrients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredNutrients.map(nutrient => (
              <NutrientCard
                key={nutrient.id}
                nutrient={nutrient}
                onSelect={() => setCurrentView('assessment')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No nutrients found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-4 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NutrientDatabase;

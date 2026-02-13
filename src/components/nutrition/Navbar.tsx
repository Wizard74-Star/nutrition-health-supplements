import React, { useState, useEffect, useRef } from 'react';
import { useAssessment, AppView } from '@/context/AssessmentContext';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';
import { FlaskConical, Menu, X, FileText, User, LogOut, Cloud, ChevronDown, Settings, UtensilsCrossed, Pill, Beaker, ChefHat, Lock, Crown } from 'lucide-react';




import { getAllReports } from '@/utils/reportStorage';
import AuthModal from '@/components/nutrition/AuthModal';


const Navbar: React.FC = () => {
  const { currentView, setCurrentView } = useAssessment();
  const { user, isAuthenticated, signOut, loading: authLoading } = useAuth();
  const { hasPaid, hasFullAccess, isTrialActive, trialDaysRemaining } = usePayment();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update report count when view changes (to catch new saves)
  useEffect(() => {
    setReportCount(getAllReports().length);
  }, [currentView]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems: { label: string; view: AppView; badge?: number; icon?: 'reports' | 'tracker' | 'supplements' | 'blood-tests' | 'meal-plans' }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Nutrient Database', view: 'database' },
    { label: 'Assessment', view: 'assessment' },
    { label: 'Food Tracker', view: 'food-tracker', icon: 'tracker' },
    { label: 'Meal Plans', view: 'meal-plans', icon: 'meal-plans' },
    { label: 'Supplements', view: 'supplements', icon: 'supplements' },
    { label: 'Blood Tests', view: 'blood-tests', icon: 'blood-tests' },
    { label: 'My Reports', view: 'reports', badge: reportCount, icon: 'reports' },
    { label: 'Book Analysis', view: 'booking' },
  ];





  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSignIn = () => {
    setAuthModalTab('signin');
    setAuthModalOpen(true);
    setMobileOpen(false);
  };

  const openSignUp = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    setUserMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const name = user.user_metadata?.full_name;
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || '?';
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email || '';
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-shadow">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className={`text-lg font-bold leading-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                  NutriAnalysis
                </span>
                <span className={`text-[10px] uppercase tracking-widest leading-tight transition-colors ${scrolled ? 'text-teal-600' : 'text-teal-300'}`}>
                  Precision Nutrition
                </span>
              </div>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === item.view
                      ? scrolled
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-white/15 text-white'
                      : scrolled
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.icon === 'reports' ? (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`ml-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold ${
                          scrolled
                            ? 'bg-teal-500 text-white'
                            : 'bg-white/25 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </span>
                  ) : item.icon === 'tracker' ? (
                    <span className="inline-flex items-center gap-1">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  ) : item.icon === 'supplements' ? (
                    <span className="inline-flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  ) : item.icon === 'blood-tests' ? (
                    <span className="inline-flex items-center gap-1">
                      <Beaker className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  ) : item.icon === 'meal-plans' ? (
                    <span className="inline-flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  ) : (
                    item.label
                  )}



                </button>
              ))}

              {/* Auth section */}
              {!authLoading && (
                <>
                  {isAuthenticated ? (
                    <div className="relative ml-2" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                          scrolled
                            ? 'hover:bg-gray-50 text-gray-700'
                            : 'hover:bg-white/10 text-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {getUserInitials()}
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* User dropdown menu */}
                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                          {/* User info */}
                          {/* User info */}
                          <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                {getUserInitials()}
                              </div>
                              <div className="flex-1 min-w-0">
                                {user?.user_metadata?.full_name && (
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user.user_metadata.full_name}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2.5 px-2 py-1 bg-green-50 rounded-lg w-fit">
                              <Cloud className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-700 font-medium">Reports syncing to cloud</span>
                            </div>
                          </div>

                          {/* Upgrade to Pro banner for unpaid users */}
                          {!hasPaid && (
                            <div className="mx-2 mt-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Crown className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-800">Upgrade to Pro</span>
                              </div>
                              <p className="text-[11px] text-amber-700 mb-2">Unlock all features for just €5.49</p>
                              <button
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  handleNav('assessment');
                                }}
                                className="w-full py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors"
                              >
                                Get Pro Access
                              </button>
                            </div>
                          )}

                          {/* Menu items */}
                          <div className="p-2">
                            <button
                              onClick={() => {
                                handleNav('profile');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4 text-gray-400" />
                              Account Settings
                            </button>
                            <button
                              onClick={() => {
                                handleNav('food-tracker');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                              Food Tracker
                            </button>
                            <button
                              onClick={() => {
                                handleNav('supplements');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Pill className="w-4 h-4 text-gray-400" />
                              Supplements
                            </button>
                            <button
                              onClick={() => {
                                handleNav('blood-tests');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Beaker className="w-4 h-4 text-gray-400" />
                              Blood Tests
                            </button>
                            <button
                              onClick={() => {
                                handleNav('meal-plans');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ChefHat className="w-4 h-4 text-gray-400" />
                              Meal Plans
                            </button>
                            <button
                              onClick={() => {
                                handleNav('reports');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="w-4 h-4 text-gray-400" />
                              My Reports

                              {reportCount > 0 && (
                                <span className="ml-auto text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">
                                  {reportCount}
                                </span>
                              )}
                            </button>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={handleSignOut}
                              disabled={isSigningOut}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                            >
                              <LogOut className="w-4 h-4" />
                              {isSigningOut ? 'Signing out...' : 'Sign Out'}
                            </button>
                          </div>


                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openSignIn}
                      className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        scrolled
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                          : 'border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Sign In
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => handleNav('assessment')}
                className="ml-3 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
              >
                Start Free Assessment
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-700' : 'text-white'}`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-3 space-y-1">
              {/* User info on mobile */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {getUserInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {user.user_metadata?.full_name && (
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.user_metadata.full_name}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-md">
                    <Cloud className="w-3 h-3 text-green-500" />
                  </div>
                </div>
              )}

              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    currentView === item.view
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.icon === 'reports' && <FileText className="w-4 h-4" />}
                    {item.icon === 'tracker' && <UtensilsCrossed className="w-4 h-4" />}
                    {item.icon === 'supplements' && <Pill className="w-4 h-4" />}
                    {item.icon === 'blood-tests' && <Beaker className="w-4 h-4" />}
                    {item.icon === 'meal-plans' && <ChefHat className="w-4 h-4" />}
                    {item.label}
                  </span>



                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[20px] h-[20px] flex items-center justify-center px-1.5 rounded-full text-[10px] font-bold bg-teal-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              {/* Auth buttons on mobile */}
              {!authLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => handleNav('profile')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          currentView === 'profile'
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={openSignIn}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={openSignUp}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </>
              )}


              <button
                onClick={() => handleNav('assessment')}
                className="w-full mt-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold rounded-xl"
              >
                Start Free Assessment
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </>
  );
};

export default Navbar;

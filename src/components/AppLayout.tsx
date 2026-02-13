import React, { useEffect, useState } from 'react';
import { AssessmentProvider, useAssessment } from '@/context/AssessmentContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PaymentProvider, usePayment } from '@/context/PaymentContext';
import { StripeModeProvider } from '@/context/StripeModeContext';
import Navbar from './nutrition/Navbar';
import TrialBanner from './nutrition/TrialBanner';

import Hero from './nutrition/Hero';
import StatsBar from './nutrition/StatsBar';
import NutrientOverview from './nutrition/NutrientOverview';
import QuickSymptomChecker from './nutrition/QuickSymptomChecker';
import HowItWorks from './nutrition/HowItWorks';
import CommonDeficiencies from './nutrition/CommonDeficiencies';
import WhyBloodAnalysis from './nutrition/WhyBloodAnalysis';
import Testimonials from './nutrition/Testimonials';
import FAQ from './nutrition/FAQ';
import Footer from './nutrition/Footer';
import NutrientDatabase from './nutrition/NutrientDatabase';
import SymptomAssessment from './nutrition/SymptomAssessment';
import ResultsDashboard from './nutrition/ResultsDashboard';
import BookAnalysis from './nutrition/BookAnalysis';
import AdminDashboard from './nutrition/AdminDashboard';
import MyReports from './nutrition/MyReports';
import ResetPasswordView from './nutrition/ResetPasswordView';
import UserProfile from './nutrition/UserProfile';
import SharedReportView from './nutrition/SharedReportView';
import DailyFoodTracker from './nutrition/DailyFoodTracker';
import SupplementTracker from './nutrition/SupplementTracker';
import BloodTestTracker from './nutrition/BloodTestTracker';
import MealPlanBuilder from './nutrition/MealPlanBuilder';
import PaywallModal from './nutrition/PaywallModal';
import AuthModal from './nutrition/AuthModal';

// Views that require payment OR active trial
const PREMIUM_VIEWS = new Set([
  'database',
  'assessment',
  'results',
  'booking',
  'reports',
  'profile',
  'food-tracker',
  'supplements',
  'blood-tests',
  'meal-plans',
]);

const AppContent: React.FC = () => {
  const { currentView, setCurrentView } = useAssessment();
  const { isRecoveryMode, clearRecoveryMode, isAuthenticated } = useAuth();
  const {
    hasPaid,
    loading: paymentLoading,
    hasFullAccess,
    isTrialActive,
    isTrialExpired,
    trial,
    trialLoading,
    setShowPaywall: setPaymentShowPaywall,
    showPaywall: paymentShowPaywall,
  } = usePayment();
  const [sharedLinkId, setSharedLinkId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthForPaywall, setShowAuthForPaywall] = useState(false);
  const [pendingView, setPendingView] = useState<string | null>(null);

  // Sync paywall state from PaymentContext (for TrialBanner upgrade button)
  useEffect(() => {
    if (paymentShowPaywall && !showPaywall) {
      setShowPaywall(true);
      setPaymentShowPaywall(false);
    }
  }, [paymentShowPaywall]);

  // Parse hash for shared links and admin route
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const shareMatch = hash.match(/^#\/share\/([a-zA-Z0-9]+)$/);
      if (shareMatch) {
        const linkId = shareMatch[1];
        setSharedLinkId(linkId);
        setCurrentView('shared-report');
        return;
      }
      if (hash === '#/admin' || hash === '#admin') {
        setCurrentView('admin');
        return;
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [setCurrentView]);

  // Update hash when navigating to/from admin
  useEffect(() => {
    if (currentView === 'admin') {
      window.location.hash = '#/admin';
    } else if (currentView === 'shared-report' && sharedLinkId) {
      window.location.hash = `#/share/${sharedLinkId}`;
    } else if (
      window.location.hash === '#/admin' ||
      window.location.hash === '#admin' ||
      window.location.hash.startsWith('#/share/')
    ) {
      if (currentView !== 'admin' && currentView !== 'shared-report') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [currentView, sharedLinkId]);

  // Check premium access when view changes — now uses hasFullAccess (paid OR trial)
  useEffect(() => {
    if (paymentLoading || trialLoading) return;
    
    if (PREMIUM_VIEWS.has(currentView) && !hasFullAccess) {
      if (!isAuthenticated) {
        // Need to sign in first
        setPendingView(currentView);
        setShowAuthForPaywall(true);
        setCurrentView('home');
      } else {
        // Signed in but no access (no payment, no active trial)
        setPendingView(currentView);
        setShowPaywall(true);
        setCurrentView('home');
      }
    }
  }, [currentView, hasFullAccess, isAuthenticated, paymentLoading, trialLoading]);

  // After auth, check if we need to show paywall
  useEffect(() => {
    if (isAuthenticated && pendingView && showAuthForPaywall) {
      setShowAuthForPaywall(false);
      if (!hasFullAccess && !paymentLoading && !trialLoading) {
        setShowPaywall(true);
      } else if (hasFullAccess) {
        setCurrentView(pendingView as any);
        setPendingView(null);
      }
    }
  }, [isAuthenticated, hasFullAccess, paymentLoading, trialLoading, pendingView, showAuthForPaywall]);

  // After successful payment or trial start, navigate to pending view
  useEffect(() => {
    if (hasFullAccess && pendingView && !showPaywall) {
      setCurrentView(pendingView as any);
      setPendingView(null);
    }
  }, [hasFullAccess, pendingView, showPaywall]);

  // Auto-show paywall when trial expires while user is on a premium view
  useEffect(() => {
    if (
      isTrialExpired &&
      !hasPaid &&
      trial &&
      !trial.converted_to_paid &&
      PREMIUM_VIEWS.has(currentView) &&
      !showPaywall
    ) {
      setShowPaywall(true);
      setCurrentView('home');
    }
  }, [isTrialExpired, hasPaid, trial, currentView]);

  if (isRecoveryMode) {
    return (
      <ResetPasswordView
        onComplete={() => {
          clearRecoveryMode();
          setCurrentView('home');
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'database':
        return <div className="pt-16 lg:pt-20"><NutrientDatabase /></div>;
      case 'assessment':
        return <div className="pt-16 lg:pt-20"><SymptomAssessment /></div>;
      case 'results':
        return <div className="pt-16 lg:pt-20"><ResultsDashboard /></div>;
      case 'booking':
        return <div className="pt-16 lg:pt-20"><BookAnalysis /></div>;
      case 'admin':
        return <div className="pt-16 lg:pt-20"><AdminDashboard /></div>;
      case 'reports':
        return <div className="pt-16 lg:pt-20"><MyReports /></div>;
      case 'profile':
        return <div className="pt-16 lg:pt-20"><UserProfile /></div>;
      case 'food-tracker':
        return <div className="pt-16 lg:pt-20"><DailyFoodTracker /></div>;
      case 'supplements':
        return <div className="pt-16 lg:pt-20"><SupplementTracker /></div>;
      case 'blood-tests':
        return <div className="pt-16 lg:pt-20"><BloodTestTracker /></div>;
      case 'meal-plans':
        return <div className="pt-16 lg:pt-20"><MealPlanBuilder /></div>;
      case 'shared-report':
        return (
          <SharedReportView
            linkId={sharedLinkId || ''}
            onBack={() => {
              setSharedLinkId(null);
              setCurrentView('home');
              history.replaceState(null, '', window.location.pathname + window.location.search);
              window.scrollTo({ top: 0 });
            }}
          />
        );
      default:
        return (
          <>
            <Hero />
            <StatsBar />
            <NutrientOverview />
            <QuickSymptomChecker />
            <HowItWorks />
            <CommonDeficiencies />
            <WhyBloodAnalysis />
            <Testimonials />
            <FAQ />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      {currentView !== 'shared-report' && <Navbar />}
      
      {/* Trial Banner - shows below navbar */}
      {currentView !== 'shared-report' && currentView !== 'admin' && <TrialBanner />}
      
      {/* Main Content */}
      {renderView()}
      
      {/* Footer */}
      {currentView !== 'admin' && currentView !== 'shared-report' && <Footer />}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          setPendingView(null);
        }}
      />

      {/* Auth Modal for paywall flow */}
      <AuthModal
        isOpen={showAuthForPaywall}
        onClose={() => {
          setShowAuthForPaywall(false);
          setPendingView(null);
        }}
        initialTab="signup"
      />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <AuthProvider>
      <PaymentProvider>
        <StripeModeProvider>
          <AssessmentProvider>
            <AppContent />
          </AssessmentProvider>
        </StripeModeProvider>
      </PaymentProvider>
    </AuthProvider>
  );
};

export default AppLayout;

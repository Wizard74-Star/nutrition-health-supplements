import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface StripeModeState {
  isTestMode: boolean;
  testPublishableKey: string;
  livePublishableKey: string;
  connectedAccountId: string;
  activePublishableKey: string;
  toggleMode: () => void;
  setTestMode: (enabled: boolean) => void;
  setTestPublishableKey: (key: string) => void;
}

const STORAGE_KEY_MODE = 'stripe_test_mode';
const STORAGE_KEY_TEST_PK = 'stripe_test_publishable_key';

const LIVE_PUBLISHABLE_KEY = 'pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ';
const CONNECTED_ACCOUNT_ID = 'acct_1SzkAFHSLmarPO6d';

// Default test key placeholder - user should replace with their own from Stripe Dashboard
const DEFAULT_TEST_KEY = '';

const StripeModeContext = createContext<StripeModeState | undefined>(undefined);

export const StripeModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MODE);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [testPublishableKey, setTestPublishableKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TEST_PK) || DEFAULT_TEST_KEY;
    } catch {
      return DEFAULT_TEST_KEY;
    }
  });

  // Persist mode changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, String(isTestMode));
    } catch {}
  }, [isTestMode]);

  // Persist test key changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEST_PK, testPublishableKey);
    } catch {}
  }, [testPublishableKey]);

  const toggleMode = useCallback(() => {
    setIsTestMode(prev => !prev);
  }, []);

  const setTestMode = useCallback((enabled: boolean) => {
    setIsTestMode(enabled);
  }, []);

  const setTestPublishableKey = useCallback((key: string) => {
    setTestPublishableKeyState(key);
  }, []);

  const activePublishableKey = isTestMode ? testPublishableKey : LIVE_PUBLISHABLE_KEY;

  return (
    <StripeModeContext.Provider
      value={{
        isTestMode,
        testPublishableKey,
        livePublishableKey: LIVE_PUBLISHABLE_KEY,
        connectedAccountId: CONNECTED_ACCOUNT_ID,
        activePublishableKey,
        toggleMode,
        setTestMode,
        setTestPublishableKey,
      }}
    >
      {children}
    </StripeModeContext.Provider>
  );
};

export const useStripeMode = () => {
  const context = useContext(StripeModeContext);
  if (!context) throw new Error('useStripeMode must be used within StripeModeProvider');
  return context;
};


import React, { useState } from 'react';
import { AppContextProvider } from './contexts/AppContext';
import { useAppContext } from './hooks/useAppContext';
import Dashboard from './components/Dashboard';
import NotificationContainer from './components/NotificationContainer';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardSelector from './components/DashboardSelector';
import AiChatAssistant from './components/AiChatAssistant';
import OnboardingGuide from './components/OnboardingGuide';

const AppContent: React.FC = () => {
    const { state, isReady } = useAppContext();
    const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
            </div>
        );
    }
    
    if (!state.currentUser) {
      if (authScreen === 'login') {
        return <LoginPage onSwitchToRegister={() => setAuthScreen('register')} />;
      }
      return <RegisterPage onSwitchToLogin={() => setAuthScreen('login')} />;
    }

    if (!state.activeDashboard) {
        return <DashboardSelector />;
    }
    
    return (
        <>
            <Dashboard onOpenAiChat={() => setIsAiChatOpen(true)} />
            {state.currentUser.needsOnboarding && <OnboardingGuide />}
            <NotificationContainer />
            {isAiChatOpen && <AiChatAssistant onClose={() => setIsAiChatOpen(false)} />}
        </>
    );
};


const App: React.FC = () => {
  return (
    <AppContextProvider>
        <AppContent />
    </AppContextProvider>
  );
};

export default App;
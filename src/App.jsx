import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AuthBar from './components/AuthBar';
import LanguageSelector from './components/LanguageSelector';
import LandingHero from './components/LandingHero';
import ChatInterface from './components/ChatInterface';
import PeopleManager from './components/PeopleManager';
import PersonForm from './components/PersonForm';
import Footer from './components/Footer';
import SampleConversation from './components/SampleConversation';

function AppContent() {
  const {
    showChat,
    showPersonForm,
    showPeopleManager,
    showForm,
    setShowForm,
  } = useApp();

  const [stage, setStage] = useState('hero'); // hero -> conversation -> form

  const handleStartJourney = () => {
    setStage('conversation');
  };

  // conversation 끝나면 form 표시 (SampleConversation에서 호출)
  useEffect(() => {
    if (showForm && stage === 'conversation') {
      setStage('form');
    }
  }, [showForm, stage]);

  const isModalOpen = showChat || showPersonForm || showPeopleManager;

  return (
    <div className="min-h-screen bg-dark text-cream font-serif overflow-hidden">
      {/* Auth Bar */}
      {stage === 'hero' && !isModalOpen && <AuthBar />}

      {/* Language Selector */}
      {stage === 'hero' && !isModalOpen && <LanguageSelector />}

      {/* Hero Screen */}
      {stage === 'hero' && !isModalOpen && (
        <div className="h-screen flex items-center justify-center animate-fadeIn">
          <LandingHero onStart={handleStartJourney} />
        </div>
      )}

      {/* Conversation Animation Screen */}
      {stage === 'conversation' && !isModalOpen && (
        <div className="h-screen flex items-center justify-center p-4 animate-fadeIn">
          <SampleConversation onComplete={() => setShowForm(true)} />
        </div>
      )}

      {/* Form Screen */}
      {stage === 'form' && !isModalOpen && (
        <div className="min-h-screen animate-fadeIn">
          <PersonForm isInitialForm={true} />
        </div>
      )}

      {/* Footer */}
      {stage === 'form' && !isModalOpen && <Footer />}

      {/* Chat Interface Modal */}
      {showChat && <ChatInterface />}

      {/* People Manager Modal */}
      <PeopleManager />

      {/* Person Form Modal */}
      <PersonForm />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

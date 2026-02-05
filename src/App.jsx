import React, { useEffect, useRef, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AuthBar from './components/AuthBar';
import LanguageSelector from './components/LanguageSelector';
import LandingHero from './components/LandingHero';
import MyInfoForm from './components/MyInfoForm';
import ChatInterface from './components/ChatInterface';
import PeopleManager from './components/PeopleManager';
import PersonForm from './components/PersonForm';
import Footer from './components/Footer';
import PaperAirplane from './components/PaperAirplane';

function AppContent() {
  const {
    showChat,
    showPersonForm,
    showPeopleManager,
    showForm,
    setShowForm,
    setScrollProgress,
  } = useApp();

  const landingRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (landingRef.current && !showChat && !showPeopleManager) {
      const scrolled = window.scrollY;
      const maxScroll = landingRef.current.offsetHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollProgress(progress);
      if (progress >= 0.4 && !showForm) setShowForm(true);
    }
  }, [showChat, showPeopleManager, showForm, setScrollProgress, setShowForm]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const isModalOpen = showChat || showPersonForm || showPeopleManager;

  return (
    <div
      className="min-h-screen bg-dark text-cream font-serif"
      style={{ overflow: isModalOpen ? 'hidden' : 'auto' }}
    >
      {/* Auth Bar - Always visible */}
      <AuthBar />

      {/* Language Selector - Hidden when modals are open */}
      {!isModalOpen && <LanguageSelector />}

      {/* Landing & Form Section */}
      <div
        ref={landingRef}
        className="min-h-[200vh] transition-opacity duration-800"
        style={{
          opacity: isModalOpen ? 0 : 1,
          pointerEvents: isModalOpen ? 'none' : 'auto',
        }}
      >
        <LandingHero />
        <PaperAirplane />
        {showForm && <MyInfoForm />}
      </div>

      {/* Footer - Hidden when modals are open */}
      {!isModalOpen && <Footer />}

      {/* Chat Interface Modal */}
      {showChat && <ChatInterface />}

      {/* People Manager Modal */}
      <PeopleManager />

      {/* Person Form Modal */}
      <PersonForm />
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

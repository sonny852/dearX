import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Edit2 } from 'lucide-react';
import AuthBar from './components/AuthBar';
import LanguageSelector from './components/LanguageSelector';
import LandingHero from './components/LandingHero';
import ChatInterface from './components/ChatInterface';
import PeopleManager from './components/PeopleManager';
import PersonForm from './components/PersonForm';
import Footer from './components/Footer';
import SampleConversation from './components/SampleConversation';
import PaymentPopup from './components/PaymentPopup';
import NameInputPopup from './components/NameInputPopup';
import MyPage from './components/MyPage';

function AppContent() {
  const {
    showChat,
    setShowChat,
    showPersonForm,
    setShowPersonForm,
    showPeopleManager,
    setShowPeopleManager,
    showPaymentPopup,
    setShowPaymentPopup,
    showLoginRequired,
    setShowLoginRequired,
    showMyPage,
    setShowMyPage,
    showForm,
    setShowForm,
    authUser,
    authLoading,
    additionalPeople,
    handleStartChatWithPerson,
    handleAddNewPerson,
    handleEditPerson,
    handleBackFromChat,
    t,
  } = useApp();

  const [stage, setStage] = useState('hero'); // hero -> conversation -> form

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = (e) => {
      // 모달이 열려있으면 모달 닫기
      if (showPaymentPopup) {
        setShowPaymentPopup(false);
        e.preventDefault();
        return;
      }
      if (showLoginRequired) {
        setShowLoginRequired(false);
        e.preventDefault();
        return;
      }
      if (showMyPage) {
        setShowMyPage(false);
        e.preventDefault();
        return;
      }
      if (showPersonForm) {
        setShowPersonForm(false);
        e.preventDefault();
        return;
      }
      if (showPeopleManager) {
        setShowPeopleManager(false);
        e.preventDefault();
        return;
      }
      if (showChat) {
        handleBackFromChat();
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showChat, showPersonForm, showPeopleManager, showPaymentPopup, showLoginRequired, showMyPage, setShowChat, setShowPersonForm, setShowPeopleManager, setShowPaymentPopup, setShowLoginRequired, setShowMyPage, handleBackFromChat]);

  // 모달 열릴 때 히스토리 푸시 (각 모달별로 한 번만)
  useEffect(() => {
    if (showChat) {
      window.history.pushState({ modal: 'chat' }, '');
    }
  }, [showChat]);

  useEffect(() => {
    if (showPaymentPopup) {
      window.history.pushState({ modal: 'payment' }, '');
    }
  }, [showPaymentPopup]);

  useEffect(() => {
    if (showPersonForm) {
      window.history.pushState({ modal: 'personForm' }, '');
    }
  }, [showPersonForm]);

  useEffect(() => {
    if (showMyPage) {
      window.history.pushState({ modal: 'myPage' }, '');
    }
  }, [showMyPage]);

  const handleStartJourney = () => {
    setStage('conversation');
  };

  // conversation 끝나면 form 표시 (SampleConversation에서 호출)
  useEffect(() => {
    if (showForm && stage === 'conversation') {
      setStage('form');
    }
  }, [showForm, stage]);

  const isModalOpen = showChat || showPersonForm || showPeopleManager || showMyPage;

  // 로그인 + 등록된 사람이 있으면 대시보드 표시
  const showDashboard = authUser && additionalPeople.length > 0;

  // 로그인했지만 등록된 사람이 없으면 바로 폼으로 (히어로/샘플대화 스킵)
  const isLoggedInWithoutPeople = authUser && additionalPeople.length === 0;

  useEffect(() => {
    if (isLoggedInWithoutPeople && stage === 'hero') {
      setShowForm(true);
      setStage('form');
    }
  }, [isLoggedInWithoutPeople, stage, setShowForm]);

  // 로그아웃 시 첫 화면으로
  useEffect(() => {
    if (!authUser && !authLoading) {
      setStage('hero');
      setShowForm(false);
    }
  }, [authUser, authLoading, setShowForm]);

  // 비로그인 사용자가 폼을 닫으면 hero로 돌아가기
  useEffect(() => {
    if (!authUser && !showForm && stage === 'form') {
      setStage('hero');
    }
  }, [authUser, showForm, stage]);

  // 로그인 상태 확인 중 로딩 화면
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-4xl font-display font-black bg-gradient-to-br from-white via-coral to-gold bg-clip-text mb-4"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            DearX
          </h1>
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-cream font-serif overflow-hidden">
      {/* Auth Bar - 항상 표시 (채팅 제외) */}
      {!showChat && <AuthBar />}

      {/* Language Selector */}
      {(showDashboard || stage === 'hero') && !isModalOpen && <LanguageSelector />}

      {/* Dashboard - 로그인 + 등록된 사람이 있을 때 */}
      {showDashboard && !isModalOpen && (
        <div className="min-h-screen p-6 pt-20 animate-fadeIn">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-display font-bold text-coral mb-2">
              {(t.dashboardGreeting || 'Hello, {{name}}').replace('{{name}}', authUser.name)}
            </h1>
            <p className="text-cream/60 text-sm mb-8">
              {t.dashboardSubtitle}
            </p>

            {/* 대화 상대 목록 */}
            <div className="space-y-3 mb-6">
              {additionalPeople.map((person, index) => (
                <div
                  key={index}
                  className="w-full p-4 bg-dark-card border border-coral/20 rounded-2xl flex items-center gap-4 hover:border-coral/40 transition-all group"
                >
                  <button
                    onClick={() => handleStartChatWithPerson(person)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div
                      className="w-14 h-14 rounded-full border-2 border-coral/30 flex-shrink-0"
                      style={{
                        background: person.photo
                          ? `url(${person.photo}) center/cover`
                          : 'linear-gradient(135deg, rgba(255, 140, 105, 0.3) 0%, rgba(255, 193, 122, 0.3) 100%)',
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-coral font-medium text-lg">{person.name}</p>
                      <p className="text-cream/50 text-sm">
                        {person.relationship} · {person.targetAge}{t.ageUnit}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleEditPerson(index)}
                    className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-coral/50 hover:text-coral hover:bg-coral/20 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleStartChatWithPerson(person)}
                    className="text-coral/50 group-hover:text-coral transition-colors"
                  >
                    →
                  </button>
                </div>
              ))}
            </div>

            {/* 새 사람 추가 버튼 */}
            <button
              onClick={handleAddNewPerson}
              className="w-full p-4 border border-dashed border-coral/30 rounded-2xl text-coral/70 hover:border-coral/50 hover:text-coral transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              {t.addNewPerson}
            </button>
          </div>
        </div>
      )}

      {/* Hero Screen - 비로그인 또는 등록된 사람이 없을 때 */}
      {!showDashboard && stage === 'hero' && !isModalOpen && (
        <div className="min-h-screen flex flex-col animate-fadeIn">
          <div className="flex-1 flex items-center justify-center py-10">
            <LandingHero onStart={handleStartJourney} />
          </div>
          <Footer />
        </div>
      )}

      {/* Conversation Animation Screen */}
      {!showDashboard && stage === 'conversation' && !isModalOpen && (
        <div className="h-screen flex flex-col animate-fadeIn">
          {/* 뒤로가기 버튼 */}
          <div className="p-4">
            <button
              onClick={() => setStage('hero')}
              className="text-cream/50 hover:text-cream transition-colors flex items-center gap-1 text-sm"
            >
              ← {t.back}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <SampleConversation onComplete={() => setShowForm(true)} />
          </div>
        </div>
      )}

      {/* Form Screen */}
      {!showDashboard && stage === 'form' && !isModalOpen && (
        <div className="min-h-screen animate-fadeIn">
          <PersonForm
            isInitialForm={true}
            onBackToStart={() => {
              setShowForm(false);
              setStage('hero');
            }}
          />
        </div>
      )}

      {/* Footer */}
      {!showDashboard && stage === 'form' && !isModalOpen && <Footer />}

      {/* Chat Interface Modal */}
      {showChat && <ChatInterface />}

      {/* People Manager Modal */}
      <PeopleManager />

      {/* Person Form Modal */}
      <PersonForm />

      {/* Payment Popup - 최상위에서 렌더링 */}
      <PaymentPopup />

      {/* Name Input Popup - 첫 로그인 시 이름 입력 */}
      <NameInputPopup />

      {/* My Page - 마이페이지 */}
      <MyPage />

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

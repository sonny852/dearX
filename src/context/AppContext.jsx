import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { translations } from '../constants/translations';
import { supabase, auth, db } from '../lib/supabase';

const AppContext = createContext(null);

// Supabase Edge Function URL (배포 후 설정)
const CHAT_FUNCTION_URL = process.env.REACT_APP_SUPABASE_URL
  ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/chat`
  : null;

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('ko');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showPeopleManager, setShowPeopleManager] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingPersonIndex, setEditingPersonIndex] = useState(null);

  // Message count for free tier (7 free messages)
  const FREE_MESSAGE_LIMIT = 7;
  const [messageCount, setMessageCount] = useState(0);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  const [additionalPeople, setAdditionalPeople] = useState([]);

  const [currentPersonForm, setCurrentPersonForm] = useState({
    relationship: '',
    name: '',
    photo: null,
    targetAge: '',
    gender: '',
    timeDirection: 'past',
    myNickname: '',
    personality: '',
    speechStyle: '',
    hobbies: '',
    memories: '',
    favoriteWords: '',
    habits: '',
  });

  const [activePerson, setActivePerson] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const t = useMemo(() => translations[language], [language]);

  // Supabase 인증 상태 감지
  useEffect(() => {
    // 초기 세션 확인
    const initAuth = async () => {
      if (!supabase) {
        setAuthLoading(false);
        return;
      }

      const { data: { user } } = await auth.getUser();
      if (user) {
        const { data: profile } = await db.getOrCreateProfile(user.id);
        const userName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        setAuthUser({
          id: user.id,
          email: user.email,
          name: userName,
          isPremium: profile?.is_premium || false,
          premiumExpiresAt: profile?.premium_expires_at,
        });

        // 저장된 사람 목록 로드
        const { data: people } = await db.getPeople(user.id);
        if (people) {
          setAdditionalPeople(people.map(p => ({
            id: p.id,
            relationship: p.relationship,
            name: p.name,
            photo: p.photo_url,
            targetAge: p.target_age,
            gender: p.gender,
            timeDirection: p.time_direction,
            personality: p.personality,
            speechStyle: p.speech_style,
            hobbies: p.hobbies,
            memories: p.memories,
            favoriteWords: p.favorite_words,
            habits: p.habits,
          })));
        }
      }
      setAuthLoading(false);
    };

    initAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await db.getOrCreateProfile(session.user.id);
        const userName = profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        setAuthUser({
          id: session.user.id,
          email: session.user.email,
          name: userName,
          isPremium: profile?.is_premium || false,
          premiumExpiresAt: profile?.premium_expires_at,
        });

        // 저장된 사람 목록 로드
        const { data: people } = await db.getPeople(session.user.id);
        if (people) {
          setAdditionalPeople(people.map(p => ({
            id: p.id,
            relationship: p.relationship,
            name: p.name,
            photo: p.photo_url,
            targetAge: p.target_age,
            gender: p.gender,
            timeDirection: p.time_direction,
            personality: p.personality,
            speechStyle: p.speech_style,
            hobbies: p.hobbies,
            memories: p.memories,
            favoriteWords: p.favorite_words,
            habits: p.habits,
          })));
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setAdditionalPeople([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인 핸들러
  const handleLogin = useCallback(async (provider) => {
    setAuthLoading(true);

    if (!supabase) {
      // Demo mode
      setTimeout(() => {
        setAuthUser({ id: `demo-${provider}`, name: 'User', isPremium: false });
        setAuthLoading(false);
      }, 600);
      return;
    }

    try {
      if (provider === 'kakao') {
        await auth.signInWithKakao();
      } else if (provider === 'google') {
        await auth.signInWithGoogle();
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthLoading(false);
    }
  }, []);

  // 로그아웃 핸들러
  const handleLogout = useCallback(async () => {
    if (supabase) {
      await auth.signOut();
    }
    setAuthUser(null);
    setAdditionalPeople([]);
    setMessageCount(0);
  }, []);

  const handleFileUpload = useCallback((e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPersonForm((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAddNewPerson = useCallback(() => {
    if (!authUser) {
      alert(t.loginRequired);
      return;
    }
    if (additionalPeople.length >= 1 && !authUser.isPremium) {
      if (window.confirm(t.upgradeRequired + '\n\n' + t.upgradeToPremium)) {
        alert(t.paymentPage);
      }
      return;
    }
    setCurrentPersonForm({
      relationship: '',
      name: '',
      photo: null,
      targetAge: '',
      gender: '',
      timeDirection: 'past',
      myNickname: '',
      personality: '',
      speechStyle: '',
      hobbies: '',
      memories: '',
      favoriteWords: '',
      habits: '',
    });
    setEditingPersonIndex(null);
    setShowPersonForm(true);
  }, [authUser, additionalPeople.length, t]);

  const handleEditPerson = useCallback((index) => {
    setCurrentPersonForm(additionalPeople[index]);
    setEditingPersonIndex(index);
    setShowPersonForm(true);
    setShowPeopleManager(false);
  }, [additionalPeople]);

  const handleDeletePerson = useCallback(async (index) => {
    if (window.confirm(t.confirmDelete)) {
      const person = additionalPeople[index];

      // Supabase에서 삭제
      if (supabase && person.id && authUser) {
        await db.deletePerson(person.id);
      }

      setAdditionalPeople((prev) => prev.filter((_, i) => i !== index));
    }
  }, [t.confirmDelete, additionalPeople, authUser]);

  const handleSavePerson = useCallback(async () => {
    if (!currentPersonForm.relationship || !currentPersonForm.name || !currentPersonForm.targetAge || !currentPersonForm.gender) {
      alert(t.requiredFieldsAlert);
      return;
    }

    // Supabase에 저장
    if (supabase && authUser) {
      const personData = {
        relationship: currentPersonForm.relationship,
        name: currentPersonForm.name,
        photo_url: currentPersonForm.photo,
        target_age: parseInt(currentPersonForm.targetAge),
        gender: currentPersonForm.gender,
        time_direction: currentPersonForm.timeDirection,
        personality: currentPersonForm.personality,
        speech_style: currentPersonForm.speechStyle,
        hobbies: currentPersonForm.hobbies,
        memories: currentPersonForm.memories,
        favorite_words: currentPersonForm.favoriteWords,
        habits: currentPersonForm.habits,
      };

      if (editingPersonIndex !== null && additionalPeople[editingPersonIndex]?.id) {
        // 수정
        const { data } = await db.updatePerson(additionalPeople[editingPersonIndex].id, personData);
        if (data) {
          setAdditionalPeople((prev) =>
            prev.map((p, i) => (i === editingPersonIndex ? { ...currentPersonForm, id: data.id } : p))
          );
        }
      } else {
        // 추가
        const { data } = await db.addPerson(authUser.id, personData);
        if (data) {
          setAdditionalPeople((prev) => [...prev, { ...currentPersonForm, id: data.id }]);
        }
      }
    } else {
      // Demo mode
      if (editingPersonIndex !== null) {
        setAdditionalPeople((prev) =>
          prev.map((p, i) => (i === editingPersonIndex ? currentPersonForm : p))
        );
      } else {
        setAdditionalPeople((prev) => [...prev, currentPersonForm]);
      }
    }

    setShowPersonForm(false);
    setEditingPersonIndex(null);
    setShowPeopleManager(true);
  }, [currentPersonForm, editingPersonIndex, t.requiredFieldsAlert, authUser, additionalPeople]);

  const handleStartChatWithPerson = useCallback((person) => {
    const nickname = person.myNickname || '얘야';
    const greeting = `${nickname}... 오랜만이구나. ${
      person.memories
        ? '우리 함께 ' + person.memories.split(',')[0] + '했던 거 기억나니?'
        : '보고 싶었어.'
    }`;
    setActivePerson(person);
    setMessages([
      {
        role: 'assistant',
        content: greeting,
        timestamp: '2015.06.20',
        mode: person.timeDirection,
      },
    ]);
    setMessageCount(0); // Reset message count when starting new chat
    setShowChat(true);
    setShowPeopleManager(false);
    setShowPersonForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 메시지 전송 (Claude API 연동)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activePerson) return;

    // Check message limit for non-premium users
    if (!authUser?.isPremium && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowPaymentPopup(true);
      return;
    }

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\. /g, '.')
        .replace('.', ''),
      mode: activePerson.timeDirection,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setMessageCount((prev) => prev + 1);

    // GPT API 호출 시도
    console.log('Chat Debug:', { CHAT_FUNCTION_URL, hasSupabase: !!supabase, activePerson: activePerson?.name });
    if (CHAT_FUNCTION_URL) {
      try {
        console.log('Attempting API call to:', CHAT_FUNCTION_URL);

        const requestBody = {
          person: activePerson,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userName: authUser?.name || 'User',
        };
        console.log('Request body:', requestBody);
        console.log('Making fetch request now...');

        const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const response = await fetch(CHAT_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        if (response.ok) {
          const newMessage = {
            role: 'assistant',
            content: data.message,
            imageUrl: data.imageUrl || null,
            timestamp: activePerson.timeDirection === 'past'
              ? '2015.' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '.' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
              : '2045.' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '.' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            mode: activePerson.timeDirection,
          };
          setMessages((prev) => [...prev, newMessage]);
          setIsTyping(false);
          return;
        }
      } catch (error) {
        console.error('Chat API error:', error);
        console.log('Falling through to fallback due to error');
      }
    } else {
      console.log('Skipping API call - condition not met');
    }

    // Fallback: 기본 응답 (API 실패 또는 Demo mode)
    console.log('Using fallback response');
    setTimeout(() => {
      const responses = [
        `${activePerson.favoriteWords || '괜찮아요. 당신은 충분히 잘하고 있어요.'}`,
        `그때의 우리는 정말 행복했어요.`,
        `당신은 혼자가 아니에요. 제가 여기 있잖아요.`,
      ];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp:
            '2015.' +
            String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') +
            '.' +
            String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
          mode: activePerson.timeDirection,
        },
      ]);
      setIsTyping(false);
    }, 1500);
  }, [input, activePerson, messages, authUser, messageCount]);

  const handleBackFromChat = useCallback(() => {
    setShowChat(false);
    setActivePerson(null);
    setMessages([]);
    if (showPeopleManager) setShowPeopleManager(false);
  }, [showPeopleManager]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      scrollProgress,
      setScrollProgress,
      showForm,
      setShowForm,
      showPeopleManager,
      setShowPeopleManager,
      showPersonForm,
      setShowPersonForm,
      showChat,
      setShowChat,
      editingPersonIndex,
      setEditingPersonIndex,
      additionalPeople,
      setAdditionalPeople,
      currentPersonForm,
      setCurrentPersonForm,
      activePerson,
      setActivePerson,
      messages,
      setMessages,
      input,
      setInput,
      isTyping,
      setIsTyping,
      authUser,
      setAuthUser,
      authLoading,
      setAuthLoading,
      messageCount,
      setMessageCount,
      showPaymentPopup,
      setShowPaymentPopup,
      FREE_MESSAGE_LIMIT,
      t,
      handleLogin,
      handleLogout,
      handleFileUpload,
      handleAddNewPerson,
      handleEditPerson,
      handleDeletePerson,
      handleSavePerson,
      handleStartChatWithPerson,
      sendMessage,
      handleBackFromChat,
    }),
    [
      language,
      scrollProgress,
      showForm,
      showPeopleManager,
      showPersonForm,
      showChat,
      editingPersonIndex,
      additionalPeople,
      currentPersonForm,
      activePerson,
      messages,
      input,
      isTyping,
      authUser,
      authLoading,
      messageCount,
      showPaymentPopup,
      t,
      handleLogin,
      handleLogout,
      handleFileUpload,
      handleAddNewPerson,
      handleEditPerson,
      handleDeletePerson,
      handleSavePerson,
      handleStartChatWithPerson,
      sendMessage,
      handleBackFromChat,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;

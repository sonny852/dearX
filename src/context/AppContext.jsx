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

  // Message count for free tier (1 free message per day - 테스트용)
  const FREE_MESSAGE_LIMIT = 1;
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  // 로그인 후 결제창 표시 여부 (localStorage에 저장해서 OAuth 리디렉트 후에도 유지)
  const [pendingPaymentAfterLogin, setPendingPaymentAfterLogin] = useState(() => {
    return localStorage.getItem('dearx_pending_payment') === 'true';
  });

  useEffect(() => {
    if (pendingPaymentAfterLogin) {
      localStorage.setItem('dearx_pending_payment', 'true');
    } else {
      localStorage.removeItem('dearx_pending_payment');
    }
  }, [pendingPaymentAfterLogin]);

  // Daily message count with localStorage persistence
  const [messageCount, setMessageCount] = useState(() => {
    const saved = localStorage.getItem('dearx_daily_messages');
    if (saved) {
      const { count, date } = JSON.parse(saved);
      const today = new Date().toDateString();
      // Reset if it's a new day
      if (date === today) {
        return count;
      }
    }
    return 0;
  });

  // Save message count to localStorage with date
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('dearx_daily_messages', JSON.stringify({
      count: messageCount,
      date: today,
    }));
  }, [messageCount]);

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
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState(null); // 이름 입력 대기 중인 유저

  // 로딩 타임아웃 (3초 후 강제로 로딩 종료)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        console.log('Auth loading timeout - forcing completion');
        setAuthLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  const t = useMemo(() => translations[language], [language]);

  // Supabase 인증 상태 감지
  useEffect(() => {
    // 초기 세션 확인
    const initAuth = async () => {
      try {
        console.log('initAuth started, supabase:', !!supabase);
        if (!supabase) {
          console.log('No supabase, setting authLoading false');
          setAuthLoading(false);
          return;
        }

        // 타임아웃 적용한 getUser
        const getUserWithTimeout = () => {
          return Promise.race([
            auth.getUser(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('getUser timeout')), 5000)
            )
          ]);
        };

        let user = null;
        try {
          const result = await getUserWithTimeout();
          user = result.data?.user;
          console.log('Got user:', user?.email);
        } catch (e) {
          console.log('getUser failed:', e.message);
        }
        if (user) {
          console.log('initAuth user metadata:', user.user_metadata);
          const { data: profile } = await db.getOrCreateProfile(user.id);
          console.log('initAuth profile:', profile);
          // Google은 full_name, Kakao는 name 사용
          const oauthName = user.user_metadata?.full_name
            || user.user_metadata?.name
            || user.email?.split('@')[0]
            || 'User';
          console.log('initAuth oauthName:', oauthName);

          // 프로필에 이름이 저장되어 있으면 그대로 사용, 없으면 이름 입력 요청
          if (profile?.name) {
            setAuthUser({
              id: user.id,
              email: user.email,
              name: profile.name,
              isPremium: profile?.is_premium || false,
              premiumExpiresAt: profile?.premium_expires_at,
            });
          } else {
            // 첫 로그인 - 이름 입력 팝업 표시
            setPendingAuthUser({
              id: user.id,
              email: user.email,
              oauthName: oauthName,
              isPremium: profile?.is_premium || false,
              premiumExpiresAt: profile?.premium_expires_at,
            });
            setShowNameInput(true);
          }

          // 저장된 사람 목록 로드
          const { data: people, error: peopleError } = await db.getPeople(user.id);
          console.log('Loaded people:', people?.length, 'error:', peopleError);
          if (people && people.length > 0) {
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
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    // 인증 상태 변경 감지
    if (!supabase || !auth) {
      return;
    }

    let subscription;
    try {
      const { data } = auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User metadata:', session.user.user_metadata);
          const { data: profile } = await db.getOrCreateProfile(session.user.id);
          console.log('Profile from DB:', profile);
          // Google은 full_name 또는 name을 사용, Kakao는 name을 사용
          const oauthName = session.user.user_metadata?.full_name
            || session.user.user_metadata?.name
            || session.user.email?.split('@')[0]
            || 'User';
          console.log('OAuth name:', oauthName);
          const isPremium = profile?.is_premium || false;

          // 프로필에 이름이 저장되어 있으면 그대로 사용, 없으면 이름 입력 요청
          if (profile?.name) {
            setAuthUser({
              id: session.user.id,
              email: session.user.email,
              name: profile.name,
              isPremium: isPremium,
              premiumExpiresAt: profile?.premium_expires_at,
            });

            // 로그인 전에 결제 대기 중이었으면 결제 팝업 표시
            const pendingPayment = localStorage.getItem('dearx_pending_payment') === 'true';
            if (pendingPayment && !isPremium) {
              localStorage.removeItem('dearx_pending_payment');
              setPendingPaymentAfterLogin(false);
              setShowPaymentPopup(true);
            }
          } else {
            // 첫 로그인 - 이름 입력 팝업 표시
            setPendingAuthUser({
              id: session.user.id,
              email: session.user.email,
              oauthName: oauthName,
              isPremium: isPremium,
              premiumExpiresAt: profile?.premium_expires_at,
            });
            setShowNameInput(true);
          }

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
      subscription = data?.subscription;
    } catch (error) {
      console.error('Auth state change error:', error);
    }

    return () => subscription?.unsubscribe();
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
    setShowChat(false);
    setActivePerson(null);
    setMessages([]);
  }, []);

  // 이름 저장 핸들러 (첫 로그인 시)
  const handleSaveName = useCallback(async (name) => {
    if (!pendingAuthUser || !name.trim()) return;

    // DB에 이름 저장
    if (supabase) {
      await db.updateProfile(pendingAuthUser.id, { name: name.trim() });
    }

    // authUser 설정
    setAuthUser({
      id: pendingAuthUser.id,
      email: pendingAuthUser.email,
      name: name.trim(),
      isPremium: pendingAuthUser.isPremium,
      premiumExpiresAt: pendingAuthUser.premiumExpiresAt,
    });

    // 결제 대기 중이었으면 결제 팝업 표시
    const pendingPayment = localStorage.getItem('dearx_pending_payment') === 'true';
    if (pendingPayment && !pendingAuthUser.isPremium) {
      localStorage.removeItem('dearx_pending_payment');
      setPendingPaymentAfterLogin(false);
      setShowPaymentPopup(true);
    }

    setPendingAuthUser(null);
    setShowNameInput(false);
  }, [pendingAuthUser]);

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

  const handleStartChatWithPerson = useCallback(async (person) => {
    let savedPerson = person;

    // 새로운 사람이면 (ID가 없으면) DB에 저장
    if (!person.id && authUser) {
      const personData = {
        relationship: person.relationship,
        name: person.name,
        photo_url: person.photo,
        target_age: parseInt(person.targetAge),
        target_year: person.targetYear ? parseInt(person.targetYear) : null,
        gender: person.gender,
        time_direction: person.timeDirection,
        my_nickname: person.myNickname,
        personality: person.personality,
        speech_style: person.speechStyle,
        hobbies: person.hobbies,
        memories: person.memories,
        favorite_words: person.favoriteWords,
        habits: person.habits,
      };

      if (supabase) {
        const { data } = await db.addPerson(authUser.id, personData);
        if (data) {
          savedPerson = { ...person, id: data.id };
          setAdditionalPeople((prev) => [...prev, savedPerson]);
        }
      } else {
        // Demo mode
        savedPerson = { ...person, id: `demo-${Date.now()}` };
        setAdditionalPeople((prev) => [...prev, savedPerson]);
      }
    }

    setActivePerson(savedPerson);

    // 기존 대화 불러오기
    if (supabase && authUser && savedPerson.id) {
      const { data: existingMessages } = await db.getMessages(authUser.id, savedPerson.id);
      if (existingMessages && existingMessages.length > 0) {
        // DB에서 불러온 메시지 표시
        setMessages(existingMessages.map(m => ({
          role: m.role,
          content: m.content,
          imageUrl: m.image_url,
          timestamp: new Date(m.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          }).replace(/\. /g, '.').replace(/\.$/, ''),
          mode: savedPerson.timeDirection,
        })));
      } else {
        // 새 대화 - 첫 인사
        const nickname = savedPerson.myNickname || '얘야';
        const greeting = `${nickname} 오랜만이야~ 잘 지냈어?`;
        const firstMessage = {
          role: 'assistant',
          content: greeting,
          timestamp: new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          }).replace(/\. /g, '.').replace(/\.$/, ''),
          mode: savedPerson.timeDirection,
        };
        setMessages([firstMessage]);
        // 첫 인사 저장
        await db.saveMessage(authUser.id, savedPerson.id, { role: 'assistant', content: greeting });
      }
    } else {
      // Demo mode
      const nickname = savedPerson.myNickname || '얘야';
      const greeting = `${nickname} 오랜만이야~ 잘 지냈어?`;
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: '2015.06.20',
        mode: savedPerson.timeDirection,
      }]);
    }

    setShowChat(true);
    setShowPeopleManager(false);
    setShowPersonForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [authUser]);

  // 메시지 전송 (Claude API 연동)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activePerson) return;

    // Check message limit for non-premium users
    if (!authUser?.isPremium && messageCount >= FREE_MESSAGE_LIMIT) {
      // 로그인 안 되어있으면 로그인 먼저 요청
      if (!authUser) {
        setPendingPaymentAfterLogin(true);
        setShowLoginRequired(true);
      } else {
        setShowPaymentPopup(true);
      }
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

    // 사용자 메시지 DB 저장
    if (supabase && authUser && activePerson?.id) {
      db.saveMessage(authUser.id, activePerson.id, { role: 'user', content: input });
    }

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
            timestamp: new Date().toLocaleDateString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit'
            }).replace(/\. /g, '.').replace(/\.$/, ''),
            mode: activePerson.timeDirection,
          };
          setMessages((prev) => [...prev, newMessage]);
          // AI 응답 DB 저장
          if (supabase && authUser && activePerson?.id) {
            db.saveMessage(authUser.id, activePerson.id, {
              role: 'assistant',
              content: data.message,
              image_url: data.imageUrl || null,
            });
          }
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
    setTimeout(async () => {
      const responses = [
        `${activePerson.favoriteWords || '괜찮아요. 당신은 충분히 잘하고 있어요.'}`,
        `그때의 우리는 정말 행복했어요.`,
        `당신은 혼자가 아니에요. 제가 여기 있잖아요.`,
      ];
      const responseContent = responses[Math.floor(Math.random() * responses.length)];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          }).replace(/\. /g, '.').replace(/\.$/, ''),
          mode: activePerson.timeDirection,
        },
      ]);
      // Fallback 응답도 DB 저장
      if (supabase && authUser && activePerson?.id) {
        db.saveMessage(authUser.id, activePerson.id, { role: 'assistant', content: responseContent });
      }
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
      showNameInput,
      setShowNameInput,
      pendingAuthUser,
      messageCount,
      setMessageCount,
      showPaymentPopup,
      setShowPaymentPopup,
      showLoginRequired,
      setShowLoginRequired,
      FREE_MESSAGE_LIMIT,
      t,
      handleLogin,
      handleLogout,
      handleSaveName,
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
      showNameInput,
      pendingAuthUser,
      messageCount,
      showPaymentPopup,
      showLoginRequired,
      t,
      handleLogin,
      handleLogout,
      handleSaveName,
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

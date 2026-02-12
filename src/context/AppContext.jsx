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

  // Message count for free tier
  const FREE_MESSAGE_LIMIT = 5;
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);

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
    mbtiEI: '',
    mbtiSN: '',
    mbtiTF: '',
    mbtiJP: '',
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

  // 로딩 타임아웃 (5초 후 강제로 로딩 종료 - fallback)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        setAuthLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useMemo(() => translations[language], [language]);

  // Supabase 인증 상태 감지 (detectSessionInUrl: true → Supabase가 URL hash 자동 처리)
  useEffect(() => {
    if (!supabase || !auth) {
      setAuthLoading(false);
      return;
    }

    let subscription;
    try {
      const { data } = auth.onAuthStateChange(async (event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const oauthName = session.user.user_metadata?.full_name
            || session.user.user_metadata?.name
            || session.user.email?.split('@')[0]
            || 'User';

          setAuthUser({
            id: session.user.id,
            email: session.user.email,
            name: oauthName,
            isPremium: false,
          });

          // 프로필 및 사람 목록 로드 후 로딩 해제
          (async () => {
            try {
              const { data: profile } = await db.getOrCreateProfile(session.user.id);

              if (profile?.name) {
                setAuthUser({
                  id: session.user.id,
                  email: session.user.email,
                  name: profile.name,
                  gender: profile.gender || null,
                  birthYear: profile.birth_year || null,
                  mbti: profile.mbti || null,
                  isPremium: profile?.is_premium || false,
                  premiumExpiresAt: profile?.premium_expires_at,
                });

                const pendingPayment = localStorage.getItem('dearx_pending_payment') === 'true';
                if (pendingPayment && !(profile?.is_premium)) {
                  localStorage.removeItem('dearx_pending_payment');
                  setPendingPaymentAfterLogin(false);
                  setShowPaymentPopup(true);
                }
              } else {
                // 프로필이 없거나 이름이 없으면 첫 로그인 → 정보 입력
                setPendingAuthUser({
                  id: session.user.id,
                  email: session.user.email,
                  oauthName: oauthName,
                  isPremium: false,
                });
                setShowNameInput(true);
              }

              const { data: people } = await db.getPeople(session.user.id);
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
              // 로그인 전 대화 복원
              try {
                const pendingChatRaw = localStorage.getItem('dearx_pending_chat');
                if (pendingChatRaw) {
                  localStorage.removeItem('dearx_pending_chat');
                  const pendingChat = JSON.parse(pendingChatRaw);
                  if (pendingChat.person && pendingChat.messages?.length > 0) {
                    const person = pendingChat.person;

                    // MBTI 트레이트 조합
                    const mbtiTraits = [person.mbtiEI, person.mbtiSN, person.mbtiTF, person.mbtiJP]
                      .filter(Boolean).join(', ');
                    const personality = mbtiTraits || person.personality;

                    // DB에 person 저장
                    const personData = {
                      relationship: person.relationship,
                      name: person.name,
                      photo_url: person.photo,
                      target_age: parseInt(person.targetAge),
                      target_year: person.targetYear ? parseInt(person.targetYear) : null,
                      gender: person.gender,
                      time_direction: person.timeDirection,
                      my_nickname: person.myNickname,
                      personality: personality,
                      speech_style: person.speechStyle,
                      hobbies: person.hobbies,
                      memories: person.memories,
                      favorite_words: person.favoriteWords,
                      habits: person.habits,
                    };
                    const { data: savedData } = await db.addPerson(session.user.id, personData);
                    if (savedData) {
                      const restoredPerson = { ...person, id: savedData.id };
                      setAdditionalPeople(prev => [...prev, restoredPerson]);
                      setActivePerson(restoredPerson);
                      setMessages(pendingChat.messages);
                      setMessageCount(pendingChat.messageCount || 0);
                      setShowChat(true);

                      // 대화 메시지들 DB에 저장
                      for (const msg of pendingChat.messages) {
                        await db.saveMessage(session.user.id, savedData.id, {
                          role: msg.role,
                          content: msg.content,
                          image_url: msg.imageUrl || null,
                        });
                      }
                    }
                  }
                }
              } catch (e) {
                // 복원 실패 무시
              }
            } catch (error) {
              // DB fetch 에러 - 무시 (세션은 이미 복원됨)
            } finally {
              setAuthLoading(false);
            }
          })();
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setAdditionalPeople([]);
          setAuthLoading(false);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setAuthLoading(false);
        }
      });
      subscription = data?.subscription;
    } catch (error) {
      console.error('Auth state change error:', error);
      setAuthLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  // 로그인 핸들러
  const handleLogin = useCallback((provider) => {
    if (!supabase) {
      // Demo mode
      setAuthLoading(true);
      setTimeout(() => {
        setAuthUser({ id: `demo-${provider}`, name: 'User', isPremium: false });
        setAuthLoading(false);
      }, 600);
      return;
    }

    // OAuth 리디렉트 전에 setAuthLoading(true)을 호출하지 않음
    // - 모바일 Safari에서 state update → re-render가 먼저 실행되면
    //   브라우저가 user gesture context를 잃어 네비게이션이 차단됨
    // - 페이지가 리디렉트되면 어차피 새로 로드되므로 loading 상태 불필요
    if (provider === 'kakao') {
      auth.signInWithKakao();
    } else if (provider === 'google') {
      auth.signInWithGoogle();
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

  // 이름/성별/생년 저장 핸들러 (첫 로그인 시)
  const handleSaveName = useCallback(async (name, gender, birthYear) => {
    if (!pendingAuthUser || !name.trim()) return;

    // DB에 프로필 저장
    const profileData = { name: name.trim() };
    if (gender) profileData.gender = gender;
    if (birthYear) profileData.birth_year = birthYear;
    if (supabase) {
      await db.updateProfile(pendingAuthUser.id, profileData);
    }

    // authUser 설정
    setAuthUser({
      id: pendingAuthUser.id,
      email: pendingAuthUser.email,
      name: name.trim(),
      gender: gender || null,
      birthYear: birthYear || null,
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

  // 프로필 업데이트 핸들러 (마이페이지용)
  const handleUpdateProfile = useCallback(async (updates) => {
    if (!authUser) return;

    // DB 컬럼명 ↔ 로컬 상태명 매핑
    const dbUpdates = {};
    const localUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'birthYear') {
        dbUpdates.birth_year = value;
        localUpdates.birthYear = value;
      } else if (key === 'birth_year') {
        dbUpdates.birth_year = value;
        localUpdates.birthYear = value;
      } else {
        dbUpdates[key] = value;
        localUpdates[key] = value;
      }
    }

    // DB에 저장
    if (supabase) {
      await db.updateProfile(authUser.id, dbUpdates);
    }

    // authUser 상태 업데이트
    setAuthUser(prev => ({
      ...prev,
      ...localUpdates,
    }));
  }, [authUser]);

  // 이미지 리사이즈 유틸 (max 800px, JPEG 0.8)
  const resizeImage = useCallback((file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 800;
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileUpload = useCallback((e, target) => {
    const file = e.target.files[0];
    if (file) {
      resizeImage(file).then((resized) => {
        setCurrentPersonForm((prev) => ({ ...prev, photo: resized }));
      });
    }
  }, [resizeImage]);

  const handleAddNewPerson = useCallback(() => {
    if (!authUser) {
      alert(t.loginRequired);
      return;
    }
    if (additionalPeople.length >= 1 && !authUser.isPremium) {
      setShowPaymentPopup(true);
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
      mbtiEI: '',
      mbtiSN: '',
      mbtiTF: '',
      mbtiJP: '',
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

    // MBTI 트레이트 조합
    const mbtiTraits = [
      currentPersonForm.mbtiEI,
      currentPersonForm.mbtiSN,
      currentPersonForm.mbtiTF,
      currentPersonForm.mbtiJP,
    ].filter(Boolean).join(', ');
    const personality = mbtiTraits || currentPersonForm.personality;

    // Supabase에 저장
    if (supabase && authUser) {
      const personData = {
        relationship: currentPersonForm.relationship,
        name: currentPersonForm.name,
        photo_url: currentPersonForm.photo,
        target_age: parseInt(currentPersonForm.targetAge),
        gender: currentPersonForm.gender,
        time_direction: currentPersonForm.timeDirection,
        personality: personality,
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
      // MBTI 트레이트 조합
      const mbtiTraits = [
        person.mbtiEI,
        person.mbtiSN,
        person.mbtiTF,
        person.mbtiJP,
      ].filter(Boolean).join(', ');
      const personality = mbtiTraits || person.personality;

      const personData = {
        relationship: person.relationship,
        name: person.name,
        photo_url: person.photo,
        target_age: parseInt(person.targetAge),
        target_year: person.targetYear ? parseInt(person.targetYear) : null,
        gender: person.gender,
        time_direction: person.timeDirection,
        my_nickname: person.myNickname,
        personality: personality,
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
  const sendMessage = useCallback(async (imageUrl) => {
    if ((!input.trim() && !imageUrl) || !activePerson) return;

    // Check message limit for non-premium users
    if (!authUser?.isPremium && messageCount >= FREE_MESSAGE_LIMIT) {
      // 로그인 안 되어있으면 로그인 먼저 요청
      if (!authUser) {
        setPendingPaymentAfterLogin(true);
        setShowLoginRequired(true);
        // 현재 대화를 localStorage에 저장 (로그인 후 복원용)
        try {
          const pendingChat = {
            person: activePerson,
            messages: messages,
            messageCount: messageCount,
          };
          localStorage.setItem('dearx_pending_chat', JSON.stringify(pendingChat));
        } catch (e) { /* 저장 실패 무시 */ }
      } else {
        setShowPaymentPopup(true);
      }
      return;
    }

    const userMessage = {
      role: 'user',
      content: input || '(사진)',
      imageUrl: imageUrl || null,
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
      db.saveMessage(authUser.id, activePerson.id, { role: 'user', content: input || '(사진)', image_url: imageUrl || null });
    }

    // API 호출
    if (CHAT_FUNCTION_URL) {
      try {
        const requestBody = {
          person: activePerson,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl || null,
          })),
          userName: authUser?.name || 'User',
          userGender: authUser?.gender || null,
          userBirthYear: authUser?.birthYear || null,
          userMbti: authUser?.mbti || null,
          language: language, // ko, en, ja
        };

        const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const response = await fetch(CHAT_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (response.ok) {
          const timestamp = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          }).replace(/\. /g, '.').replace(/\.$/, '');

          // ||| 구분자로 메시지 분리, 없으면 문장 단위로 자동 분리
          let messageParts = data.message.split('|||').map(s => s.trim()).filter(s => s);
          if (messageParts.length <= 1 && data.message.length > 20) {
            messageParts = data.message
              .split(/(?<=[.!?~])\s+/)
              .map(s => s.trim())
              .filter(s => s);
          }
          // 최대 3개 말풍선으로 제한 (초과분은 마지막에 합침)
          if (messageParts.length > 3) {
            const first = messageParts.slice(0, 2);
            const rest = messageParts.slice(2).join(' ');
            messageParts = [...first, rest];
          }

          // 여러 메시지를 순차적으로 추가
          for (let i = 0; i < messageParts.length; i++) {
            const part = messageParts[i];
            await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 500)); // 첫 번째는 바로, 이후는 0.5초 딜레이

            const newMessage = {
              role: 'assistant',
              content: part,
              imageUrl: i === 0 ? (data.imageUrl || null) : null, // 이미지는 첫 메시지에만
              timestamp,
              mode: activePerson.timeDirection,
            };
            setMessages((prev) => [...prev, newMessage]);
          }

          // AI 응답 DB 저장 (각 문장을 개별 레코드로)
          if (supabase && authUser && activePerson?.id) {
            for (let i = 0; i < messageParts.length; i++) {
              db.saveMessage(authUser.id, activePerson.id, {
                role: 'assistant',
                content: messageParts[i],
                image_url: i === 0 ? (data.imageUrl || null) : null,
              });
            }
          }
          setIsTyping(false);
          return;
        }
      } catch (error) {
        // API error - using fallback
      }
    }

    // Fallback: 기본 응답 (API 실패 또는 Demo mode)
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
  }, [input, activePerson, messages, authUser, messageCount, language]);

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
      showMyPage,
      setShowMyPage,
      FREE_MESSAGE_LIMIT,
      t,
      handleLogin,
      handleLogout,
      handleSaveName,
      handleUpdateProfile,
      handleFileUpload,
      resizeImage,
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
      showMyPage,
      t,
      handleLogin,
      handleLogout,
      handleSaveName,
      handleUpdateProfile,
      handleFileUpload,
      resizeImage,
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

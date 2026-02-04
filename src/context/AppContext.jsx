import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from '../constants/translations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('ko');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showPeopleManager, setShowPeopleManager] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingPersonIndex, setEditingPersonIndex] = useState(null);

  const [myInfo, setMyInfo] = useState({
    name: '',
    currentPhoto: null,
    pastPhoto: null,
    targetAge: '',
    gender: '',
    timeDirection: 'past',
  });

  const [additionalPeople, setAdditionalPeople] = useState([]);

  const [currentPersonForm, setCurrentPersonForm] = useState({
    relationship: 'parent',
    name: '',
    photo: null,
    targetAge: '',
    gender: '',
    timeDirection: 'past',
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
  const [authLoading, setAuthLoading] = useState(false);

  const t = useMemo(() => translations[language], [language]);

  const handleLogin = useCallback(async (provider) => {
    setAuthLoading(true);
    setTimeout(() => {
      setAuthUser({ id: `demo-${provider}`, name: 'User', isPremium: false });
      setAuthLoading(false);
    }, 600);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthUser(null);
    setAdditionalPeople([]);
    setMyInfo({ name: '', currentPhoto: null, pastPhoto: null, targetAge: '', gender: '', timeDirection: 'past' });
  }, []);

  const handleFileUpload = useCallback((e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'myCurrentPhoto') {
          setMyInfo((prev) => ({ ...prev, currentPhoto: reader.result }));
        } else if (target === 'myPastPhoto') {
          setMyInfo((prev) => ({ ...prev, pastPhoto: reader.result }));
        } else {
          setCurrentPersonForm((prev) => ({ ...prev, photo: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleMyFormSubmit = useCallback(() => {
    if (!myInfo.name || !myInfo.targetAge || !myInfo.gender || !myInfo.currentPhoto) {
      alert(t.requiredFieldsAlert);
      return;
    }
    const greeting = `${myInfo.name}님, 반갑습니다. ${myInfo.targetAge}세의 ${myInfo.timeDirection === 'past' ? '그때' : '그 시절'}로 돌아온 기분이에요.`;
    setActivePerson({ ...myInfo, relationship: 'self' });
    setMessages([
      {
        role: 'assistant',
        content: greeting,
        timestamp: '2015.06.20',
        mode: myInfo.timeDirection,
      },
    ]);
    setShowChat(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [myInfo, t.requiredFieldsAlert]);

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
      relationship: 'parent',
      name: '',
      photo: null,
      targetAge: '',
      gender: '',
      timeDirection: 'past',
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

  const handleDeletePerson = useCallback((index) => {
    if (window.confirm(t.confirmDelete)) {
      setAdditionalPeople((prev) => prev.filter((_, i) => i !== index));
    }
  }, [t.confirmDelete]);

  const handleSavePerson = useCallback(() => {
    if (!currentPersonForm.name || !currentPersonForm.targetAge || !currentPersonForm.gender || !currentPersonForm.photo) {
      alert(t.requiredFieldsAlert);
      return;
    }
    if (editingPersonIndex !== null) {
      setAdditionalPeople((prev) =>
        prev.map((p, i) => (i === editingPersonIndex ? currentPersonForm : p))
      );
    } else {
      setAdditionalPeople((prev) => [...prev, currentPersonForm]);
    }
    setShowPersonForm(false);
    setEditingPersonIndex(null);
    setShowPeopleManager(true);
  }, [currentPersonForm, editingPersonIndex, t.requiredFieldsAlert]);

  const handleStartChatWithPerson = useCallback((person) => {
    const greeting = `${person.name}... 오랜만이에요. ${
      person.memories
        ? '우리 함께 ' + person.memories.split(',')[0] + '했던 거 기억하시나요?'
        : '보고 싶었어요.'
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
    setShowChat(true);
    setShowPeopleManager(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activePerson) return;
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
  }, [input, activePerson]);

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
      myInfo,
      setMyInfo,
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
      t,
      handleLogin,
      handleLogout,
      handleFileUpload,
      handleMyFormSubmit,
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
      myInfo,
      additionalPeople,
      currentPersonForm,
      activePerson,
      messages,
      input,
      isTyping,
      authUser,
      authLoading,
      t,
      handleLogin,
      handleLogout,
      handleFileUpload,
      handleMyFormSubmit,
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

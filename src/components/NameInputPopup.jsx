import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

function NameInputPopup() {
  const { showNameInput, pendingAuthUser, handleSaveName, t } = useApp();
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  // OAuth에서 가져온 이름으로 초기화
  useEffect(() => {
    if (pendingAuthUser?.oauthName) {
      setName(pendingAuthUser.oauthName);
    }
  }, [pendingAuthUser]);

  // 팝업 열릴 때 포커스
  useEffect(() => {
    if (showNameInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showNameInput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      handleSaveName(name.trim());
    }
  };

  if (!showNameInput) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-[400px] bg-dark-card backdrop-blur-2xl rounded-3xl border border-coral/20 p-8">
        <h2
          className="text-3xl font-display font-black text-center mb-2 bg-gradient-to-br from-white via-coral to-gold bg-clip-text"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          DearX
        </h2>

        <p className="text-center text-cream/80 text-lg mb-2">
          {t.welcomeMessage || '환영합니다!'}
        </p>

        <p className="text-center text-cream/50 text-sm mb-6">
          {t.howToCallYou || '어떻게 불러드릴까요?'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.enterYourName || '이름을 입력해주세요'}
            className="w-full px-4 py-3 bg-dark border border-coral/30 rounded-2xl text-cream text-center text-lg placeholder:text-cream/30 outline-none focus:border-coral/60 transition-colors mb-4"
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-3 rounded-2xl font-medium text-lg transition-all ${
              name.trim()
                ? 'bg-coral text-white hover:bg-coral-dark'
                : 'bg-coral/20 text-cream/30 cursor-not-allowed'
            }`}
          >
            {t.startButton || '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NameInputPopup;

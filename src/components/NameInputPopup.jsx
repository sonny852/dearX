import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

function NameInputPopup() {
  const { showNameInput, pendingAuthUser, handleSaveName, t } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const inputRef = useRef(null);

  // OAuth에서 가져온 이름으로 초기화
  useEffect(() => {
    if (pendingAuthUser?.oauthName) {
      setName(pendingAuthUser.oauthName);
    }
  }, [pendingAuthUser]);

  // 스텝 변경 시 포커스
  useEffect(() => {
    if (showNameInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showNameInput, step]);

  const handleNext = () => {
    if (step === 0 && name.trim()) {
      setStep(1);
    } else if (step === 1 && gender) {
      setStep(2);
    } else if (step === 2) {
      handleSaveName(name.trim(), gender, birthYear ? parseInt(birthYear) : null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleNext();
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

        {/* Step 0: 이름 */}
        {step === 0 && (
          <>
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
                {t.next || '다음'}
              </button>
            </form>
          </>
        )}

        {/* Step 1: 성별 */}
        {step === 1 && (
          <>
            <p className="text-center text-cream/50 text-sm mb-6">
              {name}님의 성별을 알려주세요
            </p>
            <div className="flex flex-col gap-3 mb-4">
              {[
                { value: 'male', label: '남성' },
                { value: 'female', label: '여성' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setGender(opt.value); setTimeout(() => setStep(2), 200); }}
                  className={`w-full py-3 rounded-2xl border text-lg font-medium transition-all ${
                    gender === opt.value
                      ? 'bg-coral/20 border-coral text-coral'
                      : 'bg-dark border-coral/30 text-cream/70 hover:border-coral/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: 생년 */}
        {step === 2 && (
          <>
            <p className="text-center text-cream/50 text-sm mb-6">
              태어난 연도를 알려주세요
            </p>
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="예: 1995"
                className="w-full px-4 py-3 bg-dark border border-coral/30 rounded-2xl text-cream text-center text-lg placeholder:text-cream/30 outline-none focus:border-coral/60 transition-colors mb-4"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl font-medium text-lg transition-all bg-coral text-white hover:bg-coral-dark"
              >
                {t.startButton || '시작하기'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveName(name.trim(), gender, null)}
                className="w-full py-2 mt-2 text-cream/40 text-sm hover:text-cream/60 transition-colors"
              >
                건너뛰기
              </button>
            </form>
          </>
        )}

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step ? 'bg-coral w-6' : s < step ? 'bg-coral/50' : 'bg-cream/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default NameInputPopup;

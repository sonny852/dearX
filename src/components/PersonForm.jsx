import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Send, Upload, X, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PersonForm = memo(function PersonForm({ isInitialForm = false, onBackToStart }) {
  const {
    showPersonForm,
    setShowPersonForm,
    showForm,
    currentPersonForm,
    setCurrentPersonForm,
    editingPersonIndex,
    handleFileUpload,
    handleSavePerson,
    handleStartChatWithPerson,
    t,
  } = useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);

  const currentYear = new Date().getFullYear();

  const steps = [
    {
      key: 'relationship',
      question: t.stepQuestion1 || '누구를 만나고 싶으세요?',
      placeholder: t.relationshipPlaceholder || '예: 할머니, 아버지, 친구...',
      type: 'text'
    },
    {
      key: 'name',
      question: '', // Will be dynamic
      placeholder: t.namePlaceholder || '이름을 입력해주세요',
      type: 'text'
    },
    {
      key: 'targetYear',
      question: '', // Will be dynamic
      placeholder: '예: 1985, 2045',
      type: 'text',
      inputType: 'number'
    },
    {
      key: 'targetAge',
      question: '', // Will be dynamic
      placeholder: '예: 35',
      type: 'text',
      inputType: 'number'
    },
    {
      key: 'gender',
      question: t.genderQuestion || '성별을 알려주세요',
      type: 'choice',
      choices: [
        { value: 'female', label: t.female || '여성' },
        { value: 'male', label: t.male || '남성' },
        { value: 'other', label: t.other_gender || '기타' }
      ]
    },
    {
      key: 'myNickname',
      question: '', // Will be dynamic
      placeholder: '예: 우리 아들, 막내야, 철수야...',
      type: 'text'
    },
    {
      key: 'photo',
      question: t.stepQuestion5 || '사진이 있으시면 올려주세요',
      type: 'photo',
      optional: true
    },
    {
      key: 'memories',
      question: t.stepQuestion6 || '함께한 추억이 있나요?',
      placeholder: t.memoriesPlaceholder || '예: 함께 시장 가던 것...',
      type: 'text',
      optional: true
    },
  ];

  // Get dynamic question text
  const getQuestionText = (stepIndex) => {
    const step = steps[stepIndex];
    const rel = currentPersonForm.relationship;

    if (stepIndex === 1) {
      return rel ? `${rel}의 이름은 무엇인가요?` : '이름을 알려주세요';
    }
    if (stepIndex === 2) {
      return rel ? `몇 년도의 ${rel}을(를) 만나고 싶으세요?` : '몇 년도의 모습을 만나고 싶으세요?';
    }
    if (stepIndex === 3) {
      const year = currentPersonForm.targetYear;
      if (year && rel) {
        return `${year}년, ${rel}은(는) 몇 살이었나요?`;
      }
      return rel ? `그때 ${rel}은(는) 몇 살이었나요?` : '그때 몇 살이었나요?';
    }
    if (stepIndex === 5) {
      return rel ? `${rel}이(가) 나를 뭐라고 불렀나요?` : '상대방이 나를 뭐라고 불렀나요?';
    }
    return step.question;
  };

  // Reset when form opens
  useEffect(() => {
    if ((isInitialForm && showForm) || (!isInitialForm && showPersonForm)) {
      if (editingPersonIndex !== null) {
        setCurrentStep(steps.length);
      } else {
        setCurrentStep(0);
        setInputValue('');
      }
    }
  }, [showForm, showPersonForm, editingPersonIndex, isInitialForm]);

  // Focus input
  useEffect(() => {
    if (steps[currentStep]?.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setInputValue('');
      setIsAnimating(false);
    }, 200);
  }, []);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        // 이전 단계의 값을 inputValue에 복원
        const prevStepKey = steps[currentStep - 1]?.key;
        if (prevStepKey && currentPersonForm[prevStepKey]) {
          setInputValue(String(currentPersonForm[prevStepKey]));
        } else {
          setInputValue('');
        }
        setIsAnimating(false);
      }, 200);
    }
  }, [currentStep, currentPersonForm]);

  const handleTextSubmit = useCallback(() => {
    if (!inputValue.trim() && !steps[currentStep]?.optional) return;

    const step = steps[currentStep];
    if (inputValue.trim()) {
      // Auto-set timeDirection based on year
      if (step.key === 'targetYear') {
        const year = parseInt(inputValue);
        const timeDirection = year <= currentYear ? 'past' : 'future';
        setCurrentPersonForm(prev => ({ ...prev, [step.key]: inputValue, timeDirection }));
      } else {
        setCurrentPersonForm(prev => ({ ...prev, [step.key]: inputValue }));
      }
    }
    goToNextStep();
  }, [inputValue, currentStep, goToNextStep, currentYear]);

  const handleChoiceSelect = useCallback((value) => {
    const step = steps[currentStep];
    setCurrentPersonForm(prev => ({ ...prev, [step.key]: value }));
    goToNextStep();
  }, [currentStep, goToNextStep]);

  const handlePhotoUpload = useCallback((e) => {
    handleFileUpload(e, 'person');
    goToNextStep();
  }, [handleFileUpload, goToNextStep]);

  const handleSkip = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const handleFinalSubmit = useCallback(() => {
    if (!currentPersonForm.relationship || !currentPersonForm.name ||
        !currentPersonForm.targetAge || !currentPersonForm.gender) {
      return;
    }
    if (isInitialForm) {
      handleStartChatWithPerson(currentPersonForm);
    } else {
      handleSavePerson();
    }
  }, [currentPersonForm, isInitialForm, handleStartChatWithPerson, handleSavePerson]);

  // Visibility check
  if (!isInitialForm && !showPersonForm) return null;
  if (isInitialForm && !showForm) return null;

  const currentStepData = steps[currentStep];
  const isComplete = currentStep >= steps.length;
  const canSubmit = currentPersonForm.relationship && currentPersonForm.name &&
                    currentPersonForm.targetYear && currentPersonForm.targetAge &&
                    currentPersonForm.gender && currentPersonForm.myNickname;

  // Show progress bar only after first step (for initial form) or always (for modal)
  const showProgressBar = !isInitialForm || currentStep > 0;

  return (
    <>
      {/* Header - 상단 고정, AuthBar와 같은 라인 (컨테이너 밖에 위치) */}
      {showProgressBar && (
        <div className="fixed top-4 left-4 right-4 flex items-center justify-between z-[1999]">
          {/* 첫 화면으로 돌아가기 버튼 */}
          {onBackToStart ? (
            <button
              onClick={onBackToStart}
              className="px-3 py-1.5 rounded-full bg-dark/80 backdrop-blur-xl border border-coral/20 text-cream/85 text-[11px] font-semibold cursor-pointer hover:bg-dark hover:border-coral/40 transition-all flex items-center gap-1"
            >
              ← {t.back}
            </button>
          ) : !isInitialForm ? (
            <button
              onClick={() => setShowPersonForm(false)}
              className="px-3 py-1.5 rounded-full bg-dark/80 backdrop-blur-xl border border-coral/20 text-cream/85 text-[11px] font-semibold cursor-pointer hover:bg-dark hover:border-coral/40 transition-all flex items-center gap-1"
            >
              <X size={14} /> {t.close}
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Progress dots - 중앙 */}
          <div className="flex gap-1.5 bg-dark/80 backdrop-blur-xl px-3 py-2 rounded-full border border-coral/20">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < currentStep ? 'w-5 bg-coral' : i === currentStep ? 'w-5 bg-coral/60' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* 오른쪽 빈공간 (로그인 버튼 자리) */}
          <div className="w-16" />
        </div>
      )}

      <div
        className={`${isInitialForm ? 'min-h-screen pb-24' : 'fixed inset-0 z-[200]'} flex flex-col bg-dark relative overflow-hidden`}
        style={isInitialForm ? {
          animation: 'formFadeIn 0.8s ease-out',
          animationFillMode: 'both'
        } : {}}
      >
        {/* 배경 장식 */}
        {isInitialForm && (
          <>
            <div className="absolute top-20 left-10 w-32 h-32 bg-coral/5 rounded-full blur-3xl" />
            <div className="absolute top-40 right-5 w-24 h-24 bg-gold/5 rounded-full blur-2xl" />
            <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-coral/3 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-gold/5 rounded-full blur-2xl" />
          </>
        )}

      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 z-10 pt-16">
        {!isComplete && (
          <div
            className={`w-full max-w-md transition-all duration-200 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
          >
            {/* Question */}
            <h2 className="text-2xl font-medium text-cream mb-8 leading-relaxed text-center">
              {getQuestionText(currentStep)}
            </h2>

            {/* Input based on type */}
            {currentStepData?.type === 'text' && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                    placeholder={currentStepData.placeholder}
                    className="w-full px-0 py-3 bg-transparent border-b-2 border-white/20 focus:border-coral text-cream text-xl placeholder:text-cream/30 outline-none transition-colors"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  {/* 이전 단계 버튼 */}
                  {currentStep > 0 ? (
                    <button
                      onClick={goToPrevStep}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-cream/50 hover:text-cream hover:bg-white/20 transition-all"
                    >
                      ←
                    </button>
                  ) : (
                    <div className="w-12" />
                  )}

                  {/* 건너뛰기 - 가운데 */}
                  {currentStepData.optional ? (
                    <button
                      onClick={handleSkip}
                      className="text-cream/40 text-sm hover:text-cream/60 transition-colors"
                    >
                      건너뛰기
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    id="send-button"
                    onClick={handleTextSubmit}
                    disabled={!inputValue.trim() && !currentStepData.optional}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      inputValue.trim()
                        ? 'bg-coral text-white'
                        : 'bg-white/10 text-cream/30'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}

            {currentStepData?.type === 'choice' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  {currentStepData.choices.map((choice) => (
                    <button
                      key={choice.value}
                      onClick={() => handleChoiceSelect(choice.value)}
                      className="w-full py-4 px-5 bg-white/5 hover:bg-coral/10 border border-white/10 hover:border-coral/30 rounded-2xl text-cream text-lg text-left transition-all flex items-center gap-3"
                    >
                      {choice.emoji && <span className="text-2xl">{choice.emoji}</span>}
                      {choice.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  {currentStep > 0 ? (
                    <button
                      onClick={goToPrevStep}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-cream/50 hover:text-cream hover:bg-white/20 transition-all"
                    >
                      ←
                    </button>
                  ) : (
                    <div className="w-12" />
                  )}
                  <div />
                  <div className="w-12" />
                </div>
              </div>
            )}

            {currentStepData?.type === 'photo' && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="personPhotoUpload"
                />
                <label
                  htmlFor="personPhotoUpload"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-coral/10 border border-white/10 hover:border-coral/30 rounded-2xl text-cream cursor-pointer transition-all"
                >
                  <Upload size={20} />
                  <span>사진 선택하기</span>
                </label>
                <div className="flex justify-between items-center pt-2">
                  {currentStep > 0 ? (
                    <button
                      onClick={goToPrevStep}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-cream/50 hover:text-cream hover:bg-white/20 transition-all"
                    >
                      ←
                    </button>
                  ) : (
                    <div className="w-12" />
                  )}
                  <button
                    onClick={handleSkip}
                    className="py-3 text-cream/40 text-sm hover:text-cream/60 transition-colors"
                  >
                    나중에 할게요
                  </button>
                  <div className="w-12" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Final submit */}
        {isComplete && canSubmit && (
          <div className={`w-full max-w-md transition-all duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-cream/60 text-center mb-6">
              {currentPersonForm.targetYear}년의 {currentPersonForm.relationship}을(를) 만날 준비가 됐어요
            </p>
            <button
              onClick={handleFinalSubmit}
              className="w-full py-4 bg-coral text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              대화 시작하기
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

        <style>{`
          @keyframes formFadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
});

export default PersonForm;

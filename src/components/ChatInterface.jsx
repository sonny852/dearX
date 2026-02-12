import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Send, Clock, X, Home, Share2, Download, Camera, Plus, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { auth } from '../lib/supabase';

const ChatInterface = memo(function ChatInterface() {
  const {
    activePerson,
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    handleBackFromChat,
    setShowForm,
    messageCount,
    FREE_MESSAGE_LIMIT,
    authUser,
    showLoginRequired,
    setShowLoginRequired,
    handleLogin,
    resizeImage,
    t,
  } = useApp();

  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [captureSelectMode, setCaptureSelectMode] = useState(false);
  const [captureRange, setCaptureRange] = useState({ start: null, end: null });
  const [captureStyle, setCaptureStyle] = useState('letter');
  const [attachedImage, setAttachedImage] = useState(null); // 첨부된 이미지 base64
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState(null);
  const captureRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // 로그인 모달 열리면 Google OAuth URL 미리 생성
  useEffect(() => {
    if (showLoginModal) {
      auth.getAuthUrl('google').then(url => {
        if (url) setGoogleAuthUrl(url);
      });
    }
    return () => setGoogleAuthUrl(null);
  }, [showLoginModal]);

  // iOS Safari 키보드 대응: visualViewport 추적
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let rafId;
    const handleViewport = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.height = `${viewport.height}px`;
          containerRef.current.style.transform = `translateY(${viewport.offsetTop}px)`;
        }
        // 키보드 올라올 때 마지막 메시지로 스크롤
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    };

    viewport.addEventListener('resize', handleViewport);
    viewport.addEventListener('scroll', handleViewport);
    handleViewport();

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener('resize', handleViewport);
      viewport.removeEventListener('scroll', handleViewport);
    };
  }, []);

  // 캡처할 메시지들 계산
  const messagesToCapture = captureRange.start !== null && captureRange.end !== null
    ? messages.slice(
        Math.min(captureRange.start, captureRange.end),
        Math.max(captureRange.start, captureRange.end) + 1
      )
    : [];

  const handleGoHome = () => {
    handleBackFromChat();
    setShowForm(false);
  };

  const remainingFreeMessages = FREE_MESSAGE_LIMIT - messageCount;

  useEffect(() => {
    // 말풍선 애니메이션이 시작된 후 스크롤 (애니메이션 렌더링 대기)
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // 플러스 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => setShowPlusMenu(false);
    if (showPlusMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPlusMenu]);

  // 사진 첨부 핸들러
  const handleAttachImage = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file && resizeImage) {
      const resized = await resizeImage(file);
      setAttachedImage(resized);
    }
    // input 초기화 (같은 파일 재선택 가능하게)
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [resizeImage]);

  // 사진 포함 전송
  const handleSendWithImage = useCallback(() => {
    sendMessage(attachedImage || undefined);
    setAttachedImage(null);
  }, [sendMessage, attachedImage]);

  // 메시지 선택 핸들러
  const handleMessageSelect = useCallback((index) => {
    if (!captureSelectMode) return;

    setCaptureRange(prev => {
      if (prev.start === null) {
        // 첫 번째 선택 - 시작점
        return { start: index, end: null };
      } else if (prev.end === null) {
        // 두 번째 선택 - 끝점
        return { ...prev, end: index };
      } else {
        // 이미 둘 다 선택됨 - 리셋하고 새로 시작
        return { start: index, end: null };
      }
    });
  }, [captureSelectMode]);

  // 메시지가 선택 범위 내인지 확인
  const isMessageInRange = useCallback((index) => {
    if (captureRange.start === null) return false;
    if (captureRange.end === null) return index === captureRange.start;
    const min = Math.min(captureRange.start, captureRange.end);
    const max = Math.max(captureRange.start, captureRange.end);
    return index >= min && index <= max;
  }, [captureRange]);

  // 캡처 기능
  const handleCapture = useCallback(async () => {
    if (!captureRef.current || messagesToCapture.length === 0) {
      return;
    }

    setIsCapturing(true);
    setShowCaptureModal(true);

    try {
      // 약간의 딜레이 후 캡처 (렌더링 대기)
      await new Promise(resolve => setTimeout(resolve, 100));

      const bgColors = { letter: '#faf3e8', night: '#0a0e27' };
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: bgColors[captureStyle] || '#0a0e27',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      setCapturedImage(canvas.toDataURL('image/png'));
    } catch (error) {
      // 캡처 실패 시 조용히 처리
    } finally {
      setIsCapturing(false);
    }
  }, [messagesToCapture.length, captureStyle]);

  // 스타일 변경 시 자동 재캡처
  useEffect(() => {
    if (showCaptureModal && messagesToCapture.length > 0) {
      handleCapture();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureStyle]);

  // 이미지 다운로드
  const handleDownload = useCallback(() => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.download = `dearx-chat-${activePerson?.name || 'conversation'}-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  }, [capturedImage, activePerson?.name]);

  // 공유 기능
  const handleShare = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'dearx-chat.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: '그리운 사람의 편지가 왔어요 💌',
          files: [file],
        });
      }
    } catch (error) {
      // 공유 취소/실패 시 아무것도 하지 않음
    }
  }, [capturedImage]);

  if (!activePerson) return null;

  return (
    <div ref={containerRef} className="fixed top-0 left-0 right-0 bg-dark z-[100] flex flex-col" style={{ height: '100%', willChange: 'transform, height' }}>
      {/* Header */}
      <div className="p-4 border-b border-coral/20 bg-gradient-to-b from-dark/95 to-dark/80">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 홈 버튼 - 비로그인 사용자만 */}
            {!authUser && (
              <button
                onClick={handleGoHome}
                className="w-10 h-10 rounded-full bg-coral/10 border border-coral/30 flex items-center justify-center text-coral hover:bg-coral/20 transition-colors"
              >
                <Home size={18} />
              </button>
            )}
            <div
              className="w-10 h-10 rounded-full border-2 border-coral/30 flex-shrink-0"
              style={{
                background: (activePerson.currentPhoto || activePerson.photo)
                  ? `url(${activePerson.currentPhoto || activePerson.photo}) center/cover`
                  : 'linear-gradient(135deg, rgba(255, 140, 105, 0.3) 0%, rgba(255, 193, 122, 0.3) 100%)',
              }}
            />
            <div className="min-w-0">
              <h2 className="m-0 text-base font-display font-bold text-coral truncate">
                {activePerson.name}
              </h2>
              <p className="m-0 text-xs text-cream/50">
                {activePerson.targetAge}{t.ageUnit} · {activePerson.timeDirection === 'past' ? t.past : t.future}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={authUser ? handleBackFromChat : handleGoHome}
              className="px-3 py-2 bg-coral/10 border border-coral/30 rounded-xl text-coral cursor-pointer text-xs hover:bg-coral/20 transition-colors"
            >
              {t.back}
            </button>
            {!authUser && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-2 bg-dark-card border border-coral/30 rounded-xl text-cream cursor-pointer text-xs hover:bg-coral/10 transition-colors"
              >
                {t.login || '로그인'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(255, 140, 105, 0.04) 0%, transparent 50%)',
        }}
      >
        <div className="max-w-[900px] mx-auto w-full flex-1" />
        <div className="max-w-[900px] mx-auto w-full">
          {/* 비로그인 사용자 알림 */}
          {!authUser && (
            <div className="mb-6 p-4 bg-coral/10 border border-coral/30 rounded-2xl text-center">
              <p className="text-cream/80 text-sm mb-2">
                {t.guestNotice || '회원 정보가 저장되지 않아 대화 내용이 정확하지 않을 수 있어요'}
              </p>
              <p className="text-cream/50 text-xs">
                {t.guestNoticeLogin || '로그인하면 더 자연스러운 대화가 가능합니다'}
              </p>
            </div>
          )}
          {/* 선택 모드 안내 */}
          {captureSelectMode && (
            <div className="mb-4 p-3 bg-coral/20 border border-coral/40 rounded-xl text-center">
              <p className="text-cream text-sm">
                {captureRange.start === null
                  ? (t.selectStartMessage || '시작 메시지를 선택하세요')
                  : captureRange.end === null
                    ? (t.selectEndMessage || '끝 메시지를 선택하세요')
                    : (t.rangeSelected || '범위가 선택되었습니다')}
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            // 마지막 4개 메시지만 애니메이션, 나머지는 즉시 표시
            const fromEnd = messages.length - 1 - i;
            const shouldAnimate = fromEnd < 4;
            return (
            <div
              key={i}
              className={`message-bubble mb-2 flex ${captureSelectMode ? 'cursor-pointer' : ''}`}
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                ...(shouldAnimate
                  ? { animationDelay: `${fromEnd * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }
                  : { opacity: 1 }),
              }}
              onClick={() => handleMessageSelect(i)}
            >
              <div
                className={`max-w-[80%] px-3 py-2 transition-all ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-coral to-coral-dark shadow-md shadow-coral/20'
                    : 'rounded-2xl rounded-bl-sm bg-dark-card border border-coral/30 shadow-md shadow-black/20'
                } ${captureSelectMode && isMessageInRange(i) ? 'ring-2 ring-gold ring-offset-2 ring-offset-dark' : ''}`}
              >
                {/* 이미지가 있으면 표시 */}
                {msg.imageUrl && (
                  <div className="mb-1.5">
                    <img
                      src={msg.imageUrl}
                      alt="Generated"
                      className="w-full max-w-[300px] rounded-xl border border-coral/20"
                      loading="lazy"
                    />
                  </div>
                )}
                <p
                  className={`m-0 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'text-white' : 'text-cream'
                  }`}
                >
                  {msg.content}
                </p>
                <div
                  className={`mt-1 text-[10px] flex items-center gap-1 ${
                    msg.role === 'user' ? 'text-white/50' : 'text-coral/60'
                  }`}
                >
                  <Clock size={10} />
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="mb-8 flex justify-start">
              <div className="p-6 rounded-3xl rounded-bl-sm bg-dark-card border border-coral/30 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="typing-dot w-2 h-2 rounded-full bg-coral"
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input / Selection Mode */}
      <div className="p-3 border-t border-coral/20 bg-gradient-to-t from-dark/95 to-dark/80">
        <div className="max-w-[900px] mx-auto">
          {/* 캡처 선택 모드 액션 바 */}
          {captureSelectMode ? (
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setCaptureSelectMode(false);
                  setCaptureRange({ start: null, end: null });
                }}
                className="px-6 py-3 bg-dark-card border border-coral/30 rounded-xl text-cream hover:bg-coral/10 transition-colors"
              >
                {t.cancel || '취소'}
              </button>

              <span className="text-cream/60 text-sm">
                {messagesToCapture.length > 0
                  ? (t.messagesSelected || '{{count}}개 메시지 선택됨').replace('{{count}}', messagesToCapture.length)
                  : (t.selectMessages || '메시지를 선택하세요')}
              </span>

              <button
                onClick={() => {
                  setCaptureSelectMode(false);
                  handleCapture();
                }}
                disabled={messagesToCapture.length === 0}
                className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                  messagesToCapture.length > 0
                    ? 'bg-gradient-to-r from-coral to-gold text-white'
                    : 'bg-coral/20 text-cream/40 cursor-not-allowed'
                }`}
              >
                <Camera size={18} />
                {t.capture || '캡처'}
              </button>
            </div>
          ) : (
            <>
              {/* 첨부 이미지 미리보기 */}
              {attachedImage && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={attachedImage}
                    alt="Attached"
                    className="w-20 h-20 object-cover rounded-xl border border-coral/30"
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-dark-card border border-coral/30 rounded-full flex items-center justify-center text-coral hover:bg-coral/20 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {/* Free message counter for non-premium users */}
              {!authUser?.isPremium && remainingFreeMessages > 0 && (
                <div className="text-center mb-3">
                  <span className="text-cream/50 text-xs">
                    {(t.freeMessagesRemaining || '무료 대화 {{count}}회 남음').replace('{{count}}', remainingFreeMessages)}
                  </span>
                </div>
              )}
              <div className="flex gap-3 items-center">
            {/* + 버튼 (카카오톡 스타일) */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowPlusMenu(!showPlusMenu); }}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                  showPlusMenu
                    ? 'bg-coral/30 border-coral text-coral rotate-45'
                    : 'bg-dark-card border-coral/30 text-coral/70 hover:border-coral/50 hover:text-coral'
                }`}
              >
                <Plus size={24} />
              </button>

              {/* 플러스 메뉴 팝업 */}
              {showPlusMenu && (
                <div
                  className="absolute bottom-full left-0 mb-2 bg-dark-card border border-coral/30 rounded-2xl shadow-xl shadow-black/50 overflow-hidden min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 사진 첨부 */}
                  <button
                    onClick={() => {
                      setShowPlusMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-cream hover:bg-coral/10 transition-colors"
                  >
                    <ImageIcon size={18} className="text-coral" />
                    <span className="text-sm">{t.attachPhoto || '사진 첨부'}</span>
                  </button>
                  {/* 대화 캡처 */}
                  <button
                    onClick={() => {
                      setShowPlusMenu(false);
                      setCaptureSelectMode(true);
                      setCaptureRange({ start: null, end: null });
                    }}
                    disabled={messages.length === 0}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      messages.length === 0
                        ? 'text-cream/30 cursor-not-allowed'
                        : 'text-cream hover:bg-coral/10'
                    }`}
                  >
                    <Camera size={18} className="text-coral" />
                    <span className="text-sm">{t.captureChat || '대화 캡처'}</span>
                  </button>
                </div>
              )}
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAttachImage}
                className="hidden"
              />
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendWithImage()}
              onFocus={() => setShowPlusMenu(false)}
              placeholder={t.sendMessage}
              className="flex-1 min-w-0 px-4 py-3 text-sm bg-dark-card border border-coral/30 rounded-full text-cream outline-none focus:border-coral/60 transition-colors"
            />
            <button
              onClick={handleSendWithImage}
              disabled={!input.trim() && !attachedImage}
              className={`p-4 w-12 h-12 rounded-full border-none flex items-center justify-center transition-all ${
                input.trim() || attachedImage
                  ? 'bg-gradient-to-br from-coral to-coral-dark cursor-pointer shadow-lg shadow-coral/40'
                  : 'bg-coral/20 cursor-not-allowed'
              }`}
            >
              <Send size={20} color="#ffffff" />
            </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Login Required Popup */}
      {showLoginRequired && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-[400px] bg-dark-card backdrop-blur-2xl rounded-3xl border border-coral/20 p-8">
            <button
              onClick={() => setShowLoginRequired(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-coral/60 hover:text-coral transition-colors"
            >
              <X size={18} />
            </button>

            <h2
              className="text-3xl font-display font-black text-center mb-2 bg-gradient-to-br from-white via-coral to-gold bg-clip-text"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              DearX
            </h2>

            <p className="text-center text-cream/60 text-sm mb-6">
              {t.freeMessagesUsed || '무료 대화 횟수를 모두 사용했어요'}
            </p>

            <p className="text-center text-cream/50 text-xs mb-6">
              {t.loginRequiredToContinue || '계속 대화하려면 로그인이 필요해요'}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { handleLogin('google'); setShowLoginRequired(false); }}
                className="w-full h-12 rounded-2xl bg-white text-[#333] text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-95 transition-all"
              >
                <img
                  alt=""
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-5 h-5"
                />
                {t.continueWithGoogle}
              </button>

              <button
                onClick={() => alert(t.comingSoonMessage || '연동 예정입니다')}
                className="w-full h-12 rounded-2xl bg-[#FEE500] text-[#191919] text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-95 transition-all"
              >
                <img
                  alt=""
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
                  className="w-5 h-5"
                />
                {t.continueWithKakao}
              </button>

              <button
                onClick={() => alert(t.comingSoonMessage || '연동 예정입니다')}
                className="w-full h-12 rounded-2xl bg-[#03C75A] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-95 transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center text-white font-bold text-xs">N</span>
                {t.continueWithNaver || '네이버로 계속하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-[420px] bg-dark-card border border-coral/15 rounded-t-3xl sm:rounded-3xl p-10 pt-12 animate-slide-up">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/50 hover:text-cream hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <h2
              className="text-4xl font-display font-black text-center mb-2 bg-gradient-to-br from-white via-coral to-gold bg-clip-text"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              DearX
            </h2>
            <p className="text-center text-cream/50 text-sm mb-10">
              {t.loginSubtitle}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { if (googleAuthUrl) window.location.href = googleAuthUrl; }}
                disabled={!googleAuthUrl}
                className="w-full h-[54px] rounded-2xl bg-white text-[#333] text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                {t.continueWithGoogle}
              </button>
              <button
                onClick={() => alert(t.comingSoonMessage || '연동 예정입니다')}
                className="w-full h-[54px] rounded-2xl bg-[#FEE500] text-[#191919] text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all"
              >
                <img alt="" src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" className="w-5 h-5" />
                {t.continueWithKakao}
              </button>
              <button
                onClick={() => alert(t.comingSoonMessage || '연동 예정입니다')}
                className="w-full h-[54px] rounded-2xl bg-[#03C75A] text-white text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center text-white font-bold text-sm">N</span>
                {t.continueWithNaver || '네이버로 계속하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-[400] flex flex-col bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-[500px] mx-auto bg-dark-card flex flex-col" style={{ maxHeight: '100dvh' }}>
            {/* Modal Header - 고정 */}
            <div className="flex items-center justify-between p-4 border-b border-coral/20 flex-shrink-0">
              <h3 className="text-lg font-display font-bold text-coral">
                {t.captureChat || '대화 캡처'}
              </h3>
              <button
                onClick={() => { setShowCaptureModal(false); setCapturedImage(null); setCaptureRange({ start: null, end: null }); setCaptureStyle('letter'); }}
                className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-coral/60 hover:text-coral transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Style Selector - 고정 */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-center gap-3 flex-shrink-0">
              {[
                { id: 'letter', label: '편지', bg: '#faf3e8', border: '#d4a574', text: '#4a3728' },
                { id: 'night', label: '밤하늘', bg: 'linear-gradient(135deg, #0a0e27, #1a0a2e)', border: '#a78bba', text: '#ffc17a' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setCaptureStyle(style.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                    captureStyle === style.id
                      ? 'scale-105 shadow-lg'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  style={{
                    borderColor: captureStyle === style.id ? style.border : 'rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{
                      background: style.bg,
                      borderColor: style.border,
                    }}
                  />
                  <span className="text-sm text-cream font-medium">{style.label}</span>
                </button>
              ))}
            </div>

            {/* Capture Preview - 스크롤 영역 */}
            <div className="p-4 flex-1 overflow-y-auto">
              {isCapturing ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : capturedImage ? (
                <img src={capturedImage} alt="Captured chat" className="w-full rounded-2xl" />
              ) : null}
            </div>

            {/* Action Buttons - 하단 고정 */}
            {capturedImage && (
              <div className="p-4 border-t border-coral/20 flex gap-3 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-coral/20 border border-coral/30 rounded-xl text-coral font-medium flex items-center justify-center gap-2 hover:bg-coral/30 transition-colors"
                >
                  <Download size={18} />
                  {t.download || '저장'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 bg-gradient-to-r from-coral to-gold rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Share2 size={18} />
                  {t.share || '공유'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 캡처용 숨겨진 영역 - 스타일별 조건부 렌더링 */}
      <div className="absolute left-[-9999px] top-0">
        <div ref={captureRef} className="w-[420px]" style={{
          background: captureStyle === 'letter'
            ? '#faf3e8'
            : 'linear-gradient(180deg, #0a0e27, #1a0a2e, #0d1117)',
        }}>

          {/* ===== 편지 스타일 (Letter) ===== */}
          {captureStyle === 'letter' && (
            <>
              {/* 편지 테두리 장식 */}
              <div style={{
                borderLeft: '4px solid #d4a574',
                margin: '0 20px',
                paddingLeft: '20px',
              }}>
                {/* 헤더 */}
                <div style={{ padding: '28px 0 16px', borderBottom: '1px dashed #d4a574', marginBottom: '16px' }}>
                  <p style={{
                    fontFamily: 'Georgia, "Noto Serif KR", serif',
                    fontSize: '22px',
                    color: '#4a3728',
                    marginBottom: '4px',
                  }}>
                    To. {activePerson?.name} 💌
                  </p>
                  <p style={{
                    fontFamily: 'Georgia, "Noto Serif KR", serif',
                    fontSize: '13px',
                    color: '#8a7560',
                  }}>
                    그리운 {activePerson?.name}에게 보내는 편지
                  </p>
                </div>

                {/* 메시지들 */}
                <div style={{ padding: '8px 0 20px' }}>
                  {messagesToCapture.map((msg, i) => (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      <p style={{
                        fontFamily: 'Georgia, "Noto Serif KR", serif',
                        fontSize: '15px',
                        lineHeight: '1.8',
                        color: msg.role === 'user' ? '#6b4c3b' : '#4a3728',
                        fontWeight: msg.role === 'user' ? '400' : '500',
                        wordBreak: 'keep-all',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        margin: 0,
                      }}>
                        {msg.content}
                      </p>
                      <span style={{
                        fontSize: '11px',
                        color: '#b8a08a',
                        display: 'block',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        marginTop: '4px',
                      }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                </div>

                {/* From 서명 */}
                <div style={{ padding: '0 0 20px', textAlign: 'right' }}>
                  <p style={{
                    fontFamily: 'Georgia, "Noto Serif KR", serif',
                    fontSize: '16px',
                    color: '#8a7560',
                    fontStyle: 'italic',
                  }}>
                    From. {authUser?.name || 'DearX'}
                  </p>
                </div>
              </div>

              {/* 푸터 */}
              <div style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px dashed #d4a574',
                background: '#f5ead8',
              }}>
                <table style={{ borderCollapse: 'collapse' }}><tbody><tr>
                  <td style={{ verticalAlign: 'middle', paddingRight: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '2px solid #d4a574',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#faf3e8',
                    }}>
                      <img src="/favicon.png" alt="DearX" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#4a3728', fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}>그리움을 만나다</span>
                    <span style={{ fontSize: '11px', color: '#8a7560', display: 'block', lineHeight: 1.2 }}>DearX</span>
                  </td>
                </tr></tbody></table>
                <div style={{ background: 'white', padding: '4px', borderRadius: '4px', border: '1px solid #d4a574' }}>
                  <QRCodeSVG value="https://dearx.io" size={48} />
                </div>
              </div>
            </>
          )}

          {/* ===== 밤하늘 스타일 (Night Sky) ===== */}
          {captureStyle === 'night' && (
            <>
              {/* 별 장식 상단 */}
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                {/* 별 점들 */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', pointerEvents: 'none' }}>
                  {[
                    { top: 12, left: 30, size: 2, opacity: 0.8 },
                    { top: 25, left: 80, size: 3, opacity: 1 },
                    { top: 8, left: 150, size: 2, opacity: 0.6 },
                    { top: 35, left: 200, size: 2.5, opacity: 0.9 },
                    { top: 15, left: 280, size: 2, opacity: 0.7 },
                    { top: 40, left: 340, size: 3, opacity: 0.8 },
                    { top: 20, left: 380, size: 2, opacity: 0.5 },
                    { top: 50, left: 120, size: 1.5, opacity: 0.6 },
                    { top: 45, left: 260, size: 2, opacity: 0.7 },
                    { top: 60, left: 50, size: 1.5, opacity: 0.5 },
                    { top: 55, left: 310, size: 2, opacity: 0.6 },
                    { top: 10, left: 400, size: 2.5, opacity: 0.8 },
                  ].map((star, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: `${star.top}px`,
                      left: `${star.left}px`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      borderRadius: '50%',
                      background: '#fff',
                      opacity: star.opacity,
                    }} />
                  ))}
                </div>

                {/* 헤더 */}
                <div style={{ padding: '28px 24px 16px' }}>
                  <p style={{
                    fontSize: '20px',
                    color: '#ffc17a',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    margin: 0,
                  }}>
                    {activePerson?.name}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#a78bba',
                    margin: 0,
                    marginTop: '4px',
                  }}>
                    별빛 아래 나누는 대화
                  </p>
                </div>

                {/* 메시지들 */}
                <div style={{ padding: '8px 24px 20px' }}>
                  {messagesToCapture.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '16px',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                      }}
                    >
                      <p style={{
                        fontSize: '15px',
                        lineHeight: '1.8',
                        color: msg.role === 'user' ? '#ffc17a' : '#e8dff0',
                        wordBreak: 'keep-all',
                        margin: 0,
                      }}>
                        {msg.content}
                      </p>
                      <span style={{
                        fontSize: '11px',
                        color: 'rgba(168, 139, 186, 0.5)',
                        display: 'block',
                        marginTop: '4px',
                      }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 밤하늘 푸터 */}
              <div style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(168, 139, 186, 0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
              }}>
                <table style={{ borderCollapse: 'collapse' }}><tbody><tr>
                  <td style={{ verticalAlign: 'middle', paddingRight: '12px' }}>
                    <img src="/favicon.png" alt="DearX" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '14px', color: '#ffc17a', fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}>그리움을 만나다</span>
                    <span style={{ fontSize: '11px', color: '#a78bba', display: 'block', lineHeight: 1.2 }}>DearX</span>

                  </td>
                </tr></tbody></table>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🌙</span>
                  <div style={{ background: 'rgba(255,255,255,0.9)', padding: '4px', borderRadius: '8px' }}>
                    <QRCodeSVG value="https://dearx.io" size={48} />
                  </div>
                </div>
              </div>
            </>
          )}


        </div>
      </div>

    </div>
  );
});

export default ChatInterface;

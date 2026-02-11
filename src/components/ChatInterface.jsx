import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Send, Clock, X, Home, Share2, Download, Camera, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';

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
    t,
  } = useApp();

  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [captureSelectMode, setCaptureSelectMode] = useState(false);
  const [captureRange, setCaptureRange] = useState({ start: null, end: null });
  const captureRef = useRef(null);
  const messagesEndRef = useRef(null);

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

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#1a1a2e',
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
  }, [messagesToCapture.length]);

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
          title: 'DearX - 그리움을 만나다',
          text: '소중한 대화를 공유합니다',
          files: [file],
        });
      } else {
        // 공유 API 지원 안 하면 다운로드
        handleDownload();
      }
    } catch (error) {
      console.error('Share failed:', error);
      handleDownload();
    }
  }, [capturedImage, handleDownload]);

  if (!activePerson) return null;

  return (
    <div className="fixed inset-0 bg-dark z-[100] flex flex-col">
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
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-8"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(255, 140, 105, 0.04) 0%, transparent 50%)',
        }}
      >
        <div className="max-w-[900px] mx-auto">
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
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-bubble mb-8 flex ${captureSelectMode ? 'cursor-pointer' : ''}`}
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animationDelay: `${i * 0.1}s`,
                opacity: 0,
                animationFillMode: 'forwards',
              }}
              onClick={() => handleMessageSelect(i)}
            >
              <div
                className={`max-w-[70%] p-6 transition-all ${
                  msg.role === 'user'
                    ? 'rounded-3xl rounded-br-sm bg-gradient-to-br from-coral to-coral-dark shadow-lg shadow-coral/30'
                    : 'rounded-3xl rounded-bl-sm bg-dark-card border border-coral/30 shadow-lg shadow-black/30'
                } ${captureSelectMode && isMessageInRange(i) ? 'ring-2 ring-gold ring-offset-2 ring-offset-dark' : ''}`}
              >
                {/* 이미지가 있으면 표시 */}
                {msg.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={msg.imageUrl}
                      alt="Generated"
                      className="w-full max-w-[300px] rounded-2xl border border-coral/20"
                      loading="lazy"
                    />
                  </div>
                )}
                <p
                  className={`m-0 text-lg leading-relaxed ${
                    msg.role === 'user' ? 'text-white' : 'text-cream'
                  }`}
                >
                  {msg.content}
                </p>
                <div
                  className={`mt-3 text-xs flex items-center gap-2 ${
                    msg.role === 'user' ? 'text-white/60' : 'text-coral/80'
                  }`}
                >
                  <Clock size={12} />
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

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
      <div className="p-8 border-t border-coral/20 bg-gradient-to-t from-dark/95 to-dark/80">
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
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              onFocus={() => setShowPlusMenu(false)}
              placeholder={t.sendMessage}
              className="flex-1 px-6 py-4 text-lg bg-dark-card border border-coral/30 rounded-full text-cream outline-none focus:border-coral/60 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`p-4 w-12 h-12 rounded-full border-none flex items-center justify-center transition-all ${
                input.trim()
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

      {/* Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-[500px] bg-dark-card rounded-3xl border border-coral/20 overflow-hidden my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-coral/20">
              <h3 className="text-lg font-display font-bold text-coral">
                {t.captureChat || '대화 캡처'}
              </h3>
              <button
                onClick={() => { setShowCaptureModal(false); setCapturedImage(null); setCaptureRange({ start: null, end: null }); }}
                className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-coral/60 hover:text-coral transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Capture Preview */}
            <div className="p-4">
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

            {/* Action Buttons */}
            {capturedImage && (
              <div className="p-4 border-t border-coral/20 flex gap-3">
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

      {/* 캡처용 숨겨진 영역 - 항상 렌더링 */}
      <div className="absolute left-[-9999px] top-0">
        <div ref={captureRef} className="w-[420px] bg-gradient-to-b from-[#1a1a2e] to-[#16162a]">
          {/* 대화 헤더 */}
          <div className="px-6 py-5 bg-gradient-to-r from-coral/20 to-gold/10 border-b border-coral/30">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full border-2 border-coral/50 shadow-lg shadow-coral/20 flex-shrink-0"
                style={{
                  background: (activePerson?.currentPhoto || activePerson?.photo)
                    ? `url(${activePerson.currentPhoto || activePerson.photo}) center/cover`
                    : 'linear-gradient(135deg, rgba(255, 140, 105, 0.4) 0%, rgba(255, 193, 122, 0.4) 100%)',
                }}
              />
              <div>
                <p className="text-coral font-display font-bold text-xl">{activePerson?.name}</p>
                <p className="text-cream/50 text-sm mt-1" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  그리운 {activePerson?.name} · {activePerson?.targetAge}{t.ageUnit}
                </p>
              </div>
            </div>
          </div>

          {/* 메시지들 */}
          <div className="px-6 py-5">
            <div className="space-y-5">
              {messagesToCapture.map((msg, i) => (
                <div
                  key={i}
                  className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <p
                    className={`text-[15px] leading-relaxed ${
                      msg.role === 'user' ? 'text-coral' : 'text-cream'
                    }`}
                    style={{ wordBreak: 'keep-all' }}
                  >
                    {msg.content}
                  </p>
                  <span className="text-xs text-cream/30 mt-1 inline-block">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 브랜딩 푸터 */}
          <div className="px-6 py-4 bg-[#12121f] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/favicon.png" alt="DearX" className="w-12 h-12 object-contain" />
              <div style={{ marginTop: '-4px' }}>
                <p className="text-coral font-display font-bold text-lg leading-tight">그리움을 만나다</p>
                <p className="text-cream/60 text-sm leading-tight">DearX</p>
              </div>
            </div>
            <div className="bg-white p-1.5 rounded-xl shadow-lg">
              <QRCodeSVG value="https://dearx.io" size={56} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
});

export default ChatInterface;

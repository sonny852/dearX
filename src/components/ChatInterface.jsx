import React, { memo, useRef, useEffect } from 'react';
import { Send, Clock, X, Home } from 'lucide-react';
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

  const handleGoHome = () => {
    handleBackFromChat();
    setShowForm(false);
  };

  const remainingFreeMessages = FREE_MESSAGE_LIMIT - messageCount;

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

          <button
            onClick={authUser ? handleBackFromChat : handleGoHome}
            className="px-3 py-2 bg-coral/10 border border-coral/30 rounded-xl text-coral cursor-pointer text-xs hover:bg-coral/20 transition-colors"
          >
            {t.back}
          </button>
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
          {messages.map((msg, i) => (
            <div
              key={i}
              className="message-bubble mb-8 flex"
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animationDelay: `${i * 0.1}s`,
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              <div
                className={`max-w-[70%] p-6 ${
                  msg.role === 'user'
                    ? 'rounded-3xl rounded-br-sm bg-gradient-to-br from-coral to-coral-dark shadow-lg shadow-coral/30'
                    : 'rounded-3xl rounded-bl-sm bg-dark-card border border-coral/30 shadow-lg shadow-black/30'
                }`}
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

      {/* Input */}
      <div className="p-8 border-t border-coral/20 bg-gradient-to-t from-dark/95 to-dark/80">
        <div className="max-w-[900px] mx-auto">
          {/* Free message counter for non-premium users */}
          {!authUser?.isPremium && remainingFreeMessages > 0 && (
            <div className="text-center mb-3">
              <span className="text-cream/50 text-xs">
                {(t.freeMessagesRemaining || '무료 대화 {{count}}회 남음').replace('{{count}}', remainingFreeMessages)}
              </span>
            </div>
          )}
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={t.sendMessage}
              className="flex-1 px-6 py-4 text-lg bg-dark-card border border-coral/30 rounded-full text-cream outline-none focus:border-coral/60 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`p-4 w-14 h-14 rounded-full border-none flex items-center justify-center transition-all ${
                input.trim()
                  ? 'bg-gradient-to-br from-coral to-coral-dark cursor-pointer shadow-lg shadow-coral/40'
                  : 'bg-coral/20 cursor-not-allowed'
              }`}
            >
              <Send size={20} color="#ffffff" />
            </button>
          </div>
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
                onClick={() => { handleLogin('kakao'); setShowLoginRequired(false); }}
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default ChatInterface;

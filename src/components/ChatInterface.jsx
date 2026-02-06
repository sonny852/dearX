import React, { memo, useRef, useEffect } from 'react';
import { Send, Clock, Users } from 'lucide-react';
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
    setShowPeopleManager,
    t,
  } = useApp();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activePerson) return null;

  return (
    <div className="fixed inset-0 bg-dark z-[100] flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-8 border-b border-coral/20 bg-gradient-to-b from-dark/95 to-dark/80">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="w-10 h-10 sm:w-[50px] sm:h-[50px] rounded-full border-2 border-coral/30 flex-shrink-0"
              style={{
                background: (activePerson.currentPhoto || activePerson.photo)
                  ? `url(${activePerson.currentPhoto || activePerson.photo}) center/cover`
                  : 'linear-gradient(135deg, rgba(255, 140, 105, 0.3) 0%, rgba(255, 193, 122, 0.3) 100%)',
              }}
            />
            <div className="min-w-0">
              <h2 className="m-0 text-lg sm:text-xl font-display font-bold text-coral truncate">
                {activePerson.name}
              </h2>
              <p className="m-0 text-xs sm:text-sm text-cream/50">
                {activePerson.targetAge}세 · {activePerson.timeDirection === 'past' ? t.past : t.future}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
            {activePerson.relationship === 'self' && (
              <button
                onClick={() => setShowPeopleManager(true)}
                className="px-3 py-2 bg-coral/15 border border-coral/30 rounded-xl text-coral cursor-pointer text-xs flex items-center gap-1.5 hover:bg-coral/25 transition-colors whitespace-nowrap"
              >
                <Users size={14} />
                <span className="hidden xs:inline">{t.addMorePeople}</span>
                <span className="xs:hidden">대화상대 추가</span>
              </button>
            )}
            <button
              onClick={handleBackFromChat}
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
        <div className="max-w-[900px] mx-auto flex gap-4 items-center">
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
  );
});

export default ChatInterface;

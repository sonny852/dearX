import React, { useState, useEffect, memo } from 'react';
import { useApp } from '../context/AppContext';

const SampleConversation = memo(function SampleConversation({ onComplete }) {
  const { t } = useApp();
  const [visibleMessages, setVisibleMessages] = useState(0);

  const messages = [
    { role: 'assistant', text: '우리 아들 오랜만이야 잘 지냈어?' },
    { role: 'user', text: '엄마 보고 싶었어' },
    { role: 'assistant', text: '나도 보고 싶었어. 밥은 먹었니?' },
    { role: 'user', text: '웅 엄마가 끓여준 된장찌개 먹고 싶다' },
    { role: 'assistant', text: '다음에 또 해줄게 우리 아들 사랑해 ❤️' },
  ];

  // 메시지 순차적으로 표시
  useEffect(() => {
    if (visibleMessages < messages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (visibleMessages === messages.length && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, messages.length, onComplete]);

  return (
    <div className="w-full h-full flex flex-col px-4 py-6 pb-20">
      <p className="text-center text-cream/40 text-sm mb-3 flex-shrink-0">{t.sampleConversationTitle}</p>

      {/* 채팅창 컨테이너 */}
      <div className="flex-1 bg-dark-card/80 backdrop-blur-xl rounded-3xl border border-coral/20 overflow-hidden shadow-2xl flex flex-col max-h-[75vh]">
        {/* 헤더 - 프로필 */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-coral/40 to-gold/40 flex items-center justify-center text-xl">
            👩
          </div>
          <div>
            <p className="text-cream font-medium">엄마</p>
            <p className="text-cream/40 text-xs">1985년의 엄마</p>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 px-4 py-4 flex flex-col justify-end overflow-hidden">
          <div className="space-y-3">
            {messages.slice(0, visibleMessages).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                style={{
                  animation: 'msgIn 0.4s ease-out forwards',
                }}
              >
                {/* 상대방 프로필 (첫 메시지나 연속되지 않을 때만) */}
                {msg.role === 'assistant' && (i === 0 || messages[i-1]?.role !== 'assistant') && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral/30 to-gold/30 flex items-center justify-center text-sm flex-shrink-0">
                    👩
                  </div>
                )}
                {msg.role === 'assistant' && i > 0 && messages[i-1]?.role === 'assistant' && (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div
                  className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-coral text-white rounded-2xl rounded-br-md'
                      : 'bg-white/10 text-cream rounded-2xl rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 입력창 (비활성) */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-cream/30 text-sm">
              메시지를 입력하세요...
            </div>
            <div className="w-9 h-9 rounded-full bg-coral/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral/50">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes msgIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

export default SampleConversation;

import React, { memo, useState } from 'react';
import { User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthBar = memo(function AuthBar() {
  const { authUser, authLoading, handleLogin, handleLogout, showChat, t } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 채팅 화면에서는 AuthBar 숨김
  if (showChat) return null;

  return (
    <>
      {/* Top-right bar */}
      <div className="fixed top-4 right-4 z-[2000] flex items-center gap-2">
        {authUser ? (
          <div className="flex items-center gap-1.5 bg-dark/80 backdrop-blur-xl px-1.5 py-1 rounded-full border border-coral/20">
            <button
              onClick={() => alert(t.myPage)}
              className="w-8 h-8 rounded-full border border-coral/25 flex items-center justify-center text-coral cursor-pointer transition-colors hover:bg-coral/20"
              style={{ background: 'rgba(255, 140, 105, 0.12)' }}
            >
              <User size={14} />
            </button>
            <div className="px-2.5 h-8 flex items-center rounded-full bg-coral/10 border border-coral/20 text-cream/85 text-[11px] font-semibold">
              {authUser.name}
            </div>
            <button
              onClick={handleLogout}
              className="h-8 px-2.5 rounded-full border border-coral/20 bg-transparent text-cream/65 cursor-pointer text-[11px] font-semibold hover:text-cream hover:border-coral/40 transition-colors"
            >
              {t.logout}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-3 py-1.5 rounded-full bg-dark/80 backdrop-blur-xl border border-coral/20 text-cream/85 text-[11px] font-semibold cursor-pointer hover:bg-dark hover:border-coral/40 transition-all"
          >
            {t.login}
          </button>
        )}
      </div>

      {/* Login Modal Overlay */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Card */}
          <div className="relative w-full max-w-[420px] bg-dark-card border border-coral/15 rounded-t-3xl sm:rounded-3xl p-10 pt-12 animate-slide-up">
            {/* Close button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-cream/50 hover:text-cream hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <h2
              className="text-4xl font-display font-black text-center mb-2 bg-gradient-to-br from-white via-coral to-gold bg-clip-text"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              DearX
            </h2>

            {/* Subtitle */}
            <p className="text-center text-cream/50 text-sm mb-10">
              {t.loginSubtitle}
            </p>

            {/* Login Buttons */}
            <div className="flex flex-col gap-3">
              {/* Kakao */}
              <button
                onClick={() => { handleLogin('kakao'); setShowLoginModal(false); }}
                disabled={authLoading}
                className="w-full h-[54px] rounded-2xl bg-[#FEE500] text-[#191919] text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  alt=""
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
                  className="w-5 h-5"
                />
                {t.continueWithKakao}
              </button>

              {/* Google */}
              <button
                onClick={() => { handleLogin('google'); setShowLoginModal(false); }}
                disabled={authLoading}
                className="w-full h-[54px] rounded-2xl bg-white text-[#333] text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
});

export default AuthBar;

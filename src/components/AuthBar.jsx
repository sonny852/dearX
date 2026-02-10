import React, { memo, useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth } from '../lib/supabase';

const AuthBar = memo(function AuthBar() {
  const { authUser, authLoading, handleLogout, showChat, showPersonForm, setShowMyPage, t } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState(null);

  // 모달 열리면 Google OAuth URL 미리 생성 (PKCE code_verifier 포함)
  // 모바일 Safari: signInWithOAuth 내부의 async SHA-256 때문에 user gesture 유실 → 네비게이션 차단
  // 미리 URL을 만들어두면 클릭 시 동기적으로 window.location.href 가능
  useEffect(() => {
    if (showLoginModal) {
      auth.getAuthUrl('google').then(url => {
        if (url) setGoogleAuthUrl(url);
      });
    }
    return () => setGoogleAuthUrl(null);
  }, [showLoginModal]);

  // 채팅 화면이나 인물 수정 화면에서는 AuthBar 숨김
  if (showChat || showPersonForm) return null;

  // 로딩 중에는 아무것도 표시하지 않음 (깜빡임 방지)
  if (authLoading) return null;

  const handleGoogleLogin = () => {
    if (googleAuthUrl) {
      // 미리 생성된 URL로 동기 리디렉트 (Safari/Chrome 모바일 모두 대응)
      window.location.href = googleAuthUrl;
    }
    // URL 아직 준비 안 됐으면 무시 (보통 수십 ms 내에 준비됨)
  };

  return (
    <>
      {/* Top-right bar */}
      <div className="fixed top-4 right-4 z-[2000] flex items-center gap-2">
        {authUser ? (
          <div className="flex items-center gap-1.5 bg-dark/80 backdrop-blur-xl px-1.5 py-1 rounded-full border border-coral/20">
            <button
              onClick={() => setShowMyPage(true)}
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
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading || !googleAuthUrl}
                className="w-full h-[54px] rounded-2xl bg-white text-[#333] text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  alt=""
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-5 h-5"
                />
                {t.continueWithGoogle}
              </button>

              {/* Kakao - 연동 예정 */}
              <button
                onClick={() => alert(t.comingSoonMessage || '연동 예정입니다')}
                className="w-full h-[54px] rounded-2xl bg-[#FEE500] text-[#191919] text-[15px] font-semibold flex items-center justify-center gap-3 cursor-pointer border-none hover:brightness-95 transition-all"
              >
                <img
                  alt=""
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
                  className="w-5 h-5"
                />
                {t.continueWithKakao}
              </button>

              {/* Naver - 연동 예정 */}
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
    </>
  );
});

export default AuthBar;

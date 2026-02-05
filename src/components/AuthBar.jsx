import React, { memo } from 'react';
import { User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthBar = memo(function AuthBar() {
  const { authUser, authLoading, handleLogin, handleLogout, t } = useApp();

  return (
    <div className="fixed top-8 right-8 z-[2000] flex items-center gap-2 bg-dark/80 backdrop-blur-xl px-2.5 py-2 rounded-full border border-coral/20">
      {authUser ? (
        <>
          {/* My Page Button */}
          <button
            onClick={() => alert(t.myPage)}
            className="w-[42px] h-[42px] rounded-full border border-coral/25 flex items-center justify-center text-coral cursor-pointer transition-colors hover:bg-coral/20"
            style={{ background: 'rgba(255, 140, 105, 0.12)' }}
          >
            <User size={18} />
          </button>

          {/* User Info & Logout */}
          <div className="px-3 h-[42px] flex items-center rounded-full bg-coral/10 border border-coral/20 text-cream/85 text-sm font-semibold">
            {authUser.name}
          </div>
          <button
            onClick={handleLogout}
            className="h-[42px] px-3 rounded-full border border-coral/20 bg-transparent text-cream/65 cursor-pointer font-serif text-sm hover:text-cream hover:border-coral/40 transition-colors"
          >
            {t.logout}
          </button>
        </>
      ) : (
        <>
          {/* Kakao Login */}
          <button
            onClick={() => handleLogin('kakao')}
            disabled={authLoading}
            className="w-[42px] h-[42px] rounded-full border border-coral/25 bg-white/5 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-colors hover:bg-white/10"
          >
            <img
              alt="Kakao"
              src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
              className="w-[18px] h-[18px]"
            />
          </button>

          {/* Google Login */}
          <button
            onClick={() => handleLogin('google')}
            disabled={authLoading}
            className="w-[42px] h-[42px] rounded-full border border-coral/25 bg-white/5 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-colors hover:bg-white/10"
          >
            <img
              alt="Google"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-[18px] h-[18px]"
            />
          </button>
        </>
      )}
    </div>
  );
});

export default AuthBar;

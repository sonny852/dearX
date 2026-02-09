import React, { memo, useState } from 'react';
import { X, User, CreditCard, Edit2, Camera, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MyPage = memo(function MyPage() {
  const {
    showMyPage,
    setShowMyPage,
    setShowPaymentPopup,
    authUser,
    handleUpdateProfile,
    t,
  } = useApp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // profile, subscription

  if (!showMyPage || !authUser) return null;

  const handleStartEditName = () => {
    setNewName(authUser.name);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (newName.trim() && newName !== authUser.name) {
      await handleUpdateProfile({ name: newName.trim() });
    }
    setIsEditingName(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: 실제 이미지 업로드 구현
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateProfile({ photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // 구독 상태 계산
  const getSubscriptionStatus = () => {
    if (authUser.isPremium) {
      const expiresAt = authUser.premiumExpiresAt ? new Date(authUser.premiumExpiresAt) : null;
      if (expiresAt) {
        const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        return {
          status: 'active',
          label: t.premiumActive || '프리미엄 이용중',
          expires: expiresAt.toLocaleDateString('ko-KR'),
          daysLeft,
        };
      }
      return { status: 'active', label: t.premiumActive || '프리미엄 이용중' };
    }
    return { status: 'free', label: t.freePlan || '무료 플랜' };
  };

  const subscription = getSubscriptionStatus();

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-[480px] max-h-[85vh] bg-dark-card backdrop-blur-2xl rounded-3xl border border-coral/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-coral/20">
          <h2 className="text-xl font-display font-bold text-coral">
            {t.myPage || '마이페이지'}
          </h2>
          <button
            onClick={() => setShowMyPage(false)}
            className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-coral/60 hover:text-coral transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-coral/20">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-coral border-b-2 border-coral'
                : 'text-cream/50 hover:text-cream/70'
            }`}
          >
            {t.profileTab || '내 정보'}
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'subscription'
                ? 'text-coral border-b-2 border-coral'
                : 'text-cream/50 hover:text-cream/70'
            }`}
          >
            {t.subscriptionTab || '구독 관리'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full border-3 border-coral/30 flex items-center justify-center overflow-hidden"
                    style={{
                      background: authUser.photo
                        ? `url(${authUser.photo}) center/cover`
                        : 'linear-gradient(135deg, rgba(255, 140, 105, 0.3) 0%, rgba(255, 193, 122, 0.3) 100%)',
                    }}
                  >
                    {!authUser.photo && <User size={40} className="text-coral/50" />}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-coral flex items-center justify-center cursor-pointer hover:bg-coral-dark transition-colors">
                    <Camera size={16} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div className="bg-dark/50 rounded-2xl p-4">
                <label className="block text-cream/50 text-xs mb-2">
                  {t.name || '이름'}
                </label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 bg-transparent border-b border-coral/30 text-cream text-lg outline-none focus:border-coral py-1"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center text-coral hover:bg-coral/30 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-cream/50 hover:text-cream transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-cream text-lg">{authUser.name}</span>
                    <button
                      onClick={handleStartEditName}
                      className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-coral/60 hover:text-coral transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="bg-dark/50 rounded-2xl p-4">
                <label className="block text-cream/50 text-xs mb-2">
                  {t.email || '이메일'}
                </label>
                <span className="text-cream/70">{authUser.email}</span>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-dark/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-coral/20 flex items-center justify-center">
                    <CreditCard size={24} className="text-coral" />
                  </div>
                  <div>
                    <p className="text-cream font-medium">{subscription.label}</p>
                    {subscription.status === 'active' && subscription.expires && (
                      <p className="text-cream/50 text-sm">
                        {subscription.daysLeft}일 남음 ({subscription.expires}까지)
                      </p>
                    )}
                  </div>
                </div>

                {subscription.status === 'free' ? (
                  <button
                    onClick={() => {
                      setShowMyPage(false);
                      setShowPaymentPopup(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-coral to-gold rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    {t.upgradeToPremium || '프리미엄 업그레이드'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowMyPage(false);
                        setShowPaymentPopup(true);
                      }}
                      className="w-full py-3 bg-coral/20 border border-coral/30 rounded-xl text-coral font-medium hover:bg-coral/30 transition-colors"
                    >
                      {t.extendSubscription || '구독 연장하기'}
                    </button>
                    <button
                      className="w-full py-2 text-cream/40 text-sm hover:text-cream/60 transition-colors"
                    >
                      {t.cancelSubscription || '구독 해지'}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="bg-dark/50 rounded-2xl p-5">
                <h3 className="text-cream font-medium mb-4">
                  {t.paymentHistory || '결제 내역'}
                </h3>

                {/* TODO: 실제 결제 내역 연동 */}
                <div className="text-center py-8 text-cream/40 text-sm">
                  {t.noPaymentHistory || '결제 내역이 없습니다'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MyPage;

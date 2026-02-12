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

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('profile'); // profile, subscription

  if (!showMyPage || !authUser) return null;

  const handleStartEdit = () => {
    // 기존 MBTI 문자열에서 개별 값 복원
    const mbti = authUser.mbti || '';
    const mbtiParts = mbti.split(', ').filter(Boolean);
    const mbtiEI = mbtiParts.find(p => p === '분위기 메이커' || p === '조용히 지켜보는 편') || '';
    const mbtiSN = mbtiParts.find(p => p === '어제 뭐 먹었는지도 기억함' || p === '갑자기 엉뚱한 말 나옴') || '';
    const mbtiTF = mbtiParts.find(p => p === '해결책부터 알려줌' || p === '일단 공감부터') || '';
    const mbtiJP = mbtiParts.find(p => p === '미리미리 준비' || p === '그때그때 즉흥으로') || '';

    setEditForm({
      name: authUser.name || '',
      gender: authUser.gender || '',
      birthYear: authUser.birthYear || '',
      mbtiEI,
      mbtiSN,
      mbtiTF,
      mbtiJP,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    const updates = {};
    if (editForm.name.trim() && editForm.name !== authUser.name) updates.name = editForm.name.trim();
    if (editForm.gender !== (authUser.gender || '')) updates.gender = editForm.gender || null;
    if (String(editForm.birthYear) !== String(authUser.birthYear || '')) updates.birthYear = editForm.birthYear ? parseInt(editForm.birthYear) : null;

    // MBTI 조합
    const mbtiTraits = [editForm.mbtiEI, editForm.mbtiSN, editForm.mbtiTF, editForm.mbtiJP].filter(Boolean).join(', ');
    if (mbtiTraits !== (authUser.mbti || '')) updates.mbti = mbtiTraits || null;

    if (Object.keys(updates).length > 0) {
      await handleUpdateProfile(updates);
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 800;
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const resized = canvas.toDataURL('image/jpeg', 0.8);
        handleUpdateProfile({ photo: resized });
      };
      img.src = URL.createObjectURL(file);
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

              {isEditing ? (
                <>
                  {/* Name - 수정 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.name || '이름'}
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-transparent border-b border-coral/30 text-cream text-lg outline-none focus:border-coral py-1"
                      autoFocus
                    />
                  </div>

                  {/* Gender - 수정 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.gender || '성별'}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: 'male', label: t.male || '남성' },
                        { value: 'female', label: t.female || '여성' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setEditForm(prev => ({ ...prev, gender: prev.gender === opt.value ? '' : opt.value }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            editForm.gender === opt.value
                              ? 'bg-coral text-white'
                              : 'bg-white/5 text-cream/70 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Birth Year - 수정 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.birthYear || '출생연도'}
                    </label>
                    <input
                      type="number"
                      value={editForm.birthYear}
                      onChange={(e) => setEditForm(prev => ({ ...prev, birthYear: e.target.value }))}
                      placeholder="예: 1990"
                      className="w-full bg-transparent border-b border-coral/30 text-cream text-lg outline-none focus:border-coral py-1"
                    />
                  </div>

                  {/* MBTI 성격 - 수정 (선택) */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-3">
                      나의 성격 (선택)
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'mbtiEI', label: '사람들과 있을 때', choices: [
                          { value: '분위기 메이커', emoji: '🎉' },
                          { value: '조용히 지켜보는 편', emoji: '☕' },
                        ]},
                        { key: 'mbtiSN', label: '이야기 스타일', choices: [
                          { value: '어제 뭐 먹었는지도 기억함', emoji: '📋' },
                          { value: '갑자기 엉뚱한 말 나옴', emoji: '🌀' },
                        ]},
                        { key: 'mbtiTF', label: '고민 상담하면', choices: [
                          { value: '해결책부터 알려줌', emoji: '🔧' },
                          { value: '일단 공감부터', emoji: '🤗' },
                        ]},
                        { key: 'mbtiJP', label: '약속/계획', choices: [
                          { value: '미리미리 준비', emoji: '📅' },
                          { value: '그때그때 즉흥으로', emoji: '🎲' },
                        ]},
                      ].map((item) => (
                        <div key={item.key}>
                          <p className="text-cream/40 text-xs mb-1.5">{item.label}</p>
                          <div className="flex gap-2">
                            {item.choices.map((choice) => (
                              <button
                                key={choice.value}
                                onClick={() => setEditForm(prev => ({ ...prev, [item.key]: prev[item.key] === choice.value ? '' : choice.value }))}
                                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                  editForm[item.key] === choice.value
                                    ? 'bg-coral text-white'
                                    : 'bg-white/5 text-cream/70 hover:bg-white/10'
                                }`}
                              >
                                <span>{choice.emoji}</span>
                                <span>{choice.value}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email - 읽기 전용 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.email || '이메일'}
                    </label>
                    <span className="text-cream/40">{authUser.email}</span>
                  </div>

                  {/* 저장 / 취소 버튼 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 rounded-xl border border-coral/30 text-cream/70 text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                      {t.cancel || '취소'}
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-3 rounded-xl bg-coral text-white text-sm font-medium hover:bg-coral-dark transition-colors"
                    >
                      {t.save || '저장'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Name - 보기 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.name || '이름'}
                    </label>
                    <span className="text-cream text-lg">{authUser.name}</span>
                  </div>

                  {/* Gender - 보기 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.gender || '성별'}
                    </label>
                    <span className="text-cream/70">
                      {authUser.gender === 'male' ? (t.male || '남성') : authUser.gender === 'female' ? (t.female || '여성') : (t.notSet || '미설정')}
                    </span>
                  </div>

                  {/* Birth Year - 보기 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.birthYear || '출생연도'}
                    </label>
                    <span className="text-cream/70">
                      {authUser.birthYear ? `${authUser.birthYear}년` : (t.notSet || '미설정')}
                    </span>
                  </div>

                  {/* MBTI - 보기 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      나의 성격
                    </label>
                    <span className="text-cream/70">
                      {authUser.mbti || (t.notSet || '미설정')}
                    </span>
                  </div>

                  {/* Email - 보기 */}
                  <div className="bg-dark/50 rounded-2xl p-4">
                    <label className="block text-cream/50 text-xs mb-2">
                      {t.email || '이메일'}
                    </label>
                    <span className="text-cream/70">{authUser.email}</span>
                  </div>

                  {/* 수정 버튼 */}
                  <button
                    onClick={handleStartEdit}
                    className="w-full py-3 rounded-xl border border-coral/30 text-coral text-sm font-medium hover:bg-coral/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    {t.editProfile || '프로필 수정'}
                  </button>
                </>
              )}
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

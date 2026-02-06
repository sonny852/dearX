import React, { memo } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MyInfoForm = memo(function MyInfoForm() {
  const { myInfo, setMyInfo, handleFileUpload, handleMyFormSubmit, t } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 pt-16 bg-dark z-[2]">
      <div className="max-w-[600px] w-full bg-dark-card backdrop-blur-2xl p-12 rounded-3xl border border-coral/20">
        <h2 className="text-[clamp(1.4rem,3.5vw,2rem)] font-display font-bold mb-4 text-center bg-gradient-to-br from-coral to-gold bg-clip-text"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {t.formTitle}
        </h2>
        <p className="text-center text-cream/60 mb-10">{t.careMessage}</p>

        {/* Name */}
        <div className="mb-6">
          <label className="block mb-2 text-coral text-sm font-semibold">
            {t.name} *
          </label>
          <input
            type="text"
            value={myInfo.name}
            onChange={(e) => setMyInfo((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t.namePlaceholder}
            className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
          />
        </div>

        {/* Time Direction */}
        <div className="mb-6">
          <label className="block mb-2 text-coral text-sm font-semibold">
            {t.timeDirection} *
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setMyInfo((prev) => ({ ...prev, timeDirection: 'past' }))}
              className={`flex-1 p-4 border-none rounded-2xl text-base font-semibold cursor-pointer transition-all ${
                myInfo.timeDirection === 'past'
                  ? 'bg-gradient-to-br from-coral to-coral-dark text-white'
                  : 'bg-coral/10 text-coral hover:bg-coral/20'
              }`}
            >
              👶 {t.past}
            </button>
            <button
              type="button"
              onClick={() => setMyInfo((prev) => ({ ...prev, timeDirection: 'future' }))}
              className={`flex-1 p-4 border-none rounded-2xl text-base font-semibold cursor-pointer transition-all ${
                myInfo.timeDirection === 'future'
                  ? 'bg-gradient-to-br from-brown to-brown-dark text-white'
                  : 'bg-brown/10 text-brown hover:bg-brown/20'
              }`}
            >
              👵 {t.future}
            </button>
          </div>
        </div>

        {/* Current Age & Target Age */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 text-coral text-sm font-semibold">
              현재 나이 *
            </label>
            <input
              type="number"
              value={myInfo.currentAge}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, currentAge: e.target.value }))}
              placeholder="예: 35"
              className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-coral text-sm font-semibold">
              {t.targetAge} *
            </label>
            <input
              type="number"
              value={myInfo.targetAge}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, targetAge: e.target.value }))}
              placeholder={t.agePlaceholder}
              className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
            />
          </div>
        </div>

        {/* Gender */}
        <div className="mb-6">
          <label className="block mb-2 text-coral text-sm font-semibold">
            {t.gender} *
          </label>
          <select
            value={myInfo.gender}
            onChange={(e) => setMyInfo((prev) => ({ ...prev, gender: e.target.value }))}
            className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
          >
            <option value="">{t.genderSelect}</option>
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
            <option value="other">{t.other_gender}</option>
          </select>
        </div>

        {/* Current Photo (Required) */}
        <div className="mb-6">
          <label className="block mb-2 text-coral text-sm font-semibold">
            {t.currentPhoto} *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'myCurrentPhoto')}
            className="hidden"
            id="myCurrentPhoto"
          />
          <label
            htmlFor="myCurrentPhoto"
            className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
              myInfo.currentPhoto
                ? 'border-coral/50'
                : 'bg-coral/10 border-coral/30 text-coral hover:bg-coral/20'
            }`}
            style={{
              minHeight: myInfo.currentPhoto ? '150px' : 'auto',
              backgroundImage: myInfo.currentPhoto ? `url(${myInfo.currentPhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!myInfo.currentPhoto && (
              <>
                <Upload size={20} />
                <span>{t.uploadCurrentPhoto}</span>
              </>
            )}
          </label>
        </div>

        {/* Past Photo (Optional, only for past timeDirection) */}
        {myInfo.timeDirection === 'past' && (
          <div className="mb-8">
            <label className="block mb-2 text-coral/70 text-sm font-semibold">
              {t.pastPhoto}
            </label>
            <p className="text-xs text-cream/50 mb-2">{t.pastPhotoHint}</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'myPastPhoto')}
              className="hidden"
              id="myPastPhoto"
            />
            <label
              htmlFor="myPastPhoto"
              className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                myInfo.pastPhoto
                  ? 'border-gold/50'
                  : 'bg-gold/5 border-gold/20 text-gold/70 hover:bg-gold/10'
              }`}
              style={{
                minHeight: myInfo.pastPhoto ? '150px' : 'auto',
                backgroundImage: myInfo.pastPhoto ? `url(${myInfo.pastPhoto})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!myInfo.pastPhoto && (
                <>
                  <Upload size={20} />
                  <span>{t.uploadPastPhoto}</span>
                </>
              )}
            </label>
          </div>
        )}

        {/* Optional Fields Section */}
        <div className="mb-6 pt-4 border-t border-coral/10">
          <p className="text-sm text-cream/50 mb-4">선택 사항 (더 풍부한 대화를 위해)</p>

          {/* Personality */}
          <div className="mb-4">
            <label className="block mb-2 text-coral/70 text-sm">
              그때의 성격
            </label>
            <input
              type="text"
              value={myInfo.personality}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, personality: e.target.value }))}
              placeholder="예: 수줍음 많았음, 호기심 대장, 장난꾸러기"
              className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
            />
          </div>

          {/* Hobbies */}
          <div className="mb-4">
            <label className="block mb-2 text-coral/70 text-sm">
              그때 좋아했던 것
            </label>
            <input
              type="text"
              value={myInfo.hobbies}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, hobbies: e.target.value }))}
              placeholder="예: 공룡, 레고, 만화, 인형놀이"
              className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
            />
          </div>

          {/* Memories */}
          <div className="mb-4">
            <label className="block mb-2 text-coral/70 text-sm">
              기억나는 추억
            </label>
            <input
              type="text"
              value={myInfo.memories}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, memories: e.target.value }))}
              placeholder="예: 할머니랑 시장 가던 것, 아빠랑 낚시"
              className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
            />
          </div>

          {/* Family */}
          <div className="mb-4">
            <label className="block mb-2 text-coral/70 text-sm">
              가족 구성
            </label>
            <input
              type="text"
              value={myInfo.family}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, family: e.target.value }))}
              placeholder="예: 엄마, 아빠, 누나"
              className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
            />
          </div>

          {/* Speech Style */}
          <div className="mb-4">
            <label className="block mb-2 text-coral/70 text-sm">
              말버릇 / 자주 하던 말
            </label>
            <input
              type="text"
              value={myInfo.speechStyle}
              onChange={(e) => setMyInfo((prev) => ({ ...prev, speechStyle: e.target.value }))}
              placeholder="예: 진짜야?, 왜왜왜?, 싫어~"
              className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleMyFormSubmit}
          className="w-full p-5 text-lg font-semibold bg-gradient-to-br from-coral to-gold border-none rounded-2xl text-white cursor-pointer shadow-lg shadow-coral/40 hover:shadow-coral/60 transition-shadow"
        >
          {t.startChat}
        </button>
      </div>
    </div>
  );
});

export default MyInfoForm;

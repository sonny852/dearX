import React, { memo } from 'react';
import { X, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PersonForm = memo(function PersonForm() {
  const {
    showPersonForm,
    setShowPersonForm,
    currentPersonForm,
    setCurrentPersonForm,
    editingPersonIndex,
    handleFileUpload,
    handleSavePerson,
    t,
  } = useApp();

  if (!showPersonForm) return null;


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[600px] my-8 bg-dark-card backdrop-blur-2xl rounded-3xl border border-coral/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-coral/20">
          <h2 className="text-2xl font-display font-bold text-coral m-0">
            {editingPersonIndex !== null ? t.updatePerson : t.addPersonTitle}
          </h2>
          <button
            onClick={() => setShowPersonForm(false)}
            className="w-10 h-10 rounded-full bg-coral/10 border border-coral/30 flex items-center justify-center text-coral cursor-pointer hover:bg-coral/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Relationship */}
          <div className="mb-6">
            <label className="block mb-2 text-coral text-sm font-semibold">
              {t.relationship} *
            </label>
            <input
              type="text"
              value={currentPersonForm.relationship}
              onChange={(e) =>
                setCurrentPersonForm((prev) => ({ ...prev, relationship: e.target.value }))
              }
              placeholder={t.relationshipPlaceholder}
              className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
            />
          </div>

          {/* Name */}
          <div className="mb-6">
            <label className="block mb-2 text-coral text-sm font-semibold">
              {t.name} *
            </label>
            <input
              type="text"
              value={currentPersonForm.name}
              onChange={(e) =>
                setCurrentPersonForm((prev) => ({ ...prev, name: e.target.value }))
              }
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
                onClick={() =>
                  setCurrentPersonForm((prev) => ({ ...prev, timeDirection: 'past' }))
                }
                className={`flex-1 p-4 border-none rounded-2xl text-base font-semibold cursor-pointer transition-all ${
                  currentPersonForm.timeDirection === 'past'
                    ? 'bg-gradient-to-br from-coral to-coral-dark text-white'
                    : 'bg-coral/10 text-coral hover:bg-coral/20'
                }`}
              >
                👶 {t.past}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPersonForm((prev) => ({ ...prev, timeDirection: 'future' }))
                }
                className={`flex-1 p-4 border-none rounded-2xl text-base font-semibold cursor-pointer transition-all ${
                  currentPersonForm.timeDirection === 'future'
                    ? 'bg-gradient-to-br from-brown to-brown-dark text-white'
                    : 'bg-brown/10 text-brown hover:bg-brown/20'
                }`}
              >
                👵 {t.future}
              </button>
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 text-coral text-sm font-semibold">
                {t.targetAge} *
              </label>
              <input
                type="text"
                value={currentPersonForm.targetAge}
                onChange={(e) =>
                  setCurrentPersonForm((prev) => ({ ...prev, targetAge: e.target.value }))
                }
                placeholder={t.agePlaceholder}
                className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
              />
            </div>
            <div>
              <label className="block mb-2 text-coral text-sm font-semibold">
                {t.gender} *
              </label>
              <select
                value={currentPersonForm.gender}
                onChange={(e) =>
                  setCurrentPersonForm((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="w-full p-4 bg-dark/80 border border-coral/30 rounded-2xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
              >
                <option value="">{t.genderSelect}</option>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
                <option value="other">{t.other_gender}</option>
              </select>
            </div>
          </div>

          {/* Photo - Optional, only for past */}
          {currentPersonForm.timeDirection === 'past' && (
            <div className="mb-6">
              <label className="block mb-2 text-coral/70 text-sm font-semibold">
                {t.photoForTime}
              </label>
              <p className="text-cream/50 text-xs mb-3">
                {t.uploadPhotoDesc}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'person')}
                className="hidden"
                id="personPhoto"
              />
              <label
                htmlFor="personPhoto"
                className="flex items-center justify-center gap-2 p-4 bg-coral/10 border-2 border-dashed border-coral/30 rounded-2xl text-coral cursor-pointer hover:bg-coral/20 transition-colors"
                style={{
                  minHeight: currentPersonForm.photo ? '120px' : 'auto',
                  backgroundImage: currentPersonForm.photo
                    ? `url(${currentPersonForm.photo})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!currentPersonForm.photo && (
                  <>
                    <Upload size={20} />
                    <span>{t.uploadPastPhotoRequired}</span>
                  </>
                )}
              </label>
            </div>
          )}

          {/* Character Details Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-coral/80 mb-4">
              {t.characterDetails}
            </h3>

            <div className="space-y-4">
              {/* Personality */}
              <div>
                <label className="block mb-2 text-cream/70 text-sm">
                  {t.personality}
                </label>
                <input
                  type="text"
                  value={currentPersonForm.personality}
                  onChange={(e) =>
                    setCurrentPersonForm((prev) => ({
                      ...prev,
                      personality: e.target.value,
                    }))
                  }
                  placeholder={t.personalityPlaceholder}
                  className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
                />
              </div>

              {/* Speech Style */}
              <div>
                <label className="block mb-2 text-cream/70 text-sm">
                  {t.speechStyle}
                </label>
                <input
                  type="text"
                  value={currentPersonForm.speechStyle}
                  onChange={(e) =>
                    setCurrentPersonForm((prev) => ({
                      ...prev,
                      speechStyle: e.target.value,
                    }))
                  }
                  placeholder={t.speechStylePlaceholder}
                  className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
                />
              </div>

              {/* Hobbies */}
              <div>
                <label className="block mb-2 text-cream/70 text-sm">
                  {t.hobbies}
                </label>
                <input
                  type="text"
                  value={currentPersonForm.hobbies}
                  onChange={(e) =>
                    setCurrentPersonForm((prev) => ({ ...prev, hobbies: e.target.value }))
                  }
                  placeholder={t.hobbiesPlaceholder}
                  className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
                />
              </div>

              {/* Memories */}
              <div>
                <label className="block mb-2 text-cream/70 text-sm">
                  {t.memories}
                </label>
                <textarea
                  value={currentPersonForm.memories}
                  onChange={(e) =>
                    setCurrentPersonForm((prev) => ({ ...prev, memories: e.target.value }))
                  }
                  placeholder={t.memoriesPlaceholder}
                  rows={2}
                  className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors resize-none"
                />
              </div>

              {/* Favorite Words */}
              <div>
                <label className="block mb-2 text-cream/70 text-sm">
                  {t.favoriteWords}
                </label>
                <input
                  type="text"
                  value={currentPersonForm.favoriteWords}
                  onChange={(e) =>
                    setCurrentPersonForm((prev) => ({
                      ...prev,
                      favoriteWords: e.target.value,
                    }))
                  }
                  placeholder={t.favoriteWordsPlaceholder}
                  className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
                />
              </div>

              {/* Habits */}
              <div>
                <label className="block mb-2 text-cream/70 text-sm">
                  {t.habits}
                </label>
                <input
                  type="text"
                  value={currentPersonForm.habits}
                  onChange={(e) =>
                    setCurrentPersonForm((prev) => ({ ...prev, habits: e.target.value }))
                  }
                  placeholder={t.habitsPlaceholder}
                  className="w-full p-3 bg-dark/60 border border-coral/20 rounded-xl text-cream text-sm outline-none focus:border-coral/40 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-coral/20 flex gap-4">
          <button
            onClick={() => setShowPersonForm(false)}
            className="flex-1 p-4 bg-coral/10 border border-coral/30 rounded-2xl text-coral font-semibold cursor-pointer hover:bg-coral/20 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSavePerson}
            className="flex-1 p-4 bg-gradient-to-br from-coral to-gold border-none rounded-2xl text-white font-semibold cursor-pointer shadow-lg shadow-coral/40 hover:shadow-coral/60 transition-shadow"
          >
            {editingPersonIndex !== null ? t.updatePerson : t.savePerson}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PersonForm;

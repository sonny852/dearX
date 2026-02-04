import React, { memo, useState } from 'react';
import { X, Plus, Edit2, Trash2, MessageCircle, Check, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PeopleManager = memo(function PeopleManager() {
  const {
    showPeopleManager,
    setShowPeopleManager,
    additionalPeople,
    handleAddNewPerson,
    handleEditPerson,
    handleDeletePerson,
    handleStartChatWithPerson,
    t,
  } = useApp();

  const [showPricing, setShowPricing] = useState(false);

  if (!showPeopleManager) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-[600px] max-h-[80vh] bg-dark-card backdrop-blur-2xl rounded-3xl border border-coral/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-coral/20">
          <h2 className="text-2xl font-display font-bold text-coral m-0">
            {t.managePeople}
          </h2>
          <button
            onClick={() => setShowPeopleManager(false)}
            className="w-10 h-10 rounded-full bg-coral/10 border border-coral/30 flex items-center justify-center text-coral cursor-pointer hover:bg-coral/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
          {/* Add new person button */}
          <button
            onClick={() => setShowPricing(true)}
            className="w-full p-4 mb-6 flex items-center justify-center gap-3 bg-gradient-to-br from-coral/20 to-gold/20 border-2 border-dashed border-coral/30 rounded-2xl text-coral cursor-pointer hover:bg-coral/30 transition-colors"
          >
            <Plus size={24} />
            <span className="text-lg font-semibold">{t.addNewPerson}</span>
          </button>

          {/* Pricing Section */}
          {showPricing && (
            <div className="mb-6 p-6 bg-dark/80 border border-coral/20 rounded-2xl">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  {t.pricingTitle}
                </h3>
                <p className="text-cream/60 text-sm">{t.pricingSubtitle}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* 하루 */}
                <div className="relative p-4 bg-dark-card border border-coral/20 rounded-xl hover:border-coral/40 transition-colors cursor-pointer group">
                  <div className="text-center">
                    <p className="text-cream/70 text-sm mb-1">{t.priceDay}</p>
                    <p className="text-2xl font-bold text-coral mb-2">{t.priceDayAmount}</p>
                    <p className="text-cream/50 text-xs mb-3">{t.priceDayDesc}</p>
                    <button
                      onClick={() => {
                        setShowPricing(false);
                        handleAddNewPerson();
                      }}
                      className="w-full py-2 bg-coral/20 border border-coral/30 rounded-lg text-coral text-sm font-semibold hover:bg-coral/30 transition-colors"
                    >
                      {t.selectPlan}
                    </button>
                  </div>
                </div>

                {/* 1주 - 인기 */}
                <div className="relative p-4 bg-gradient-to-b from-coral/10 to-dark-card border-2 border-coral/50 rounded-xl cursor-pointer group">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-coral to-gold rounded-full">
                    <span className="text-white text-xs font-bold flex items-center gap-1">
                      <Sparkles size={12} />
                      {t.mostPopular}
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-cream/70 text-sm mb-1">{t.priceWeek}</p>
                    <p className="text-2xl font-bold text-coral mb-2">{t.priceWeekAmount}</p>
                    <p className="text-cream/50 text-xs mb-3">{t.priceWeekDesc}</p>
                    <button
                      onClick={() => {
                        setShowPricing(false);
                        handleAddNewPerson();
                      }}
                      className="w-full py-2 bg-gradient-to-r from-coral to-gold border-none rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {t.selectPlan}
                    </button>
                  </div>
                </div>

                {/* 1달 - 가성비 */}
                <div className="relative p-4 bg-dark-card border border-coral/20 rounded-xl hover:border-coral/40 transition-colors cursor-pointer group">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-coral/30 border border-coral/50 rounded-full">
                    <span className="text-coral text-xs font-bold">{t.bestValue}</span>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-cream/70 text-sm mb-1">{t.priceMonth}</p>
                    <p className="text-2xl font-bold text-coral mb-2">{t.priceMonthAmount}</p>
                    <p className="text-cream/50 text-xs mb-3">{t.priceMonthDesc}</p>
                    <button
                      onClick={() => {
                        setShowPricing(false);
                        handleAddNewPerson();
                      }}
                      className="w-full py-2 bg-coral/20 border border-coral/30 rounded-lg text-coral text-sm font-semibold hover:bg-coral/30 transition-colors"
                    >
                      {t.selectPlan}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPricing(false)}
                className="w-full mt-4 py-2 text-cream/50 text-sm hover:text-cream/70 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          )}

          {/* People list */}
          {additionalPeople.length === 0 ? (
            <div className="text-center py-12 text-cream/50">
              <p className="text-lg">{t.noPeopleYet}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {additionalPeople.map((person, index) => (
                <div
                  key={index}
                  className="p-4 bg-dark/60 border border-coral/20 rounded-2xl flex items-center gap-4 hover:border-coral/40 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full border-2 border-coral/30 flex-shrink-0"
                    style={{
                      background: person.photo
                        ? `url(${person.photo}) center/cover`
                        : 'linear-gradient(135deg, rgba(255, 140, 105, 0.3) 0%, rgba(255, 193, 122, 0.3) 100%)',
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-cream m-0 truncate">
                      {person.name}
                    </h3>
                    <p className="text-sm text-cream/50 m-0">
                      {t[person.relationship]} · {person.targetAge}세 ·{' '}
                      {person.timeDirection === 'past' ? t.past : t.future}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStartChatWithPerson(person)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-coral-dark flex items-center justify-center text-white cursor-pointer shadow-lg shadow-coral/30 hover:shadow-coral/50 transition-shadow"
                      title={t.startConversation}
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleEditPerson(index)}
                      className="w-10 h-10 rounded-full bg-coral/10 border border-coral/30 flex items-center justify-center text-coral cursor-pointer hover:bg-coral/20 transition-colors"
                      title={t.editPerson}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePerson(index)}
                      className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 cursor-pointer hover:bg-red-500/20 transition-colors"
                      title={t.deletePerson}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-coral/20">
          <button
            onClick={() => setShowPeopleManager(false)}
            className="w-full p-4 bg-coral/10 border border-coral/30 rounded-2xl text-coral font-semibold cursor-pointer hover:bg-coral/20 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PeopleManager;

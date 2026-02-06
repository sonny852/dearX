import React, { memo, useState } from 'react';
import { X, Plus, Edit2, Trash2, MessageCircle, Sparkles, CreditCard, Lock } from 'lucide-react';
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
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPricing(false);
    setShowPayment(true);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // TODO: 실제 결제 연동
    setTimeout(() => {
      setIsProcessing(false);
      setShowPayment(false);
      setSelectedPlan(null);
      handleAddNewPerson();
    }, 1500);
  };

  if (!showPeopleManager) return null;

  const planInfo = {
    day: { label: t.priceDay, amount: t.priceDayAmount },
    week: { label: t.priceWeek, amount: t.priceWeekAmount },
    month: { label: t.priceMonth, amount: t.priceMonthAmount },
  };

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
          {/* Add new person button - hide when pricing or payment is shown */}
          {!showPricing && !showPayment && (
            <button
              onClick={() => setShowPricing(true)}
              className="w-full p-4 mb-6 flex items-center justify-center gap-3 bg-gradient-to-br from-coral/20 to-gold/20 border-2 border-dashed border-coral/30 rounded-2xl text-coral cursor-pointer hover:bg-coral/30 transition-colors"
            >
              <Plus size={24} />
              <span className="text-lg font-semibold">{t.addNewPerson}</span>
            </button>
          )}

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
                      onClick={() => handleSelectPlan('day')}
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
                      onClick={() => handleSelectPlan('week')}
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
                      onClick={() => handleSelectPlan('month')}
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

          {/* Payment Section */}
          {showPayment && selectedPlan && (
            <div className="mb-6 p-6 bg-dark/80 border border-coral/20 rounded-2xl">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  {t.paymentTitle}
                </h3>
                <p className="text-cream/60 text-sm">
                  {planInfo[selectedPlan].label} - <span className="text-coral font-bold">{planInfo[selectedPlan].amount}</span>
                </p>
              </div>

              {/* Card Form */}
              <div className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="block mb-2 text-cream/70 text-sm">{t.cardNumber}</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t.cardNumberPlaceholder}
                      className="w-full p-4 pl-12 bg-dark border border-coral/30 rounded-xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
                      maxLength={19}
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-coral/50" size={20} />
                  </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-cream/70 text-sm">{t.expiryDate}</label>
                    <input
                      type="text"
                      placeholder={t.expiryDatePlaceholder}
                      className="w-full p-4 bg-dark border border-coral/30 rounded-xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-cream/70 text-sm">{t.cvc}</label>
                    <input
                      type="text"
                      placeholder={t.cvcPlaceholder}
                      className="w-full p-4 bg-dark border border-coral/30 rounded-xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
                      maxLength={4}
                    />
                  </div>
                </div>

                {/* Card Holder */}
                <div>
                  <label className="block mb-2 text-cream/70 text-sm">{t.cardHolder}</label>
                  <input
                    type="text"
                    placeholder={t.cardHolderPlaceholder}
                    className="w-full p-4 bg-dark border border-coral/30 rounded-xl text-cream text-base outline-none focus:border-coral/60 transition-colors"
                  />
                </div>

                {/* Secure badge */}
                <div className="flex items-center justify-center gap-2 text-cream/40 text-xs">
                  <Lock size={12} />
                  <span>{t.securePayment}</span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full p-4 bg-gradient-to-r from-coral to-gold border-none rounded-xl text-white text-lg font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? t.paymentProcessing : `${t.payNow} ${planInfo[selectedPlan].amount}`}
                </button>

                <button
                  onClick={() => {
                    setShowPayment(false);
                    setShowPricing(true);
                  }}
                  className="w-full py-2 text-cream/50 text-sm hover:text-cream/70 transition-colors"
                >
                  {t.back}
                </button>
              </div>
            </div>
          )}

          {/* People list */}
          {additionalPeople.length === 0 && !showPricing && !showPayment ? (
            <div className="text-center py-12 text-cream/50">
              <p className="text-lg">{t.noPeopleYet}</p>
            </div>
          ) : (
            !showPricing && !showPayment && (
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
                        {person.relationship} · {person.targetAge}세 ·{' '}
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
            )
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

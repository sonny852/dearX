import React, { memo, useState } from 'react';
import { X, Sparkles, CreditCard, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PaymentPopup = memo(function PaymentPopup() {
  const {
    showPaymentPopup,
    setShowPaymentPopup,
    paymentReason,
    FREE_MESSAGE_LIMIT,
    t,
  } = useApp();

  const [showPricing, setShowPricing] = useState(true);
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
      setShowPricing(true);
      setShowPaymentPopup(false);
      // TODO: Update user to premium status
    }, 1500);
  };

  const handleClose = () => {
    setShowPaymentPopup(false);
    setShowPricing(true);
    setShowPayment(false);
    setSelectedPlan(null);
  };

  if (!showPaymentPopup) return null;

  const planInfo = {
    day: { label: t.priceDay, amount: t.priceDayAmount },
    week: { label: t.priceWeek, amount: t.priceWeekAmount },
    month: { label: t.priceMonth, amount: t.priceMonthAmount },
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[500px] max-h-[90vh] bg-dark-card backdrop-blur-2xl rounded-3xl border border-coral/20 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-coral/20">
          <h2 className="text-xl font-display font-bold text-coral m-0">
            {paymentReason === 'addPerson'
              ? '소중한 사람을 더 만나보세요'
              : (t.freeMessagesUsed || '오늘 무료 대화를 모두 사용했어요')}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-coral/10 border border-coral/30 flex items-center justify-center text-coral cursor-pointer hover:bg-coral/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Message about free limit */}
          <div className="text-center mb-6">
            <p className="text-cream/70 text-sm">
              {paymentReason === 'addPerson'
                ? '무료 플랜은 1명까지 대화할 수 있어요'
                : (t.freeMessagesInfo || `하루 ${FREE_MESSAGE_LIMIT}회 무료 대화를 모두 사용하셨습니다.`)}
            </p>
            <p className="text-cream/50 text-xs mt-2">
              {paymentReason === 'addPerson'
                ? '프리미엄에서 여러 사람과 대화할 수 있어요'
                : (t.continueWithPremium || '프리미엄으로 계속 대화하세요')}
            </p>
          </div>

          {/* Pricing Section */}
          {showPricing && (
            <div className="p-4 bg-dark/80 border border-coral/20 rounded-2xl">
              <div className="text-center mb-4">
                <h3 className="text-lg font-display font-bold text-coral mb-1">
                  {t.pricingTitle}
                </h3>
                <p className="text-cream/60 text-xs">{t.pricingSubtitle}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* 하루 */}
                <div className="relative p-3 pt-6 bg-dark-card border border-coral/20 rounded-xl hover:border-coral/40 transition-colors cursor-pointer group flex flex-col">
                  <div className="text-center flex-1 flex flex-col">
                    <p className="text-cream/70 text-xs mb-1">{t.priceDay}</p>
                    <p className="text-xl font-bold text-coral mb-1">{t.priceDayAmount}</p>
                    <p className="text-cream/50 text-[10px] mb-3 flex-1">{t.priceDayDesc}</p>
                    <button
                      onClick={() => handleSelectPlan('day')}
                      className="w-full py-1.5 bg-coral/20 border border-coral/30 rounded-lg text-coral text-xs font-semibold hover:bg-coral/30 transition-colors mt-auto"
                    >
                      {t.selectPlan}
                    </button>
                  </div>
                </div>

                {/* 1주 - 인기 */}
                <div className="relative p-3 pt-6 bg-gradient-to-b from-coral/10 to-dark-card border-2 border-coral/50 rounded-xl cursor-pointer group flex flex-col">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-coral to-gold rounded-full whitespace-nowrap">
                    <span className="text-white text-[10px] font-bold flex items-center gap-0.5">
                      <Sparkles size={10} />
                      {t.mostPopular}
                    </span>
                  </div>
                  <div className="text-center flex-1 flex flex-col">
                    <p className="text-cream/70 text-xs mb-1">{t.priceWeek}</p>
                    <p className="text-xl font-bold text-coral mb-1">{t.priceWeekAmount}</p>
                    <p className="text-cream/50 text-[10px] mb-3 flex-1">{t.priceWeekDesc}</p>
                    <button
                      onClick={() => handleSelectPlan('week')}
                      className="w-full py-1.5 bg-gradient-to-r from-coral to-gold border-none rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity mt-auto"
                    >
                      {t.selectPlan}
                    </button>
                  </div>
                </div>

                {/* 1달 - 가성비 */}
                <div className="relative p-3 pt-6 bg-dark-card border border-coral/20 rounded-xl hover:border-coral/40 transition-colors cursor-pointer group flex flex-col">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-coral/30 border border-coral/50 rounded-full whitespace-nowrap">
                    <span className="text-coral text-[10px] font-bold">{t.bestValue}</span>
                  </div>
                  <div className="text-center flex-1 flex flex-col">
                    <p className="text-cream/70 text-xs mb-1">{t.priceMonth}</p>
                    <p className="text-xl font-bold text-coral mb-1">{t.priceMonthAmount}</p>
                    <p className="text-cream/50 text-[10px] mb-3 flex-1">{t.priceMonthDesc}</p>
                    <button
                      onClick={() => handleSelectPlan('month')}
                      className="w-full py-1.5 bg-coral/20 border border-coral/30 rounded-lg text-coral text-xs font-semibold hover:bg-coral/30 transition-colors mt-auto"
                    >
                      {t.selectPlan}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          {showPayment && selectedPlan && (
            <div className="p-4 bg-dark/80 border border-coral/20 rounded-2xl">
              <div className="text-center mb-4">
                <h3 className="text-lg font-display font-bold text-coral mb-1">
                  {t.paymentTitle}
                </h3>
                <p className="text-cream/60 text-sm">
                  {planInfo[selectedPlan].label} - <span className="text-coral font-bold">{planInfo[selectedPlan].amount}</span>
                </p>
              </div>

              {/* Card Form */}
              <div className="space-y-3">
                {/* Card Number */}
                <div>
                  <label className="block mb-1 text-cream/70 text-xs">{t.cardNumber}</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t.cardNumberPlaceholder}
                      className="w-full p-3 pl-10 bg-dark border border-coral/30 rounded-xl text-cream text-sm outline-none focus:border-coral/60 transition-colors"
                      maxLength={19}
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-coral/50" size={16} />
                  </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-cream/70 text-xs">{t.expiryDate}</label>
                    <input
                      type="text"
                      placeholder={t.expiryDatePlaceholder}
                      className="w-full p-3 bg-dark border border-coral/30 rounded-xl text-cream text-sm outline-none focus:border-coral/60 transition-colors"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-cream/70 text-xs">{t.cvc}</label>
                    <input
                      type="text"
                      placeholder={t.cvcPlaceholder}
                      className="w-full p-3 bg-dark border border-coral/30 rounded-xl text-cream text-sm outline-none focus:border-coral/60 transition-colors"
                      maxLength={4}
                    />
                  </div>
                </div>

                {/* Card Holder */}
                <div>
                  <label className="block mb-1 text-cream/70 text-xs">{t.cardHolder}</label>
                  <input
                    type="text"
                    placeholder={t.cardHolderPlaceholder}
                    className="w-full p-3 bg-dark border border-coral/30 rounded-xl text-cream text-sm outline-none focus:border-coral/60 transition-colors"
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
                  className="w-full p-3 bg-gradient-to-r from-coral to-gold border-none rounded-xl text-white text-base font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? t.paymentProcessing : `${t.payNow} ${planInfo[selectedPlan].amount}`}
                </button>

                <button
                  onClick={() => {
                    setShowPayment(false);
                    setShowPricing(true);
                  }}
                  className="w-full py-2 text-cream/50 text-xs hover:text-cream/70 transition-colors"
                >
                  {t.back}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PaymentPopup;

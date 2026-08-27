import React, { useState } from 'react';
import api from '../../services/api';
import BankSelection from './BankSelection';
import EMIPlanSelection from './EMIPlanSelection';
import EMIPlanSummary from './EMIPlanSummary';
import CardDetails from './CardDetails';
import OTPCaptureModal from '../payment/OTPCaptureModal';
import PaymentProcessing from './PaymentProcessing';

const CreditCardEMI = ({ cartId, orderAmount, onCreateOrder, onSuccess, onError, onCancel }) => {
  const [step, setStep] = useState('BANK_SELECTION');
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [emiQuote, setEmiQuote] = useState(null);
  const [iciciResponse, setIciciResponse] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({ isProcessing: false, status: null, message: '' });

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setStep('PLAN_SELECTION');
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setStep('PLAN_SUMMARY');
  };

  const handleSummaryConfirm = (quote) => {
    setEmiQuote(quote);
    setStep('CARD_DETAILS');
  };

  const handlePay = async (cardDetails) => {
    setStep('PROCESSING');
    setProcessingStatus({ isProcessing: true, status: null, message: 'Creating order...' });

    try {
      // Create the order using the parent's function before initiating payment
      const orderId = await onCreateOrder(emiQuote);
      if (!orderId) throw new Error('Failed to create order');

      setProcessingStatus({ isProcessing: true, status: null, message: 'Initiating secure payment...' });

      const { data } = await api.post('/payment/icici/initiate', {
        orderId,
        cartId,
        cardNo: cardDetails.cardNumber,
        cardExp: cardDetails.cardExp,
        nameOnCard: cardDetails.nameOnCard,
        cvv: cardDetails.cvv,
        emiQuoteId: emiQuote._id
      });

      if (data.success) {
        if (data.mode === 'OTP') {
          setIciciResponse(data);
          setStep('OTP_VERIFICATION');
        } else if (data.mode === 'REDIRECT') {
          // Standard ICICI redirection
          window.location.href = data.redirectURI;
        } else {
          setProcessingStatus({ isProcessing: false, status: 'error', message: 'Unknown payment mode.' });
        }
      } else {
        setProcessingStatus({ isProcessing: false, status: 'error', message: data.message });
      }
    } catch (err) {
      setProcessingStatus({ isProcessing: false, status: 'error', message: err.message || 'Payment initiation failed.' });
    }
  };

  const handleOtpSuccess = (data) => {
    if (onSuccess) onSuccess(data);
  };

  const handleOtpFailure = (message) => {
    setProcessingStatus({ isProcessing: false, status: 'error', message });
    if (onError) onError(message);
  };

  return (
    <div className="w-full">
      {step === 'BANK_SELECTION' && (
        <BankSelection cartId={cartId} onSelectBank={handleBankSelect} onBack={onCancel} />
      )}
      {step === 'PLAN_SELECTION' && (
        <EMIPlanSelection cartId={cartId} bank={selectedBank} orderAmount={orderAmount} onSelectPlan={handlePlanSelect} onBack={() => setStep('BANK_SELECTION')} />
      )}
      {step === 'PLAN_SUMMARY' && (
        <EMIPlanSummary bank={selectedBank} plan={selectedPlan} orderAmount={orderAmount} cartId={cartId} onConfirm={handleSummaryConfirm} onBack={() => setStep('PLAN_SELECTION')} />
      )}
      {step === 'CARD_DETAILS' && (
        <CardDetails bank={selectedBank} quote={emiQuote} onPay={handlePay} onBack={() => setStep('PLAN_SUMMARY')} />
      )}
      {step === 'OTP_VERIFICATION' && (
        <OTPCaptureModal 
          isOpen={true} 
          onClose={() => {
            setProcessingStatus({ isProcessing: false, status: 'error', message: 'OTP Verification cancelled.' });
            setStep('CARD_DETAILS');
          }}
          onVerifySuccess={handleOtpSuccess}
          generateOTPURI={iciciResponse.generateOTPURI}
          verifyOTPURI={iciciResponse.verifyOTPURI}
          authorizeURI={iciciResponse.authorizeURI}
          tranCtx={iciciResponse.tranCtx}
          merchantTxnNo={iciciResponse.merchantTxnNo}
        />
      )}
      {step === 'PROCESSING' && (
        <PaymentProcessing isProcessing={processingStatus.isProcessing} status={processingStatus.status} message={processingStatus.message} />
      )}
    </div>
  );
};

export default CreditCardEMI;

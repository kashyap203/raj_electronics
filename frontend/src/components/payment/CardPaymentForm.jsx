import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';
import { paymentService } from '../../services';

const luhnCheck = (num) => {
  let arr = (num + '').split('').reverse().map((x) => parseInt(x, 10));
  let lastDigit = arr.splice(0, 1)[0];
  let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
  sum += lastDigit;
  return sum % 10 === 0;
};

const getNetworkIcon = (network) => {
  if (!network) return <FaCreditCard className="text-gray-400" size={24} />;
  const net = network.toUpperCase();
  if (net.includes('VISA')) return <SiVisa className="text-blue-600" size={32} />;
  if (net.includes('MASTER') || net.includes('MC')) return <SiMastercard className="text-red-500" size={32} />;
  if (net.includes('RUPAY')) return <span className="font-bold text-orange-600 italic">RuPay</span>;
  return <FaCreditCard className="text-gray-400" size={24} />;
};

const STATES = {
  EMPTY: 'EMPTY',
  INCOMPLETE: 'INCOMPLETE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  VALIDATING: 'VALIDATING',
  CARD_VALID: 'CARD_VALID',
  BANK_VERIFICATION_PENDING: 'BANK_VERIFICATION_PENDING',
  BANK_VERIFIED: 'BANK_VERIFIED',
  BANK_NOT_VERIFIED: 'BANK_NOT_VERIFIED',
  BANK_VERIFICATION_UNAVAILABLE: 'BANK_VERIFICATION_UNAVAILABLE',
  OFFER_ELIGIBLE: 'OFFER_ELIGIBLE',
  OFFER_NOT_ELIGIBLE: 'OFFER_NOT_ELIGIBLE',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
};

const CardPaymentForm = ({ onValidCardData, disabled, orderAmount, bankDiscountId }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const [expiryError, setExpiryError] = useState('');
  const [cvvError, setCvvError] = useState('');

  const [validationState, setValidationState] = useState(STATES.EMPTY);
  const [offerState, setOfferState] = useState(STATES.EMPTY);
  
  const [networkDetected, setNetworkDetected] = useState('');
  const [cardTypeDetected, setCardTypeDetected] = useState('');
  const [uiMessage, setUiMessage] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  
  const [binData, setBinData] = useState(null);
  
  const abortControllerRef = useRef(null);

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 19) val = val.slice(0, 19);
    
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
    revalidate(val);
  };

  const revalidate = (cleanCardNum) => {
    setBinData(null);
    setNetworkDetected('');
    setCardTypeDetected('');
    setOfferState(STATES.EMPTY);
    setOfferMessage('');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!cleanCardNum) {
      setValidationState(STATES.EMPTY);
      setUiMessage('');
      return;
    }

    if (cleanCardNum.length < 13) {
      setValidationState(STATES.INCOMPLETE);
      setUiMessage('');
      return;
    }

    if (!luhnCheck(cleanCardNum)) {
      setValidationState(STATES.INVALID_FORMAT);
      setUiMessage('Enter a valid card number.');
      return;
    }

    setValidationState(STATES.VALIDATING);
    setOfferState(STATES.BANK_VERIFICATION_PENDING);
    setUiMessage('');
    
    triggerBackendValidation(cleanCardNum);
  };

  const triggerBackendValidation = useCallback((cleanCardNum) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setTimeout(async () => {
      if (controller.signal.aborted) return;

      try {
        const response = await paymentService.validatePaymentAndOffer({
           cardNo: cleanCardNum,
           orderAmount,
           bankDiscountId
        }, { signal: controller.signal });

        if (controller.signal.aborted) return;

        const data = response.data;
        if (data.network) setNetworkDetected(data.network);
        if (data.actualCardType) {
           setCardTypeDetected(data.actualCardType === 'CC' ? 'Credit Card' : (data.actualCardType === 'DC' ? 'Debit Card' : data.actualCardType));
        }

        if (data.paymentValid) {
           setValidationState(STATES.CARD_VALID);
           setUiMessage('');
           setBinData({ network: data.network, cardType: data.actualCardType });
           
           const offerResult = data.offerEligibility;
           if (offerResult && offerResult.eligible) {
              setOfferState(STATES.OFFER_ELIGIBLE);
              setOfferMessage(`Offer Eligible! ₹${offerResult.discountAmount} discount applied`);
           } else if (offerResult && offerResult.reason === 'BANK_VERIFICATION_UNAVAILABLE') {
              setOfferState(STATES.BANK_VERIFICATION_UNAVAILABLE);
              setOfferMessage('Unable to verify eligibility for this bank offer.');
           } else if (offerResult && offerResult.reason === 'BANK_NOT_VERIFIED') {
              setOfferState(STATES.BANK_NOT_VERIFIED);
              setOfferMessage('This card is not eligible for the selected bank offer.');
           } else if (offerResult && offerResult.reason === 'CARD_TYPE_MISMATCH') {
              setOfferState(STATES.OFFER_NOT_ELIGIBLE);
              setOfferMessage('This offer is not valid for this card type.');
           } else if (offerResult) {
              setOfferState(STATES.OFFER_NOT_ELIGIBLE);
              setOfferMessage('Offer not eligible for this card.');
           }
        } else {
           setOfferState(STATES.EMPTY);
           setValidationState(STATES.INVALID_FORMAT);
           setUiMessage(data.message || 'Invalid card details.');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
           setValidationState(STATES.INVALID_FORMAT);
           setOfferState(STATES.EMPTY);
           setUiMessage('Payment service is temporarily unavailable. Please try again.');
        }
      }
    }, 500);
  }, [orderAmount, bankDiscountId]);

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    
    if (val.length > 2) {
      val = val.substring(0, 2) + ' / ' + val.substring(2);
    }
    setExpiry(val);

    if (val.length === 7) {
      const [m, y] = val.split(' / ');
      const month = parseInt(m, 10);
      const year = parseInt(`20${y}`, 10);
      
      if (month < 1 || month > 12) {
        setExpiryError('Enter a valid expiry date');
      } else {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          setExpiryError('Your card has expired');
        } else {
          setExpiryError('');
        }
      }
    } else {
      setExpiryError('');
    }
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    setCvv(val);

    if (val.length >= 3) {
      setCvvError('');
    }
  };

  useEffect(() => {
    const cleanCard = cardNumber.replace(/\D/g, '');
    const isExpiryValid = expiry.length === 7 && !expiryError;
    const isCvvValid = cvv.length >= 3 && !cvvError;
    const isNameValid = nameOnCard.trim().length > 0;

    if (validationState === STATES.CARD_VALID && isExpiryValid && isCvvValid && isNameValid) {
      onValidCardData({
        cardNo: cleanCard,
        cardExp: expiry,
        cvv,
        nameOnCard,
        binData,
        offerState
      });
    } else {
      onValidCardData(null);
    }
  }, [validationState, offerState, expiry, cvv, nameOnCard, expiryError, cvvError, binData, cardNumber, onValidCardData]);

  const hasError = validationState === STATES.INVALID_FORMAT;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
        <FaCreditCard className="text-primary" /> Card Details
      </h3>
      
      <div className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
          <div className={`relative flex items-center border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-colors`}>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={disabled}
              placeholder="0000 0000 0000 0000"
              className="w-full py-2.5 pl-3 pr-12 text-sm outline-none bg-transparent tracking-widest text-gray-800"
            />
            <div className="absolute right-3 flex items-center justify-center">
              {validationState === STATES.VALIDATING ? (
                 <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full"></div>
              ) : (
                getNetworkIcon(networkDetected)
              )}
            </div>
          </div>
          {hasError && <p className="text-red-500 text-xs mt-1">{uiMessage}</p>}
          {validationState === STATES.CARD_VALID && (
             <div className="mt-2 space-y-1">
               <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                 <FaCheckCircle /> {networkDetected} Detected
               </p>
               {cardTypeDetected && (
                 <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                   <FaCheckCircle /> {cardTypeDetected}
                 </p>
               )}
               {offerState === STATES.OFFER_ELIGIBLE && (
                 <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                   <FaCheckCircle /> {offerMessage}
                 </p>
               )}
               {offerState === STATES.BANK_VERIFICATION_UNAVAILABLE && bankDiscountId && (
                 <p className="text-orange-500 text-xs font-medium flex items-center gap-1">
                   <FaExclamationTriangle /> {offerMessage}
                 </p>
               )}
               {offerState === STATES.BANK_NOT_VERIFIED && (
                 <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                   <FaExclamationTriangle /> {offerMessage}
                 </p>
               )}
               {offerState === STATES.OFFER_NOT_ELIGIBLE && (
                 <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                   <FaExclamationTriangle /> {offerMessage}
                 </p>
               )}
             </div>
          )}
        </div>

        {/* Name on Card */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name on Card</label>
          <input
            type="text"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            disabled={disabled}
            placeholder="Name as printed on card"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none uppercase"
          />
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Valid Thru</label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              disabled={disabled}
              placeholder="MM / YY"
              className={`w-full border ${expiryError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none tracking-widest`}
            />
            {expiryError && <p className="text-red-500 text-xs mt-1">{expiryError}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
            <input
              type="password"
              value={cvv}
              onChange={handleCvvChange}
              disabled={disabled}
              placeholder="•••"
              className={`w-full border ${cvvError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none tracking-widest`}
            />
            {cvvError && <p className="text-red-500 text-xs mt-1">{cvvError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPaymentForm;

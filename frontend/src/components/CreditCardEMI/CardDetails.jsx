import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';

const STATES = {
  EMPTY: 'EMPTY',
  INCOMPLETE: 'INCOMPLETE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  VALIDATING: 'VALIDATING',
  CARD_VALID: 'CARD_VALID',
};

const getNetworkIcon = (network) => {
  if (!network) return <FaCreditCard className="text-gray-400" size={24} />;
  const net = network.toUpperCase();
  if (net.includes('VISA')) return <SiVisa className="text-blue-600" size={32} />;
  if (net.includes('MASTER') || net.includes('MC')) return <SiMastercard className="text-red-500" size={32} />;
  if (net.includes('RUPAY')) return <span className="font-bold text-orange-600 italic">RuPay</span>;
  return <FaCreditCard className="text-gray-400" size={24} />;
};

const CardDetails = ({ bank, quote, onPay, onBack }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const [expiryError, setExpiryError] = useState('');
  const [cvvError, setCvvError] = useState('');
  
  const [validationState, setValidationState] = useState(STATES.EMPTY);
  const [networkDetected, setNetworkDetected] = useState('');
  const [cardTypeDetected, setCardTypeDetected] = useState('');
  const [uiMessage, setUiMessage] = useState('');
  
  const [binData, setBinData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const abortControllerRef = useRef(null);

  // Basic Luhn algorithm for card validation
  const luhnCheck = (num) => {
    let arr = (num + '').split('').reverse().map((x) => parseInt(x, 10));
    let lastDigit = arr.splice(0, 1)[0];
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
    sum += lastDigit;
    return sum % 10 === 0;
  };

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
    setUiMessage('');
    
    triggerBackendValidation(cleanCardNum);
  };

  const triggerBackendValidation = useCallback((cleanCardNum) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setTimeout(async () => {
      if (controller.signal.aborted) return;

      try {
        const { data: binResponse } = await api.post('/payment/icici/bin', {
          cardNo: cleanCardNum
        }, { signal: controller.signal });

        if (controller.signal.aborted) return;

        if (binResponse.success) {
          setNetworkDetected(binResponse.network);
          setCardTypeDetected(binResponse.cardType === 'CC' ? 'Credit Card' : (binResponse.cardType === 'DC' ? 'Debit Card' : binResponse.cardType));
          setValidationState(STATES.CARD_VALID);
          setUiMessage('');
          setBinData(binResponse);
        } else {
          setValidationState(STATES.INVALID_FORMAT);
          setUiMessage('Invalid card details.');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setValidationState(STATES.INVALID_FORMAT);
          setUiMessage('Payment service is temporarily unavailable. Please try again.');
        }
      }
    }, 500);
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiMessage('');

    if (validationState !== STATES.CARD_VALID || !binData) {
      setValidationState(STATES.INVALID_FORMAT);
      setUiMessage('Please enter a valid card number.');
      return;
    }
    
    if (expiry.length !== 7 || expiryError) {
      setExpiryError(expiryError || 'Invalid expiry date');
      return;
    }

    if (cvv.length < 3 || cvvError) {
      setCvvError(cvvError || 'Invalid CVV');
      return;
    }

    if (!nameOnCard.trim()) {
      return;
    }

    setIsProcessing(true);
    
    const cleanCard = cardNumber.replace(/\D/g, '');
    
    // Pass the details up for actual payment processing
    onPay({
      cardNumber: cleanCard,
      cardExp: expiry,
      nameOnCard: nameOnCard,
      cvv,
      cardType: binData.cardType, // E.g., 'CC'
      network: binData.network
    });
  };

  const hasError = validationState === STATES.INVALID_FORMAT;

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-lg p-6">
      <div className="flex items-center mb-6">
        <button onClick={onBack} disabled={isProcessing} className="mr-3 text-gray-500 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800">Credit Card EMI</h2>
      </div>

      <div className="flex items-center space-x-3 mb-6 bg-gray-50 p-4 rounded border border-gray-100">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center overflow-hidden">
          {bank.logo ? (
            <img src={bank.logo} alt={bank.bankName} className="object-contain" />
          ) : (
            <span className="text-gray-400 font-bold text-xs">{bank.bankName.substring(0, 2)}</span>
          )}
        </div>
        <div className="text-gray-700">
          <span className="font-medium block">{bank.bankName}</span>
          <span className="text-sm text-gray-500">
            ₹{quote.monthlyEmi} x {quote.tenureMonths} M | @{quote.interestRate.toFixed(2)}% p.a
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
          <div className={`relative flex items-center border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-colors`}>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={isProcessing}
              placeholder="0000 0000 0000 0000"
              className="w-full py-2.5 pl-3 pr-12 text-sm outline-none bg-transparent tracking-widest text-gray-800"
              required
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
            disabled={isProcessing}
            placeholder="Name as printed on card"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none uppercase"
            required
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
              disabled={isProcessing}
              placeholder="MM / YY"
              className={`w-full border ${expiryError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none tracking-widest`}
              required
            />
            {expiryError && <p className="text-red-500 text-xs mt-1">{expiryError}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
            <input
              type="password"
              value={cvv}
              onChange={handleCvvChange}
              disabled={isProcessing}
              placeholder="•••"
              className={`w-full border ${cvvError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none tracking-widest`}
              required
            />
            {cvvError && <p className="text-red-500 text-xs mt-1">{cvvError}</p>}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mt-6 bg-gray-50">
          <div className="flex justify-between mb-2 text-gray-600">
            <span>Order Value</span>
            <span>₹{quote.totalPrincipal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
            <span>Payable Now*</span>
            <span>₹{quote.payableNow.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full py-3 mt-4 rounded-xl font-bold text-white transition-colors ${
            isProcessing ? 'bg-primary-dark/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-md'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Place Order & Pay'}
        </button>
      </div>
    </div>
  );
};

export default CardDetails;

import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';

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

const EmiCardPaymentForm = ({ onValidCardData, disabled, emiPlan }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const [expiryError, setExpiryError] = useState('');
  const [cvvError, setCvvError] = useState('');
  
  const [networkDetected, setNetworkDetected] = useState('');
  const [validationState, setValidationState] = useState('EMPTY'); // EMPTY, INVALID, VALID

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 19) val = val.slice(0, 19);
    
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
    revalidate(val);
  };

  const revalidate = (cleanCardNum) => {
    if (!cleanCardNum) {
      setValidationState('EMPTY');
      setNetworkDetected('');
      return;
    }

    // Basic network detection
    const prefix = cleanCardNum.substring(0, 1);
    if (prefix === '4') setNetworkDetected('VISA');
    else if (prefix === '5') setNetworkDetected('MASTERCARD');
    else if (prefix === '6') setNetworkDetected('RUPAY');
    else setNetworkDetected('');

    if (cleanCardNum.length < 13) {
      setValidationState('EMPTY');
      return;
    }

    if (!luhnCheck(cleanCardNum)) {
      setValidationState('INVALID');
      return;
    }

    setValidationState('VALID');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiry(val);
    setExpiryError('');
  };

  const validateExpiry = () => {
    if (expiry.length === 5) {
      const [m, y] = expiry.split('/');
      const month = parseInt(m, 10);
      const year = parseInt(y, 10) + 2000;
      if (month < 1 || month > 12) {
        setExpiryError('Invalid month');
        return false;
      }
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        setExpiryError('Card expired');
        return false;
      }
      setExpiryError('');
      return true;
    }
    if (expiry.length > 0) {
      setExpiryError('Format MM/YY');
      return false;
    }
    return false;
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvv(val);
    setCvvError('');
  };

  const validateCvv = () => {
    if (cvv.length > 0 && cvv.length < 3) {
      setCvvError('Min 3 digits');
      return false;
    }
    return cvv.length >= 3;
  };

  useEffect(() => {
    const cleanCard = cardNumber.replace(/\s/g, '');
    const isExpiryValid = expiry.length === 5 && !expiryError && validateExpiry();
    const isCvvValid = cvv.length >= 3 && !cvvError;
    const isNameValid = nameOnCard.trim().length > 2;
    const isCardValid = validationState === 'VALID';

    if (isCardValid && isExpiryValid && isCvvValid && isNameValid) {
      onValidCardData({
        cardNo: cleanCard,
        cardExp: expiry.replace('/', ''), // MMYY
        cvv: cvv,
        nameOnCard: nameOnCard.trim()
      });
    } else {
      onValidCardData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardNumber, expiry, cvv, nameOnCard, validationState, expiryError, cvvError]);

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <FaCreditCard className="text-blue-600" />
        <h3 className="font-semibold text-gray-800">EMI Credit Card Details</h3>
      </div>
      
      {emiPlan && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-xs flex justify-between items-center shadow-sm">
          <div>
            <p className="text-gray-500 font-medium">Selected Plan</p>
            <p className="text-gray-800 font-bold">{emiPlan.bankName} - {emiPlan.tenure} Months</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-medium">Monthly EMI</p>
            <p className="text-primary font-bold">₹{emiPlan.monthlyEMI.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={disabled}
              placeholder="0000 0000 0000 0000"
              className={`w-full border rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:outline-none transition font-mono ${
                validationState === 'INVALID' ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-200 bg-white'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getNetworkIcon(networkDetected)}
            </div>
          </div>
          {validationState === 'INVALID' && (
            <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
              <FaExclamationTriangle /> Invalid Card Number
            </p>
          )}
          {validationState === 'VALID' && (
            <p className="text-green-600 text-[10px] mt-1 flex items-center gap-1">
              <FaCheckCircle /> Card validated
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              onBlur={validateExpiry}
              disabled={disabled}
              placeholder="MM/YY"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:outline-none transition ${
                expiryError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-200 bg-white'
              }`}
            />
            {expiryError && <p className="text-red-500 text-[10px] mt-1">{expiryError}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
            <input
              type="password"
              value={cvv}
              onChange={handleCvvChange}
              onBlur={validateCvv}
              disabled={disabled}
              placeholder="***"
              maxLength={4}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:outline-none transition text-center tracking-widest ${
                cvvError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-200 bg-white'
              }`}
            />
            {cvvError && <p className="text-red-500 text-[10px] mt-1">{cvvError}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name on Card</label>
          <input
            type="text"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value.toUpperCase())}
            disabled={disabled}
            placeholder="Name as printed on card"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 outline-none transition bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default EmiCardPaymentForm;

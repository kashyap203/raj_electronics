import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const EMIPlanSummary = ({ cartId, bank, plan, orderAmount, onConfirm, onBack }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const { data } = await api.post('/emi/quote', {
          cartId,
          bankId: bank._id,
          emiPlanId: plan._id,
          orderAmount
        });
        setQuote(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to generate secure EMI quote. Please try again.');
        setLoading(false);
      }
    };
    fetchQuote();
  }, [cartId, bank, plan, orderAmount]);

  if (loading) return <div className="p-4 text-center">Calculating EMI securely...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!quote) return null;

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-lg p-6">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3 text-gray-500 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800">Credit Card EMI</h2>
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
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

      <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex justify-between mb-2 text-gray-600">
          <span>Order Value</span>
          <span>₹{quote.totalPrincipal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
          <span>Payable Now*</span>
          <span>₹{quote.payableNow.toFixed(2)}</span>
        </div>
      </div>

      <ul className="text-xs text-gray-500 space-y-2 mb-6 list-disc pl-4">
        <li>
          ₹{quote.payableNow.toFixed(2)} will be converted to a loan and credited back to your account within 5-10 days.
        </li>
        {quote.processingFee > 0 && (
          <li>
            Processing fee of ₹{quote.processingFee.toFixed(2)} will be debited by your issuer.
          </li>
        )}
        <li>Standard GST rates will apply on the interest component (approx ₹{quote.gst.toFixed(2)}).</li>
        <li>This quote expires at {new Date(quote.expiresAt).toLocaleTimeString()}.</li>
      </ul>

      <button
        onClick={() => onConfirm(quote)}
        className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-bold text-white transition-colors"
      >
        Select this plan
      </button>
    </div>
  );
};

export default EMIPlanSummary;

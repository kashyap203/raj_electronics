import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const EMIPlanSelection = ({ cartId, bank, orderAmount, onSelectPlan, onBack }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.post(`/emi/cart/${cartId}/eligible-plans`, {
          bankName: bank.bankName,
          orderAmount
        });
        setPlans(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load EMI plans.');
        setLoading(false);
      }
    };
    fetchPlans();
  }, [bank, orderAmount]);

  // Helper to calculate basic preview numbers for UI
  const calculatePreview = (plan) => {
    let monthlyEmi = 0;
    let totalInterest = 0;
    
    if (plan.interestRate > 0) {
      const r = plan.interestRate / 12 / 100;
      const n = plan.tenureMonths;
      monthlyEmi = (orderAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalInterest = (monthlyEmi * n) - orderAmount;
    } else {
      monthlyEmi = orderAmount / plan.tenureMonths;
    }

    return {
      monthlyEmi: monthlyEmi.toFixed(2),
      totalInterest: totalInterest.toFixed(2)
    };
  };

  const handleContinue = () => {
    const plan = plans.find(p => p._id === selectedPlanId);
    if (plan) onSelectPlan(plan);
  };

  if (loading) return <div className="p-4 text-center">Loading plans...</div>;

  const noCostPlans = plans.filter(p => p.isNoCostEmi);
  const standardPlans = plans.filter(p => !p.isNoCostEmi);

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

      <div className="flex items-center space-x-3 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="w-10 h-10 bg-white rounded shadow-sm flex items-center justify-center overflow-hidden">
          {bank.logo ? (
            <img src={bank.logo} alt={bank.bankName} className="object-contain" />
          ) : (
            <span className="text-gray-400 font-bold text-sm">{bank.bankName.substring(0, 2)}</span>
          )}
        </div>
        <span className="font-medium text-gray-700">{bank.bankName}</span>
      </div>

      {error && <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

      {!error && noCostPlans.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">No Cost EMI Plans</h3>
          <div className="space-y-4 border-t border-b border-gray-100 py-2">
            {noCostPlans.map(plan => {
              const preview = calculatePreview(plan);
              return (
                <div key={plan._id} className="flex items-start cursor-pointer" onClick={() => setSelectedPlanId(plan._id)}>
                  <div className="flex-1">
                    <div className="text-gray-800 font-medium">
                      ₹{preview.monthlyEmi} x {plan.tenureMonths} M | @{plan.interestRate.toFixed(2)}% p.a <span className="text-green-600 text-xs">(No Cost)</span>
                    </div>
                    <div className="text-sm text-gray-500">Total ₹{preview.totalInterest} interest charged</div>
                  </div>
                  <input
                    type="radio"
                    name="emiPlan"
                    className="mt-1 w-5 h-5 text-teal-600 focus:ring-teal-500 border-gray-300"
                    checked={selectedPlanId === plan._id}
                    onChange={() => setSelectedPlanId(plan._id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!error && standardPlans.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Standard EMI Plans</h3>
          <div className="space-y-4 border-t border-b border-gray-100 py-2">
            {standardPlans.map(plan => {
              const preview = calculatePreview(plan);
              return (
                <div key={plan._id} className="flex items-start cursor-pointer" onClick={() => setSelectedPlanId(plan._id)}>
                  <div className="flex-1">
                    <div className="text-gray-800 font-medium">
                      ₹{preview.monthlyEmi} x {plan.tenureMonths} M | @{plan.interestRate.toFixed(2)}% p.a
                    </div>
                    <div className="text-sm text-gray-500">Total ₹{preview.totalInterest} interest charged</div>
                  </div>
                  <input
                    type="radio"
                    name="emiPlan"
                    className="mt-1 w-5 h-5 text-teal-600 focus:ring-teal-500 border-gray-300"
                    checked={selectedPlanId === plan._id}
                    onChange={() => setSelectedPlanId(plan._id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!error && plans.length === 0 && (
        <p className="text-center text-gray-500 my-8">No eligible plans for this order amount.</p>
      )}

      {!error && (
        <button
          onClick={handleContinue}
          disabled={!selectedPlanId}
          className={`w-full py-3 mt-4 rounded-lg font-bold text-white transition-colors ${
            selectedPlanId ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Select Plan
        </button>
      )}
    </div>
  );
};

export default EMIPlanSelection;

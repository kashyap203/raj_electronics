import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaTag, FaCreditCard } from 'react-icons/fa';
import { formatPrice } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const EmiSelectionModal = ({ isOpen, onClose, product, emiPlans, price, onContinue }) => {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  
  if (!isOpen) return null;

  const handleApply = (plan) => {
    setSelectedPlanId(plan._id);
  };

  const handleContinue = () => {
    const plan = emiPlans.find(p => p._id === selectedPlanId);
    if (plan) {
      onContinue(plan);
    }
  };

  const bestValuePlan = emiPlans.find(p => p.emiType === 'NO_COST' || p.discountValue > 0) || emiPlans[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choose your EMI plan</h2>
            <p className="text-sm text-gray-500 mt-0.5">Product: <span className="font-semibold text-gray-700">{product?.name}</span> • {formatPrice(price)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/30">
          {emiPlans.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No EMI plans available for this order amount.
            </div>
          ) : (
            emiPlans.map(plan => {
              const isSelected = selectedPlanId === plan._id;
              const isBest = bestValuePlan && bestValuePlan._id === plan._id;

              return (
                <div key={plan._id} className={`relative border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-primary shadow-[0_0_0_1px_rgba(235,92,30,1)] bg-orange-50/10' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                  {isBest && !isSelected && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-400 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-lg z-10">
                      Best value for you
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                      <FaCheckCircle /> Selected
                    </div>
                  )}

                  <div className="p-4 cursor-pointer" onClick={() => handleApply(plan)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 text-base">{plan.bankName}</h3>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium border border-gray-200">
                            {plan.tenure} Months
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-extrabold text-primary">{formatPrice(plan.monthlyEMI)}</span>
                          <span className="text-xs text-gray-500 font-medium">/month</span>
                        </div>
                      </div>
                      
                      {!isSelected && (
                        <button className="text-sm font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg transition">
                          Select
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-xs">
                      {plan.emiType === 'NO_COST' && (
                        <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1">
                          <FaTag size={10} /> No Cost EMI
                        </span>
                      )}
                      {plan.discountValue > 0 && (
                        <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1">
                          <FaTag size={10} /> {formatPrice(plan.discountValue)} Off
                        </span>
                      )}
                      {plan.emiType !== 'NO_COST' && plan.discountValue === 0 && (
                        <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                          Regular EMI ({plan.interestRate}% p.a.)
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-gray-200/60 text-sm">
                        <div className="flex justify-between text-gray-600 py-1">
                          <span>Principal Amount</span>
                          <span>{formatPrice(plan.principal)}</span>
                        </div>
                        {plan.totalDiscount > 0 && (
                          <div className="flex justify-between text-green-600 py-1 font-medium">
                            <span>Discount Applied</span>
                            <span>-{formatPrice(plan.totalDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600 py-1">
                          <span>Interest ({plan.interestRate}%)</span>
                          <span>{plan.totalInterest > 0 ? formatPrice(plan.totalInterest) : '₹0 (No Cost)'}</span>
                        </div>
                        {plan.processingFee > 0 && (
                          <div className="flex justify-between text-gray-600 py-1">
                            <span>Processing Fee</span>
                            <span>{formatPrice(plan.processingFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 py-2 mt-1 border-t border-gray-100 text-base">
                          <span>Total Payable</span>
                          <span>{formatPrice(plan.finalPayable)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-white">
          <button
            disabled={!selectedPlanId}
            onClick={handleContinue}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-base"
          >
            Continue with EMI
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmiSelectionModal;

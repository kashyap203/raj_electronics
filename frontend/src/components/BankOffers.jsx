import { useState } from 'react';
import { FaTags, FaCreditCard, FaChevronRight } from 'react-icons/fa';

const BankOffers = ({ price, onApplyOffer, appliedOffer, offers }) => {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white font-sans">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-2.5 flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-2">
          <FaTags className="text-gold" />
          <span className="font-semibold text-sm">Apply offers for maximum savings</span>
        </div>
        <FaChevronRight className="text-white text-xs opacity-70" />
      </div>

      <div className="p-4 bg-gradient-to-b from-[#fff3f0] to-white">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-3">Bank offers</h4>

        {/* Scrollable Offers List */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {offers.map((offer) => {
            const actualBankName = offer.bank ? offer.bank.bankName : offer.bankName;
            const logo = offer.bank ? offer.bank.logo : offer.logo;

            return (
              <div key={offer._id} className="min-w-[240px] max-w-[260px] snap-start border border-gray-200 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition border-b-[3px] border-b-transparent hover:border-b-primary flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {logo ? (
                        <div className="w-8 h-8 rounded bg-white border border-gray-100 flex items-center justify-center p-1 overflow-hidden">
                          <img src={`http://localhost:5000${logo}`} alt={actualBankName} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-1.5 rounded-md">
                          <FaCreditCard className="text-primary text-sm" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {offer.discountType === 'amount' ? `₹${offer.discountValue} off` : `${offer.discountValue}% off`}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium line-clamp-1">{actualBankName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onApplyOffer(appliedOffer?._id === offer._id ? null : offer)}
                      className={`font-bold text-xs uppercase hover:underline cursor-pointer ${appliedOffer?._id === offer._id ? 'text-green-600' : 'text-primary'
                        }`}
                    >
                      {appliedOffer?._id === offer._id ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {offer.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-snug">
                      {offer.description}
                    </p>
                  )}
                  {offer.minTransactionAmount > 0 && (
                     <p className="text-[10px] text-gray-500 mt-1">
                       On orders of ₹{offer.minTransactionAmount} and above
                     </p>
                  )}
                </div>
                {offer.cardType && (
                  <div className="mt-2 text-[10px] text-gray-400 font-medium flex items-center justify-between border-t border-gray-100 pt-2">
                    <span>{offer.cardType}</span>
                    <FaChevronRight />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BankOffers;

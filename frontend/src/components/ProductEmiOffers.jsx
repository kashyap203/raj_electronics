import { useState } from 'react';
import { FaCreditCard, FaChevronRight, FaTimes, FaTag } from 'react-icons/fa';
import { formatPrice } from '../utils/helpers';

const ProductEmiOffers = ({ offers }) => {
  const [showModal, setShowModal] = useState(false);

  if (!offers || offers.length === 0) return null;

  // Find "Best Value" - usually No Cost EMI or lowest interest
  const bestOffer = offers.find(o => o.emiType === 'NO_COST' || o.discountValue > 0) || offers[0];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
          <FaCreditCard className="text-primary" /> EMI Offers
        </h4>
        <button 
          onClick={() => setShowModal(true)} 
          className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
        >
          View all EMI plans <FaChevronRight size={10} />
        </button>
      </div>

      {/* Horizontal scroll for cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {/* Render best offer first, then the rest */}
        {[bestOffer, ...offers.filter(o => o._id !== bestOffer._id)].map((offer, idx) => (
          <div key={`${offer._id}-${idx}`} className="min-w-[280px] snap-start border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
            {idx === 0 && (
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 text-center">
                Best value for you
              </div>
            )}
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-800">{offer.bankName}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{offer.cardType}</span>
              </div>
              
              <div className="text-primary font-extrabold text-lg flex items-center justify-between mt-2">
                <div>
                  ₹{offer.monthlyEMI.toLocaleString()}<span className="text-xs text-gray-500 font-medium">/mo ({offer.tenure}m)</span>
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold flex items-center gap-1 text-gray-700">
                  {offer.emiType === 'NO_COST' ? (
                    <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">No Cost EMI</span>
                  ) : (
                    <span>Regular EMI</span>
                  )}
                </p>
                {offer.totalDiscount > 0 && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <FaTag size={10} /> Extra ₹{offer.totalDiscount.toLocaleString()} off
                  </p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="w-full bg-gray-50 border-t border-gray-100 text-primary font-bold text-xs py-2.5 hover:bg-gray-100 transition flex items-center justify-center gap-1"
            >
              View Plan Details <FaChevronRight size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal View All */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h2 className="font-bold text-lg text-gray-800">All EMI Plans</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
              {offers.map(offer => (
                <div key={offer._id} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        {offer.bankName}
                        <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{offer.cardType}</span>
                      </h4>
                    </div>
                    {offer.emiType === 'NO_COST' && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">NO COST EMI</span>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Tenure</p>
                        <p className="font-bold">{offer.tenure} Months</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Monthly EMI</p>
                        <p className="font-bold text-primary">₹{offer.monthlyEMI.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Interest</p>
                        <p className="font-semibold text-gray-800">
                          {offer.totalInterest > 0 ? `₹${offer.totalInterest.toLocaleString()}` : '₹0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Final Payable</p>
                        <p className="font-bold text-gray-900">₹{offer.finalPayable.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {(offer.totalDiscount > 0 || offer.processingFee > 0) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-xs">
                        {offer.totalDiscount > 0 && (
                          <div className="text-green-600 font-medium">
                            Includes discount of ₹{offer.totalDiscount.toLocaleString()}
                          </div>
                        )}
                        {offer.processingFee > 0 && (
                          <div className="text-gray-500">
                            + ₹{offer.processingFee} processing fee
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEmiOffers;

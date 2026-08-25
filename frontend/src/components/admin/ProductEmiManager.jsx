import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCreditCard, FaTimes, FaSave } from 'react-icons/fa';
import { productEmiService, offerService } from '../../services';
import { Loader, Alert } from '../common';

const ProductEmiManager = ({ productId }) => {
  const [offers, setOffers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffer, setNewOffer] = useState(getInitialOffer());
  const [saving, setSaving] = useState(false);

  function getInitialOffer() {
    return {
      bankName: '',
      logo: '',
      cardType: 'CREDIT',
      emiType: 'REGULAR',
      tenure: 6,
      interestRate: 0,
      processingFee: 0,
      discountType: 'none',
      discountValue: 0,
      maxDiscount: 0,
      minOrderAmount: 3000,
      maxOrderAmount: 500000,
      active: true
    };
  }

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offersRes, offersApiRes] = await Promise.all([
        productEmiService.getByProduct(productId),
        offerService.getAll()
      ]);
      setOffers(offersRes.data);
      
      // Extract unique banks from Bank Offers
      const uniqueBanks = [];
      const seen = new Set();
      offersApiRes.data.forEach(offer => {
        if (!seen.has(offer.bankName)) {
          seen.add(offer.bankName);
          uniqueBanks.push({ bankName: offer.bankName, logo: offer.logo });
        }
      });
      setBanks(uniqueBanks);
    } catch (err) {
      setError('Failed to load EMI offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to remove this EMI offer?')) return;
    try {
      await productEmiService.delete(offerId);
      setOffers(offers.filter(o => o._id !== offerId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete offer');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await productEmiService.create(productId, newOffer);
      // Re-fetch to get populated bank info
      fetchData();
      setShowAddForm(false);
      setNewOffer(getInitialOffer());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add EMI offer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaCreditCard className="text-primary" /> Product EMI Offers
        </h3>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-primary hover:text-primary-dark font-semibold text-sm flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition"
          >
            <FaPlus size={12} /> Add EMI Offer
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Existing Offers List */}
      {!showAddForm && (
        <div className="space-y-3">
          {offers.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-300">
              No EMI offers configured for this product.
            </p>
          ) : (
            offers.map(offer => (
              <div key={offer._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{offer.bankName}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">{offer.cardType}</span>
                    {offer.emiType === 'NO_COST' && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">No Cost</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 flex gap-4">
                    <span>Tenure: <strong className="text-gray-800">{offer.tenure} Months</strong></span>
                    <span>Interest: <strong className="text-gray-800">{offer.interestRate}%</strong></span>
                    {offer.discountType !== 'none' && (
                      <span className="text-green-600 font-semibold">
                        Discount: {offer.discountType === 'amount' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(offer._id)}
                  className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  title="Remove Offer"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add New Offer Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative mt-4">
          <button 
            type="button"
            onClick={() => setShowAddForm(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
          <h4 className="font-bold text-gray-800 mb-4">Add New EMI Offer</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bank*</label>
              <select required value={newOffer.bankName} onChange={e => {
                  const selectedBank = banks.find(b => b.bankName === e.target.value);
                  setNewOffer({...newOffer, bankName: e.target.value, logo: selectedBank ? selectedBank.logo : ''});
                }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary">
                <option value="">Select Bank</option>
                {banks.map((b, idx) => (
                  <option key={idx} value={b.bankName}>{b.bankName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Card Type</label>
              <select value={newOffer.cardType} onChange={e => setNewOffer({...newOffer, cardType: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary">
                <option value="CREDIT">Credit Card</option>
                <option value="DEBIT">Debit Card</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">EMI Type</label>
              <select value={newOffer.emiType} onChange={e => setNewOffer({...newOffer, emiType: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary">
                <option value="REGULAR">Regular EMI</option>
                <option value="NO_COST">No Cost EMI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tenure (Months)*</label>
              <input type="number" required value={newOffer.tenure} onChange={e => setNewOffer({...newOffer, tenure: Number(e.target.value)})} min="2" max="60" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Interest Rate (%)*</label>
              <input type="number" required value={newOffer.interestRate} onChange={e => setNewOffer({...newOffer, interestRate: Number(e.target.value)})} step="0.1" min="0" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Processing Fee (₹)</label>
              <input type="number" value={newOffer.processingFee} onChange={e => setNewOffer({...newOffer, processingFee: Number(e.target.value)})} min="0" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Type</label>
              <select value={newOffer.discountType} onChange={e => setNewOffer({...newOffer, discountType: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary">
                <option value="none">No Discount</option>
                <option value="amount">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Value</label>
              <input type="number" value={newOffer.discountValue} onChange={e => setNewOffer({...newOffer, discountValue: Number(e.target.value)})} disabled={newOffer.discountType === 'none'} min="0" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary disabled:bg-gray-100" />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-semibold">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                <FaSave /> {saving ? 'Saving...' : 'Save EMI Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEmiManager;

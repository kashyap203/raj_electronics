import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCreditCard, FaTimes, FaSave, FaEdit } from 'react-icons/fa';
import { productEmiService, offerService } from '../../services';
import api from '../../services/api';
import { Loader, Alert } from '../common';

const PREDEFINED_TENURES = [3, 6, 9, 12];

const ProductEmiManager = ({ productId }) => {
  const [offers, setOffers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formState, setFormState] = useState(getInitialFormState());

  function getInitialFormState() {
    return {
      bankName: '',
      logo: '',
      cardType: 'CREDIT',
      tenureConfigs: {}
    };
  }

  function getInitialTenureConfig() {
    return {
      interestRate: 0,
      emiType: 'REGULAR',
      processingFee: 0,
      discountType: 'none',
      discountValue: 0,
      maxDiscount: 0,
      minOrderAmount: 3000,
      maxOrderAmount: 500000,
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

  const groupedOffers = offers.reduce((acc, offer) => {
    if (!acc[offer.bankName]) {
      acc[offer.bankName] = [];
    }
    acc[offer.bankName].push(offer);
    return acc;
  }, {});

  const handleEditBank = (bankName) => {
    const bankOffers = groupedOffers[bankName] || [];
    if (bankOffers.length === 0) return;

    const tConfigs = {};
    bankOffers.forEach(o => {
      tConfigs[o.tenure] = {
        interestRate: o.interestRate,
        emiType: o.emiType,
        processingFee: o.processingFee,
        discountType: o.discountType,
        discountValue: o.discountValue,
        maxDiscount: o.maxDiscount,
        minOrderAmount: o.minOrderAmount,
        maxOrderAmount: o.maxOrderAmount,
      };
    });

    setFormState({
      bankName: bankName,
      logo: bankOffers[0].logo || '',
      cardType: bankOffers[0].cardType || 'CREDIT',
      tenureConfigs: tConfigs
    });
    setIsFormOpen(true);
  };

  const handleRemoveBank = async (bankName) => {
    if (!window.confirm(`Are you sure you want to completely remove ${bankName} EMI?`)) return;
    try {
      await productEmiService.deleteByBank(productId, bankName);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove bank offers');
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!formState.bankName) {
      setError("Please select a bank");
      return;
    }
    const tenures = Object.keys(formState.tenureConfigs);
    if (tenures.length === 0) {
      setError("Please select at least one tenure");
      return;
    }

    setSaving(true);
    setError('');

    try {
      const batchOffers = tenures.map(tenure => {
        const config = formState.tenureConfigs[tenure];
        return {
          bankName: formState.bankName,
          logo: formState.logo,
          cardType: formState.cardType,
          tenure: Number(tenure),
          active: true,
          ...config
        };
      });

      await productEmiService.createBatch(productId, {
        bankName: formState.bankName,
        offers: batchOffers
      });

      fetchData();
      setIsFormOpen(false);
      setFormState(getInitialFormState());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save EMI configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleTenure = (tenure) => {
    setFormState(prev => {
      const newConfigs = { ...prev.tenureConfigs };
      if (newConfigs[tenure]) {
        delete newConfigs[tenure];
      } else {
        newConfigs[tenure] = getInitialTenureConfig();
      }
      return { ...prev, tenureConfigs: newConfigs };
    });
  };

  const updateTenureConfig = (tenure, field, value) => {
    setFormState(prev => ({
      ...prev,
      tenureConfigs: {
        ...prev.tenureConfigs,
        [tenure]: {
          ...prev.tenureConfigs[tenure],
          [field]: value
        }
      }
    }));
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormState(prev => ({ ...prev, logo: data.url }));
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaCreditCard className="text-primary" /> Product EMI Offers
        </h3>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => {
              setFormState(getInitialFormState());
              setIsFormOpen(true);
            }}
            className="text-primary hover:text-primary-dark font-semibold text-sm flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition"
          >
            <FaPlus size={12} /> Add EMI Offer
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Existing Grouped Banks List */}
      {!isFormOpen && (
        <div className="space-y-4">
          {Object.keys(groupedOffers).length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-300">
              No EMI offers configured for this product.
            </p>
          ) : (
            Object.entries(groupedOffers).map(([bankName, bankOffers]) => {
              const sortedOffers = [...bankOffers].sort((a, b) => a.tenure - b.tenure);
              const cardType = sortedOffers[0]?.cardType || 'CREDIT';

              return (
                <div key={bankName} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-gray-800">{bankName}</h4>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">{cardType}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditBank(bankName)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 hover:bg-blue-100 rounded transition text-sm flex items-center gap-1"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBank(bankName)}
                        className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded transition text-sm flex items-center gap-1"
                      >
                        <FaTrash size={12} /> Remove Bank
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {sortedOffers.map(o => (
                      <div key={o._id} className="px-4 py-2.5 flex justify-between items-center hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4 w-1/3">
                          <span className="font-bold text-gray-700">{o.tenure} Months</span>
                          {o.emiType === 'NO_COST' && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">No Cost EMI</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 w-1/3 text-center">
                          Interest: <strong className="text-gray-800">{o.interestRate}%</strong>
                        </div>
                        <div className="text-sm text-gray-600 w-1/3 text-right">
                          Fee: <strong className="text-gray-800">₹{o.processingFee}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Grouped Add/Edit Form */}
      {isFormOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative mt-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
          <h4 className="font-bold text-gray-800 mb-4">
            {formState.bankName && Object.keys(groupedOffers).includes(formState.bankName) ? `Edit ${formState.bankName} Configuration` : 'Add New Bank EMI'}
          </h4>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Name*</label>
                <input
                  required
                  list="bank-list"
                  value={formState.bankName}
                  onChange={e => {
                    const selectedBank = banks.find(b => b.bankName === e.target.value);
                    setFormState({
                      ...formState,
                      bankName: e.target.value,
                      logo: (selectedBank && selectedBank.logo) ? selectedBank.logo : formState.logo
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
                  disabled={Object.keys(groupedOffers).includes(formState.bankName)}
                  placeholder="e.g. HDFC Bank"
                />
                <datalist id="bank-list">
                  {banks.map((b, idx) => (
                    <option key={idx} value={b.bankName} />
                  ))}
                </datalist>
                {!formState.bankName && <p className="text-[10px] text-gray-500 mt-1">Type a new bank or select existing.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Logo (Upload or URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formState.logo}
                    onChange={e => setFormState({ ...formState, logo: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
                    placeholder="URL or Upload ->"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                    <button type="button" disabled={uploadingLogo} className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 transition whitespace-nowrap">
                      {uploadingLogo ? '...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Card Type</label>
                <select
                  value={formState.cardType}
                  onChange={e => setFormState({ ...formState, cardType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
                >
                  <option value="CREDIT">Credit Card</option>
                  <option value="DEBIT">Debit Card</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
            </div>

            {formState.bankName && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Select Available Tenures</label>
                <div className="flex flex-wrap gap-3">
                  {PREDEFINED_TENURES.map(tenure => {
                    const isSelected = !!formState.tenureConfigs[tenure];
                    return (
                      <label key={tenure} className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTenure(tenure)}
                          className="accent-primary w-4 h-4"
                        />
                        <span className="font-semibold">{tenure} Months</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {formState.bankName && Object.keys(formState.tenureConfigs).length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 mb-2">Tenure Configurations</label>

                {PREDEFINED_TENURES.filter(t => !!formState.tenureConfigs[t]).map(tenure => {
                  const config = formState.tenureConfigs[tenure];
                  return (
                    <div key={tenure} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                        <span>{tenure} Months Plan</span>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.emiType === 'NO_COST'}
                            onChange={e => updateTenureConfig(tenure, 'emiType', e.target.checked ? 'NO_COST' : 'REGULAR')}
                            className="accent-green-500 w-4 h-4"
                          />
                          <span className={config.emiType === 'NO_COST' ? 'text-green-600' : 'text-gray-500'}>No Cost EMI</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Interest Rate (%)*</label>
                          <input
                            type="number" required step="0.1" min="0"
                            value={config.interestRate}
                            onChange={e => updateTenureConfig(tenure, 'interestRate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Processing Fee (₹)</label>
                          <input
                            type="number" min="0"
                            value={config.processingFee}
                            onChange={e => updateTenureConfig(tenure, 'processingFee', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Min Order (₹)</label>
                          <input
                            type="number" min="0"
                            value={config.minOrderAmount}
                            onChange={e => updateTenureConfig(tenure, 'minOrderAmount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Max Order (₹)</label>
                          <input
                            type="number" min="0"
                            value={config.maxOrderAmount}
                            onChange={e => updateTenureConfig(tenure, 'maxOrderAmount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-semibold">Cancel</button>
              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={saving || !formState.bankName || Object.keys(formState.tenureConfigs).length === 0}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"
              >
                <FaSave /> {saving ? 'Saving Group...' : 'Save EMI Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEmiManager;

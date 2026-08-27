import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getImageUrl } from '../../utils/helpers';

const BankSelection = ({ cartId, onSelectBank, onBack }) => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnlyNoCost, setShowOnlyNoCost] = useState(false);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const { data } = await api.get(`/emi/cart/${cartId}/eligible-banks`);
        setBanks(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load eligible banks for this cart. Please try again.');
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const filteredBanks = showOnlyNoCost
    ? banks.filter((b) => b.hasNoCostEmi) // Assumes API can be updated or we map it
    : banks;

  if (loading) return <div className="p-4 text-center">Loading supported banks...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

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

      <div className="flex items-center justify-between bg-primary/10 p-4 rounded-lg mb-6 border border-primary/20">
        <span className="text-primary-dark font-semibold">Show only 'No Cost EMI'</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={showOnlyNoCost}
            onChange={(e) => setShowOnlyNoCost(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      <div className="space-y-4">
        {filteredBanks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No banks available matching criteria.</p>
        ) : (
          filteredBanks.map((bank) => (
            <div
              key={bank._id}
              onClick={() => onSelectBank(bank)}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-50 rounded border border-gray-100 flex items-center justify-center overflow-hidden">
                  {bank.logo ? (
                    <img src={getImageUrl(bank.logo)} alt={bank.bankName} className="object-contain w-full h-full p-1" />
                  ) : (
                    <span className="text-gray-400 font-bold">{bank.bankName.substring(0, 2)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{bank.bankName}</h3>
                  {bank.hasNoCostEmi && ( // Optional check
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold tracking-wide uppercase text-[10px] rounded-full">
                      No Cost EMI Available
                    </span>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BankSelection;

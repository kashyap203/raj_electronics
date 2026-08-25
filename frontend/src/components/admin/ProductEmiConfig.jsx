import React from 'react';
import { FaCreditCard } from 'react-icons/fa';

const ProductEmiConfig = ({ emiConfig, onChange }) => {
  if (!emiConfig) return null;

  const handleTenureChange = (tenure) => {
    const tenures = emiConfig.availableTenures || [];
    if (tenures.includes(tenure)) {
      onChange({ ...emiConfig, availableTenures: tenures.filter(t => t !== tenure) });
    } else {
      onChange({ ...emiConfig, availableTenures: [...tenures, tenure].sort((a, b) => a - b) });
    }
  };

  const standardTenures = [3, 6, 9, 12, 18, 24];

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <FaCreditCard className="text-primary" />
        <h4 className="font-bold text-gray-800">Base EMI Configuration</h4>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={emiConfig.enableEmi}
            onChange={e => onChange({ ...emiConfig, enableEmi: e.target.checked })}
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm font-semibold text-gray-700">Enable EMI for this product</span>
        </label>
      </div>

      {emiConfig.enableEmi && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-2">Available EMI Tenures (Months)</label>
            <div className="flex flex-wrap gap-3">
              {standardTenures.map(tenure => (
                <label key={tenure} className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    checked={emiConfig.availableTenures?.includes(tenure)}
                    onChange={() => handleTenureChange(tenure)}
                    className="w-3.5 h-3.5 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">{tenure} M</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Base Interest Rate (% p.a.)*</label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={emiConfig.baseInterestRate}
              onChange={e => onChange({ ...emiConfig, baseInterestRate: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
            />
            <p className="text-[10px] text-gray-500 mt-1">Applied if no No-Cost EMI bank offer exists.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Processing Fee (₹)</label>
            <input
              type="number"
              min="0"
              value={emiConfig.processingFee}
              onChange={e => onChange({ ...emiConfig, processingFee: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Order Amount for EMI (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={emiConfig.minEmiAmount}
              onChange={e => onChange({ ...emiConfig, minEmiAmount: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEmiConfig;

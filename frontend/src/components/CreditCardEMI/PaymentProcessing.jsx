import React, { useEffect } from 'react';

const PaymentProcessing = ({ isProcessing, status, message }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg p-8 text-center border border-gray-100 shadow-sm">
      {isProcessing ? (
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h3 className="text-lg font-bold text-gray-800">Processing Payment</h3>
          <p className="text-gray-500 mt-2 text-sm">Please do not refresh or close this window.</p>
        </div>
      ) : status === 'success' ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Payment Successful!</h3>
          <p className="text-gray-500 mt-2 text-sm">{message || 'Your EMI order has been confirmed.'}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Payment Failed</h3>
          <p className="text-red-500 mt-2 text-sm">{message || 'An error occurred during payment processing.'}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessing;

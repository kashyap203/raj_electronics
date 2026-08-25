import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';
import { paymentService } from '../../services';

const OTPCaptureModal = ({ isOpen, onClose, onVerifySuccess, generateOTPURI, verifyOTPURI, authorizeURI, tranCtx, merchantTxnNo }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    if (isOpen && generateOTPURI) {
      handleGenerateOTP();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const handleGenerateOTP = async () => {
    if (resendCount >= 3) {
      setError("Maximum resend limit reached.");
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await paymentService.generateOTP(generateOTPURI, tranCtx);
      setResendCount(c => c + 1);
      setError('');
    } catch (err) {
      setError("Failed to generate OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Step 1: Verify OTP
      const verifyRes = await paymentService.verifyOTP(verifyOTPURI, tranCtx, otp);
      if (verifyRes.data?.responseCode !== '0000') {
         setError(verifyRes.data?.respDescription || "Invalid OTP");
         setLoading(false);
         return;
      }
      
      // Step 2: Authorize
      const authRes = await paymentService.authorizePayment(authorizeURI, tranCtx);
      if (authRes.data?.success) {
         setSuccessMessage("Payment Successful! Redirecting...");
         setTimeout(() => {
           onVerifySuccess(authRes.data);
         }, 1500);
      } else {
         setError(authRes.data?.response?.respDescription || "Authorization failed.");
         setLoading(false);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} disabled={loading || successMessage} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 disabled:opacity-50">
          <FaTimes size={20} />
        </button>
        
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${successMessage ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            <FaShieldAlt size={24} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{successMessage ? 'Success!' : 'Verify Payment'}</h3>
          {!successMessage && (
            <p className="text-sm text-gray-500 text-center mb-6">
              We've sent a secure OTP to your registered mobile number for transaction <span className="font-mono text-xs">{merchantTxnNo}</span>
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">
              {error}
            </div>
          )}
          
          {successMessage && (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl font-medium text-center flex flex-col items-center gap-2">
               <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
               {successMessage}
             </div>
          )}

          {!successMessage && (
            <form onSubmit={handleVerify}>
              <div className="mb-6">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 4 or 6 digit OTP"
                  className="w-full text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-primary hover:bg-primary-dark text-dark font-bold py-3 rounded-xl transition disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                ) : 'Verify & Pay'}
              </button>
            </form>
          )}

          {!successMessage && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleGenerateOTP}
                disabled={loading || resendCount >= 3}
                className="text-sm text-blue-600 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                Resend OTP {resendCount > 0 ? `(${3 - resendCount} left)` : ''}
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Secure Payment powered by ICICI Bank
        </div>
      </div>
    </div>
  );
};

export default OTPCaptureModal;

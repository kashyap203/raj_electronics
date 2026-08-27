import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const OTPVerification = ({ initData, onSuccess, onFailure }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [resendCount, setResendCount] = useState(0);

  // Generate OTP on mount or resend
  const triggerGenerateOTP = async () => {
    try {
      setLoading(true);
      setError('');
      await api.get('/payment/icici/otp/generate', {
        params: {
          generateOTPURI: initData.generateOTPURI,
          tranCtx: initData.tranCtx
        }
      });
      setTimeLeft(120);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate OTP. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerGenerateOTP();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      return setError('Please enter a valid OTP.');
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Verify OTP
      const verifyRes = await api.post('/payment/icici/otp/verify', {
        verifyOTPURI: initData.verifyOTPURI,
        tranCtx: initData.tranCtx,
        otp
      });

      if (verifyRes.data.responseCode !== '0000') {
        setLoading(false);
        return setError(verifyRes.data.respDescription || 'Invalid OTP.');
      }

      // 2. Authorize
      const authRes = await api.post('/payment/icici/authorize', {
        authorizeURI: initData.authorizeURI,
        tranCtx: initData.tranCtx
      });

      if (authRes.data.success && (authRes.data.paymentStatus === 'PAID' || authRes.data.paymentStatus === 'SUCCESS')) {
        onSuccess(authRes.data);
      } else {
        onFailure(authRes.data.response?.respDescription || 'Authorization failed.');
      }

    } catch (err) {
      setError('Payment verification failed.');
      setLoading(false);
    }
  };

  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg p-6 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Payment</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Please enter the OTP sent to your registered mobile number by your bank to authorize this transaction.
      </p>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}

      <form onSubmit={handleVerify}>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter OTP"
          className="w-full text-center tracking-widest text-2xl px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 mb-4 font-mono"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || otp.length < 4}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            loading || otp.length < 4 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Verifying...' : 'Submit OTP'}
        </button>
      </form>

      <div className="mt-6 text-sm">
        {timeLeft > 0 ? (
          <p className="text-gray-500">Resend OTP in <span className="font-medium text-gray-800">{formatTime()}</span></p>
        ) : (
          <button
            onClick={() => {
              if (resendCount < 3) {
                setResendCount(c => c + 1);
                triggerGenerateOTP();
              }
            }}
            disabled={resendCount >= 3 || loading}
            className="text-blue-600 font-medium hover:underline disabled:text-gray-400"
          >
            {resendCount >= 3 ? 'Maximum resend attempts reached' : 'Resend OTP'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OTPVerification;

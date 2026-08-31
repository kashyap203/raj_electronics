import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock, FaSpinner } from 'react-icons/fa';
import { paymentService } from '../services';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment') || 'pending';
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');
  const [verifying, setVerifying] = useState(paymentStatus === 'pending');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (orderId && (paymentStatus === 'pending' || paymentStatus === 'success')) {
      paymentService
        .checkPineLabsStatus(orderId)
        .then((res) => {
          setVerified(res.data?.success === true);
          setVerifying(false);
        })
        .catch(() => setVerifying(false));
    } else {
      setVerifying(false);
    }
  }, [orderId, paymentStatus]);

  const config = {
    success: {
      icon: FaCheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      title: 'Payment Successful',
      subtitle: verified || paymentStatus === 'success'
        ? 'Your payment has been verified. Order confirmed.'
        : 'Payment is being verified...',
    },
    failed: {
      icon: FaTimesCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      title: 'Payment Failed',
      subtitle: error
        ? 'Payment could not be completed. Please try again.'
        : 'Your payment was not successful. You can retry from My Orders.',
    },
    pending: {
      icon: FaClock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      title: 'Payment is being verified',
      subtitle: 'Please wait while we confirm your payment with the bank.',
    },
  };

  const current = config[paymentStatus] || config.pending;
  const Icon = current.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className={`max-w-md w-full rounded-2xl shadow-sm p-8 text-center ${current.bg}`}>
        {verifying ? (
          <FaSpinner className="mx-auto text-4xl text-primary animate-spin mb-4" />
        ) : (
          <Icon className={`mx-auto text-5xl mb-4 ${current.color}`} />
        )}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{current.title}</h1>
        <p className="text-gray-600 mb-6">{current.subtitle}</p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Order ID: <span className="font-mono">{orderId.slice(-8).toUpperCase()}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          {orderId && (
            <Link
              to={`/profile/orders/${orderId}`}
              className="bg-primary hover:bg-primary-dark text-dark font-bold py-3 rounded-xl transition"
            >
              View Order
            </Link>
          )}
          <Link
            to="/profile/orders"
            className="text-sm text-gray-600 hover:text-primary transition"
          >
            Go to My Orders
          </Link>
          {paymentStatus === 'failed' && (
            <Link
              to="/checkout"
              className="text-sm text-primary font-semibold hover:underline"
            >
              Return to Checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;

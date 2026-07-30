import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FaShoppingBag, FaMapMarkerAlt, FaCreditCard, FaCheckCircle, FaFileInvoice } from 'react-icons/fa';
import { orderService } from '../services';
import { Loader, Alert, Breadcrumb } from '../components/common';
import { formatPrice, getImageUrl } from '../utils/helpers';

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped: "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];

const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const justPlaced = location.state?.success;

  useEffect(() => {
    orderService
      .getById(id)
      .then((r) => setOrder(r.data))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try {
      const { data } = await orderService.cancel(id);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loader />;
  if (!order)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Order not found
      </div>
    );

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Home", link: "/" },
          { label: "My Orders", link: "/profile/orders" },
          { label: `Order #${order._id.slice(-8).toUpperCase()}` },
        ]}
      />

      {justPlaced && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <FaCheckCircle className="text-green-500 text-xl shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              Order placed successfully!
            </p>
            <p className="text-sm text-green-600">
              Thank you for shopping with Raj Electronics.
            </p>
          </div>
        </div>
      )}

      <Alert message={error} type="error" onClose={() => setError("")} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to={`/profile/orders/${order._id}/invoice`} 
            target="_blank" 
            className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-full transition shadow-sm"
          >
            <FaFileInvoice className="text-gray-500" />
            Download Invoice
          </Link>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statusColors[order.status]}`}>
            {order.status}
          </span>
          {['Pending', 'Processing'].includes(order.status) && (
            <button onClick={handleCancel} disabled={cancelling} className="text-sm text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-3 py-1.5 rounded-full transition">
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Progress tracker */}
      {order.status !== "Cancelled" && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all"
              style={{
                width:
                  currentStep >= 0
                    ? `${(currentStep / (statusSteps.length - 1)) * 100}%`
                    : "0%",
              }}
            />
            {statusSteps.map((step, i) => (
              <div
                key={step}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                    i <= currentStep
                      ? "bg-primary border-primary text-dark"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium hidden sm:block ${i <= currentStep ? "text-primary" : "text-gray-400"}`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaShoppingBag className="text-primary" /> Items Ordered
            </h2>
            <div className="space-y-4">
              {order.products.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-xl shrink-0 overflow-hidden">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                    {item.discount > 0 && (
                      <p className="text-xs text-green-600">
                        {item.discount}% off applied
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-sm shrink-0">
                    {formatPrice(
                      Math.round(
                        item.price - (item.price * item.discount) / 100,
                      ) * item.quantity,
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.itemsPrice)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({order.couponCode})</span>
                  <span>-{formatPrice(order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span
                  className={order.shippingPrice === 0 ? "text-green-600" : ""}
                >
                  {order.shippingPrice === 0
                    ? "FREE"
                    : formatPrice(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary" size={14} /> Delivery
              Address
            </h3>
            {order.address && (
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">
                  {order.address.fullName}
                </p>
                <p>{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.state}
                </p>
                <p>Pincode: {order.address.pincode}</p>
                <p>{order.address.phone}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FaCreditCard className="text-primary" size={14} /> Payment
            </h3>
            <p className="text-sm text-gray-600">{order.paymentMethod}</p>
            <p
              className={`text-sm font-medium mt-1 ${order.isPaid ? "text-green-600" : "text-yellow-600"}`}
            >
              {order.isPaid
                ? `✓ Paid on ${new Date(order.paidAt).toLocaleDateString("en-IN")}`
                : "● Payment Pending"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

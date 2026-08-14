import { useEffect, useState } from 'react';
import { FaFilter } from 'react-icons/fa';
import { orderService } from '../../services';
import { Loader, Alert } from '../../components/common';
import { formatPrice, getImageUrl } from '../../utils/helpers';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const OrdersAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const { data } = await orderService.getAll(params);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const { data } = await orderService.updateStatus(orderId, status);
      setOrders(o => o.map(ord => ord._id === orderId ? data : ord));
      setSuccess(`Order status updated to ${status}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Orders</h1>
        <div className="flex items-center gap-2">
          <FaFilter size={12} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {loading ? <Loader /> : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">No orders found</div>
          ) : orders.map(order => (
            <div key={order._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Order Header */}
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpanded(e => e === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-4">
                  {/* Product thumbs */}
                  <div className="flex -space-x-2">
                    {order.products.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-50 overflow-hidden">
                        <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-contain p-0.5" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">
                      {order.user?.name || 'Guest'} · {order.user?.email} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-gray-800">{formatPrice(order.total)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                  <select
                    value={order.status}
                    onChange={e => { e.stopPropagation(); handleStatusChange(order._id, e.target.value); }}
                    disabled={updatingId === order._id}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary outline-none"
                    onClick={e => e.stopPropagation()}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === order._id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm">Items</h3>
                      <div className="space-y-3">
                        {order.products.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0">
                              <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain p-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                              <p className="text-xs text-gray-500 mb-1">Qty: {item.quantity} · {formatPrice(item.price)}</p>
                              {item.serialNumber && !item.serialNumbers && (
                                <p className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded inline-block border border-gray-200 mt-1">
                                  SN: {item.serialNumber.serialNumber}
                                </p>
                              )}
                              {item.serialNumbers && item.serialNumbers.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-1">
                                  {item.serialNumbers.map(sn => (
                                    <span key={sn._id} className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                      SN: {sn.serialNumber}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.appliedCreditCardOffer && (
                                <p className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block border border-green-100 mt-1 ml-2">
                                  {item.appliedCreditCardOffer.bankName} Offer (-{formatPrice(item.creditCardDiscountAmount)})
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-1 text-sm">Delivery Address</h3>
                        {order.address && (
                          <p className="text-xs text-gray-500">
                            {order.address.fullName}, {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}. Ph: {order.address.phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-1 text-sm">Payment</h3>
                        <p className="text-xs text-gray-500">{order.paymentMethod} · {order.isPaid ? '✓ Paid' : '● Pending'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-1 text-sm">Summary</h3>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex justify-between"><span>Subtotal:</span> <span>{formatPrice(order.itemsPrice)}</span></p>
                          <p className="flex justify-between"><span>Shipping:</span> <span>{order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}</span></p>
                          {order.creditCardDiscountAmount > 0 && (
                            <p className="flex justify-between text-green-600"><span>Bank Offer Discount:</span> <span>-{formatPrice(order.creditCardDiscountAmount)}</span></p>
                          )}
                          <p className="flex justify-between font-bold text-gray-800 border-t pt-1 mt-1"><span>Total:</span> <span>{formatPrice(order.total)}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersAdminPage;

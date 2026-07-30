import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaChevronRight, FaSearch, FaFilter, FaCircle } from 'react-icons/fa';
import { orderService } from '../services';
import { Loader, EmptyState } from '../components/common';
import { formatPrice, getImageUrl } from '../utils/helpers';

const statusColors = {
  Pending: 'text-yellow-500',
  Processing: 'text-blue-500',
  Shipped: 'text-purple-500',
  Delivered: 'text-green-500',
  Cancelled: 'text-red-500',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    orderService.getMyOrders()
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by status
      if (statusFilter.length > 0 && !statusFilter.includes(order.status)) {
        return false;
      }
      // Filter by search term (order id or product name)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchId = order._id.toLowerCase().includes(term);
        const matchProduct = order.products.some(p => p.name.toLowerCase().includes(term));
        if (!matchId && !matchProduct) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  if (loading) return <Loader />;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/profile" className="hover:text-primary transition">My Account</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">My Orders</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar: Filters */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white p-5 rounded-sm shadow-sm sticky top-24">
              <h2 className="font-semibold text-lg border-b pb-3 mb-4 flex items-center gap-2">
                <FaFilter className="text-gray-400 text-sm" /> Filters
              </h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-xs text-gray-500 mb-3 uppercase tracking-wider">Order Status</h3>
                <div className="space-y-3">
                  {['On the way', 'Delivered', 'Cancelled', 'Returned'].map(statusLabel => {
                    let dbStatuses = [];
                    if (statusLabel === 'On the way') dbStatuses = ['Pending', 'Processing', 'Shipped'];
                    else if (statusLabel === 'Delivered') dbStatuses = ['Delivered'];
                    else if (statusLabel === 'Cancelled') dbStatuses = ['Cancelled'];
                    
                    const isChecked = dbStatuses.some(s => statusFilter.includes(s));
                    
                    const toggleStatus = () => {
                      if (isChecked) {
                        setStatusFilter(prev => prev.filter(s => !dbStatuses.includes(s)));
                      } else {
                        setStatusFilter(prev => [...prev, ...dbStatuses.filter(s => !prev.includes(s))]);
                      }
                    };

                    return (
                      <label key={statusLabel} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={toggleStatus}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">{statusLabel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content: Orders List */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="bg-white p-2 rounded-sm shadow-sm mb-4 flex items-center">
              <div className="relative flex-1 flex">
                <input 
                  type="text" 
                  placeholder="Search your orders here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-0 pl-4 pr-10 py-2.5 text-sm focus:outline-none transition"
                />
                <button className="px-6 bg-primary text-white font-medium text-sm rounded-sm hover:bg-primary-dark transition flex items-center justify-center gap-2">
                  <FaSearch />
                  <span className="hidden sm:inline">Search Orders</span>
                </button>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-sm shadow-sm p-12 text-center">
                <EmptyState
                  icon={FaShoppingBag}
                  title="No orders found"
                  description={orders.length === 0 ? "You haven't placed any orders yet." : "No orders match your filters."}
                  action={
                    orders.length === 0 && (
                      <Link to="/products" className="bg-primary text-white font-bold px-8 py-3 rounded-sm hover:bg-primary-dark transition inline-block mt-4">
                        Start Shopping
                      </Link>
                    )
                  }
                />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-sm shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
                    {/* Header for Order ID */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-xs text-gray-500">
                      <span>Order <span className="font-semibold text-gray-700">#{order._id.slice(-8).toUpperCase()}</span></span>
                    </div>

                    {/* Order items map */}
                    {order.products.map((item, index) => (
                      <Link
                        key={`${order._id}-${index}`}
                        to={`/profile/orders/${order._id}`}
                        className={`flex flex-col sm:flex-row p-4 gap-6 group cursor-pointer ${index !== order.products.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        {/* Image */}
                        <div className="w-24 h-24 sm:w-20 sm:h-20 shrink-0 bg-white border border-gray-100 rounded-sm overflow-hidden flex items-center justify-center mx-auto sm:mx-0">
                          <img src={getImageUrl(item.image)} alt={item.name} className="max-w-full max-h-full object-contain p-2" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
                          <h3 className="font-medium text-gray-800 text-sm hover:text-primary transition line-clamp-2 mb-1">{item.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">Qty: {item.quantity}</p>
                        </div>
                        
                        {/* Price */}
                        <div className="w-24 shrink-0 flex flex-col justify-center text-center sm:text-left">
                          <p className="font-bold text-gray-800 text-sm">
                            {formatPrice(Math.round(item.price - (item.price * item.discount) / 100) * item.quantity)}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="sm:w-64 shrink-0 flex flex-col justify-center items-center sm:items-start text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <FaCircle className={`text-[10px] ${statusColors[order.status]}`} />
                            <span className="font-semibold text-gray-800">{order.status}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {order.status === 'Delivered' 
                              ? `On ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` 
                              : `Ordered on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                          </p>
                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <p className="text-xs text-gray-500 mt-1">Your item is on the way</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;

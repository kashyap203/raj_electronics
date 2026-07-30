import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services';
import { formatPrice } from '../utils/helpers';
import logo from '../assets/logo.png'; // Using main logo

const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getById(id)
      .then(r => setOrder(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && order) {
      // Trigger print dialog automatically after a short delay to allow images to load
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, order]);

  if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
  if (!order) return <div className="p-10 text-center text-red-500">Order not found</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Hide this print button when actually printing */}
      <div className="print:hidden p-4 bg-gray-100 border-b flex justify-between items-center">
        <p className="text-gray-600 text-sm">A print dialog should open automatically. If not, click the print button.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/profile/orders/${id}`)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition">
            Go Back
          </button>
          <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-primary-dark transition">
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="max-w-4xl mx-auto p-8 bg-white text-black font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <div className="bg-dark p-3 rounded-lg inline-block mb-4" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <img src={logo} alt="Raj Electronics" className="h-12 object-contain" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Raj Electronics</h2>
            <p className="text-sm text-gray-600 mt-1">123 Market Street, Tech Hub</p>
            <p className="text-sm text-gray-600">Mumbai, Maharashtra 400001</p>
            <p className="text-sm text-gray-600">GSTIN: 27ABCDE1234F1Z5</p>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-black text-gray-800 tracking-widest uppercase mb-2">INVOICE</h1>
            <p className="text-sm font-semibold">Invoice No: <span className="font-normal text-gray-700">INV-{order._id.slice(-6).toUpperCase()}</span></p>
            <p className="text-sm font-semibold">Date: <span className="font-normal text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</span></p>
            <p className="text-sm font-semibold">Order ID: <span className="font-normal text-gray-700">{order._id.toUpperCase()}</span></p>
          </div>
        </div>

        {/* Billing & Shipping Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b pb-1">Billed To</h3>
            <p className="font-bold text-gray-800">{order.user?.name || order.address?.fullName || 'Customer'}</p>
            <p className="text-sm text-gray-600">{order.user?.email || 'N/A'}</p>
            <p className="text-sm text-gray-600">Phone: {order.user?.phone || order.address?.phone || ''}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b pb-1">Shipped To</h3>
            {order.address ? (
              <>
                <p className="font-bold text-gray-800">{order.address.fullName}</p>
                <p className="text-sm text-gray-600">{order.address.street}</p>
                <p className="text-sm text-gray-600">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                <p className="text-sm text-gray-600">Phone: {order.address.phone}</p>
              </>
            ) : (
              <p className="text-sm text-gray-600">No shipping address provided.</p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Item Description</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right w-24">Qty</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right w-32">Unit Price</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.products.map((item, index) => {
                const unitPrice = Math.round(item.price - item.price * item.discount / 100);
                const amount = unitPrice * item.quantity;
                return (
                  <tr key={index}>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      {item.discount > 0 && <p className="text-xs text-gray-500">Includes {item.discount}% discount</p>}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 text-right">{item.quantity}</td>
                    <td className="py-4 px-4 text-sm text-gray-700 text-right">{formatPrice(unitPrice)}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-800 text-right">{formatPrice(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2 max-w-sm">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Subtotal</td>
                  <td className="py-2 text-sm text-gray-800 text-right font-medium">{formatPrice(order.itemsPrice)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Shipping</td>
                  <td className="py-2 text-sm text-gray-800 text-right font-medium">{order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}</td>
                </tr>
                <tr className="border-t-2 border-gray-800">
                  <td className="py-3 text-base font-bold text-gray-800">Total Amount</td>
                  <td className="py-3 text-lg font-black text-gray-900 text-right">{formatPrice(order.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          <p className="font-semibold mb-1">Thank you for your business!</p>
          <p>Payment Method: {order.paymentMethod} &bull; Payment Status: {order.isPaid ? 'Paid' : 'Pending'}</p>
          <p className="mt-4">This is a computer-generated document and does not require a signature.</p>
        </div>

      </div>
    </div>
  );
};

export default InvoicePage;

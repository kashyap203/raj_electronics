import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { productService } from '../../services';
import { Loader, Alert } from '../../components/common';

const ProductSerialNumbers = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [adding, setAdding] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, snRes] = await Promise.all([
        productService.getById(id),
        productService.getSerialNumbers(id),
      ]);
      setProduct(prodRes.data);
      setSerialNumbers(snRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSerialNumber.trim()) return;

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      await productService.addSerialNumber(id, { 
        serialNumber: newSerialNumber.trim(),
        discount: newDiscount ? Number(newDiscount) : 0
      });
      setSuccess(`Added serial number: ${newSerialNumber}`);
      setNewSerialNumber('');
      setNewDiscount('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add serial number');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (snId, status) => {
    if (status === 'Sold') {
      alert('Cannot delete a sold serial number.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this serial number?')) return;

    try {
      await productService.deleteSerialNumber(id, snId);
      setSuccess('Serial number removed');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove serial number');
    }
  };

  const handleEditClick = (sn) => {
    setEditingId(sn._id);
    setEditSerialNumber(sn.serialNumber);
    setEditDiscount(sn.discount || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditSerialNumber('');
    setEditDiscount('');
  };

  const handleSaveEdit = async (snId) => {
    if (!editSerialNumber.trim()) return;
    
    setSavingEdit(true);
    setError('');
    setSuccess('');

    try {
      await productService.updateSerialNumber(id, snId, {
        serialNumber: editSerialNumber.trim(),
        discount: editDiscount ? Number(editDiscount) : 0
      });
      setSuccess('Serial number updated successfully');
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update serial number');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/products" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
          <FaArrowLeft className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Serial Numbers</h1>
          {product && <p className="text-gray-500 text-sm">Product: {product.name}</p>}
        </div>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">Add Serial Number</h2>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  required
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  placeholder="e.g. SN123456"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  placeholder="e.g. 10 (Optional)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={adding || !newSerialNumber.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-bold py-2 rounded-xl transition"
              >
                <FaPlus size={12} /> {adding ? 'Adding...' : 'Add SN'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Inventory ({serialNumbers.length})</h2>
              <span className="text-sm text-gray-500">
                Available: {serialNumbers.filter(s => s.status === 'Available').length} | 
                Reserved: {serialNumbers.filter(s => s.status === 'Reserved').length} | 
                Sold: {serialNumbers.filter(s => s.status === 'Sold').length}
              </span>
            </div>
            
            {serialNumbers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No serial numbers found for this product.
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Serial Number</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Discount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Added On</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {serialNumbers.map((sn) => (
                      <tr key={sn._id} className="hover:bg-gray-50">
                        {editingId === sn._id ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editSerialNumber}
                                onChange={(e) => setEditSerialNumber(e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none font-mono"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full 
                                ${sn.status === 'Available' ? 'bg-green-100 text-green-700' : 
                                  sn.status === 'Reserved' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-gray-200 text-gray-700'}`}>
                                {sn.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editDiscount}
                                onChange={(e) => setEditDiscount(e.target.value)}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {new Date(sn.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleSaveEdit(sn._id)}
                                  disabled={savingEdit || !editSerialNumber.trim()}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 transition"
                                  title="Save"
                                >
                                  <FaCheck size={14} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={savingEdit}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 transition"
                                  title="Cancel"
                                >
                                  <FaTimes size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-mono text-gray-800 font-medium">
                              {sn.serialNumber}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full 
                                ${sn.status === 'Available' ? 'bg-green-100 text-green-700' : 
                                  sn.status === 'Reserved' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-gray-200 text-gray-700'}`}>
                                {sn.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                              {sn.discount > 0 ? `${sn.discount}%` : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {new Date(sn.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleEditClick(sn)}
                                  disabled={sn.status === 'Sold'}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded disabled:opacity-30 transition"
                                  title={sn.status === 'Sold' ? 'Cannot edit sold item' : 'Edit'}
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(sn._id, sn.status)}
                                  disabled={sn.status === 'Sold'}
                                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded disabled:opacity-30 transition"
                                  title={sn.status === 'Sold' ? 'Cannot delete sold item' : 'Delete'}
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSerialNumbers;

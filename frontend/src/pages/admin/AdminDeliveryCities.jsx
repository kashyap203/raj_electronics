import { useEffect, useState } from 'react';
import { FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { deliveryCityService } from '../../services';
import { Loader, Alert } from '../../components/common';

const AdminDeliveryCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cityName, setCityName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCities = () => {
    setLoading(true);
    deliveryCityService.getAll()
      .then(r => setCities(r.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    fetchCities();
  }, []);

  const openCreate = () => { 
    setCityName(''); 
    setShowModal(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      await deliveryCityService.add({ cityName: cityName.trim() });
      setSuccess('City added to free delivery list!');
      setShowModal(false);
      fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add city');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this city from the free delivery list?')) return;
    try {
      await deliveryCityService.delete(id);
      setSuccess('City removed successfully');
      fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete city');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Free Delivery Cities</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cities eligible for free delivery</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-dark font-bold px-4 py-2 rounded-xl transition">
          <FaPlus size={12} /> Add City
        </button>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {loading ? <Loader /> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cities.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No free delivery cities configured</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="py-3 px-6 font-medium">City Name</th>
                    <th className="py-3 px-6 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cities.map(city => (
                    <tr key={city._id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-6 font-medium">{city.cityName}</td>
                      <td className="py-3 px-6 text-right">
                        <button 
                          onClick={() => handleDelete(city._id)} 
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                          title="Remove from free delivery"
                        >
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-lg">Add Free Delivery City</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <Alert message={error} type="error" onClose={() => setError('')} />}
              <div>
                <label className="block text-sm font-medium mb-1">City Name*</label>
                <input 
                  required 
                  value={cityName} 
                  onChange={e => setCityName(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" 
                />
                <p className="text-xs text-gray-500 mt-1">Exact match required during checkout</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !cityName.trim()} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-60 text-dark font-bold py-2.5 rounded-xl transition">
                  {saving ? 'Saving...' : 'Add City'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-6 py-2.5 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryCities;

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTag, FaListOl } from 'react-icons/fa';
import { offerService, productService } from '../../services';
import { Alert, ConfirmDialog, Loader } from '../../components/common';

const OffersAdminPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState({
    bankName: '',
    logo: null,
    logoPreview: '',
    isActive: true,
  });

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data } = await offerService.getAll();
      setOffers(data);
    } catch (err) {
      setError('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCurrentOffer({ ...currentOffer, [e.target.name]: value });
  };

  const openAddModal = () => {
    setCurrentOffer({
      bankName: '',
      logo: null,
      logoPreview: '',
      isActive: true,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setCurrentOffer({
      ...offer,
      logoPreview: offer.logo ? `http://localhost:5000${offer.logo}` : '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('bankName', currentOffer.bankName);
      formData.append('isActive', currentOffer.isActive);
      if (currentOffer.logo) {
        formData.append('logo', currentOffer.logo);
      }

      if (isEditing) {
        await offerService.update(currentOffer._id, formData);
      } else {
        await offerService.create(formData);
      }
      setShowModal(false);
      fetchOffers();
    } catch (err) {
      setError(err.message || 'Error saving offer');
    }
  };

  const handleDelete = async () => {
    try {
      await offerService.delete(deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null });
      fetchOffers();
    } catch (err) {
      setError('Failed to delete offer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Bank Offers</h1>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
        >
          <FaPlus /> Add Offer
        </button>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                <th className="p-4 font-medium">Bank Logo</th>
                <th className="p-4 font-medium">Bank Name</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {offers.map(offer => (
                <tr key={offer._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    {offer.logo ? (
                      <img src={`http://localhost:5000${offer.logo}`} alt={offer.bankName} className="h-10 object-contain" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{offer.bankName}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => openEditModal(offer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => setDeleteDialog({ isOpen: true, id: offer._id })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No offers found. Add some to display on the product page.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2"><FaTag className="text-primary" /> {isEditing ? 'Edit Offer' : 'New Offer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input required type="text" name="bankName" value={currentOffer.bankName} onChange={handleInputChange} placeholder="e.g. HDFC Bank" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Logo (Image)</label>
                <input type="file" name="logo" accept="image/*" onChange={(e) => setCurrentOffer(prev => ({ ...prev, logo: e.target.files[0] }))} className="w-full border border-gray-300 rounded-xl px-4 py-2 outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {currentOffer.logoPreview && (
                  <img src={currentOffer.logoPreview} alt="Logo Preview" className="mt-2 h-10 object-contain rounded" />
                )}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" name="isActive" id="isActive" checked={currentOffer.isActive} onChange={handleInputChange} className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Active Offer</label>
              </div>
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition">Save Bank</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Offer"
        message="Are you sure you want to remove this bank offer? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
};

export default OffersAdminPage;

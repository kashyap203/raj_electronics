import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaImages } from 'react-icons/fa';
import { sliderService } from '../../services';
import { Alert, ConfirmDialog } from '../../components/common';
import { getImageUrl } from '../../utils/helpers.js';

const AdminSliders = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlider, setCurrentSlider] = useState({
    title: '',
    highlight: '',
    description: '',
    tag: '',
    tagIcon: 'FaFire',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    primaryBtnText: '',
    primaryBtnLink: '',
    secondaryBtnText: '',
    secondaryBtnLink: '',
    image: '',
    isActive: true,
    order: 0,
  });

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const { data } = await sliderService.getAdminAll();
      setSliders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch sliders');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCurrentSlider({ ...currentSlider, [e.target.name]: value });
  };

  const openAddModal = () => {
    setCurrentSlider({
      title: '',
      highlight: '',
      description: '',
      tag: '',
      tagIcon: 'FaFire',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      primaryBtnText: '',
      primaryBtnLink: '',
      secondaryBtnText: '',
      secondaryBtnLink: '',
      image: '',
      imageFile: null,
      imagePreview: '',
      isActive: true,
      order: 0,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (slider) => {
    setCurrentSlider(slider);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentSlider({
        ...currentSlider,
        imageFile: e.target.files[0],
        imagePreview: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(currentSlider).forEach(key => {
        if (key !== 'imageFile' && key !== 'imagePreview' && currentSlider[key] !== undefined && currentSlider[key] !== null) {
          formData.append(key, currentSlider[key]);
        }
      });
      if (currentSlider.imageFile) {
        formData.append('image', currentSlider.imageFile);
      }

      if (isEditing) {
        await sliderService.update(currentSlider._id, formData);
      } else {
        await sliderService.create(formData);
      }
      setShowModal(false);
      fetchSliders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving slider');
    }
  };

  const handleDelete = async () => {
    try {
      await sliderService.delete(deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null });
      fetchSliders();
    } catch (err) {
      setError('Failed to delete slider');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Hero Sliders</h1>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
        >
          <FaPlus /> Add Slide
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
                <th className="p-4 font-medium">Image</th>
                <th className="p-4 font-medium">Title & Highlight</th>
                <th className="p-4 font-medium">Tag</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sliders.map(slider => (
                <tr key={slider._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <img src={getImageUrl(slider.image)} alt={slider.title} className="w-16 h-10 object-cover rounded shadow-sm" />
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{slider.title}</p>
                    <p className="text-xs text-primary">{slider.highlight}</p>
                  </td>
                  <td className="p-4 text-gray-600">{slider.tag}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${slider.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {slider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{slider.order}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => openEditModal(slider)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <FaEdit />
                    </button>
                    <button onClick={() => setDeleteDialog({ isOpen: true, id: slider._id })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {sliders.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No sliders found. Add some to display on the homepage.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-fade-in-up my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2"><FaImages className="text-primary"/> {isEditing ? 'Edit Slide' : 'New Slide'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required type="text" name="title" value={currentSlider.title} onChange={handleInputChange} placeholder="e.g. Mega Festival Sale" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Highlight</label>
                  <input type="text" name="highlight" value={currentSlider.highlight} onChange={handleInputChange} placeholder="e.g. Up to 40% OFF" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={currentSlider.description} onChange={handleInputChange} placeholder="Description..." rows="2" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag Text</label>
                  <input type="text" name="tag" value={currentSlider.tag} onChange={handleInputChange} placeholder="e.g. Active Offer" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag Icon</label>
                  <select name="tagIcon" value={currentSlider.tagIcon} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option value="FaFire">Fire</option>
                    <option value="FaRocket">Rocket</option>
                    <option value="FaBolt">Lightning (Bolt)</option>
                    <option value="FaCrown">Crown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge Theme</label>
                  <select name="badgeColor" value={currentSlider.badgeColor} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option value="bg-amber-500/20 text-amber-300 border-amber-500/30">Amber (Yellow)</option>
                    <option value="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Cyan (Blue)</option>
                    <option value="bg-rose-500/20 text-rose-300 border-rose-500/30">Rose (Red)</option>
                    <option value="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Emerald (Green)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Text</label>
                  <input type="text" name="primaryBtnText" value={currentSlider.primaryBtnText} onChange={handleInputChange} placeholder="e.g. Shop Now" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Link</label>
                  <input type="text" name="primaryBtnLink" value={currentSlider.primaryBtnLink} onChange={handleInputChange} placeholder="e.g. /products" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Text</label>
                  <input type="text" name="secondaryBtnText" value={currentSlider.secondaryBtnText} onChange={handleInputChange} placeholder="e.g. Browse Categories" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Link</label>
                  <input type="text" name="secondaryBtnLink" value={currentSlider.secondaryBtnLink} onChange={handleInputChange} placeholder="e.g. /categories" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slide Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                
                {(currentSlider.imagePreview || currentSlider.image) && (
                  <div className="mt-2">
                    <img src={currentSlider.imagePreview || getImageUrl(currentSlider.image)} alt="Preview" className="h-24 object-cover rounded-xl shadow border border-gray-200" />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="isActive" id="isActive" checked={currentSlider.isActive} onChange={handleInputChange} className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                  <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Active Slide</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" name="order" value={currentSlider.order} onChange={handleInputChange} className="w-24 border border-gray-300 rounded-xl px-4 py-1.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition">Save Slide</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Slider"
        message="Are you sure you want to remove this slide? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
};

export default AdminSliders;

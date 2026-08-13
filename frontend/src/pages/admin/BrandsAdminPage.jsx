import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaImage } from 'react-icons/fa';
import { brandService } from '../../services';
import { Loader, Alert } from '../../components/common';
import { getImageUrl } from '../../utils/helpers';

const BrandsAdminPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const fetchBrands = () => {
    setLoading(true);
    brandService.getAll().then(r => setBrands(r.data)).finally(() => setLoading(false));
  };
  useEffect(fetchBrands, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', logo: '' }); setImage(null); setShowModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ name: b.name, description: b.description || '', logo: b.logo || '' }); setImage(null); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (form.logo) fd.append('logo', form.logo);
      if (image) fd.append('image', image);
      if (editing) {
        await brandService.update(editing._id, fd);
        setSuccess('Brand updated successfully!');
      } else {
        await brandService.create(fd);
        setSuccess('Brand created successfully!');
      }
      setShowModal(false);
      fetchBrands();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await brandService.delete(id);
      setSuccess('Brand deleted successfully');
      fetchBrands();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Brands</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage brand names, descriptions, and logos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl transition text-sm shadow-sm">
          <FaPlus size={12} /> Add Brand
        </button>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {loading ? <Loader /> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-gray-100">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Logo', 'Brand Name', 'Description', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No brands found</td></tr>
              ) : brands.map(b => (
                <tr key={b._id} className="hover:bg-gray-50/80 transition">
                  <td className="px-5 py-3">
                    <div className="w-24 sm:w-28 h-12 sm:h-14 bg-white border border-gray-200/80 rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-sm group hover:shadow-md transition-all">
                      <img
                        src={getImageUrl(b.logo)}
                        alt={b.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200x100?text=' + encodeURIComponent(b.name); }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-800 text-sm sm:text-base">{b.name}</td>
                  <td className="px-5 py-3 text-gray-500 line-clamp-1 max-w-xs text-xs sm:text-sm">{b.description || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Brand"><FaEdit size={15} /></button>
                      <button onClick={() => handleDelete(b._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete Brand"><FaTrash size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-800">{editing ? 'Edit Brand' : 'Add New Brand'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <Alert message={error} type="error" onClose={() => setError('')} />}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name*</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Samsung, LG, Sony"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of brand"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Logo URL</label>
                <input type="url" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png or SVG URL"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none mb-3" />
                
                {/* Logo Preview */}
                {(form.logo || (editing?.logo && !image)) && (
                  <div className="mb-3 text-center">
                    <p className="text-xs font-medium text-gray-500 mb-1.5">XL Logo Preview:</p>
                    <div className="w-36 h-20 mx-auto bg-white border border-gray-200 rounded-xl p-2.5 flex items-center justify-center shadow-sm">
                      <img src={getImageUrl(form.logo || editing?.logo)} alt="Preview" className="max-w-full max-h-full object-contain"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200x100?text=Invalid+URL'; }}
                      />
                    </div>
                  </div>
                )}

                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:border-primary transition bg-gray-50/50"
                     onClick={() => fileRef.current.click()}>
                  <FaImage className="text-gray-400 text-xl mx-auto mb-1" />
                  <p className="text-xs text-gray-500 font-medium">{image ? image.name : 'Or upload image file from computer'}</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0])} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm">
                  {saving ? 'Saving...' : editing ? 'Update Brand' : 'Create Brand'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-semibold text-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsAdminPage;

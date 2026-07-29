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
  const [form, setForm] = useState({ name: '', description: '' });
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

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setImage(null); setShowModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ name: b.name, description: b.description || '' }); setImage(null); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (image) fd.append('image', image);
      if (editing) {
        await brandService.update(editing._id, fd);
        setSuccess('Brand updated!');
      } else {
        await brandService.create(fd);
        setSuccess('Brand created!');
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
      setSuccess('Brand deleted');
      fetchBrands();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Brands</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-dark font-bold px-4 py-2 rounded-xl transition">
          <FaPlus size={12} /> Add Brand
        </button>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {loading ? <Loader /> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Logo', 'Brand Name', 'Description', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No brands yet</td></tr>
              ) : brands.map(b => (
                <tr key={b._id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden">
                      <img src={getImageUrl(b.logo)} alt={b.name} className="w-full h-full object-contain p-1" />
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{b.name}</td>
                  <td className="px-5 py-3 text-gray-500 line-clamp-1 max-w-xs">{b.description || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><FaEdit size={14} /></button>
                      <button onClick={() => handleDelete(b._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><FaTrash size={14} /></button>
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
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Edit Brand' : 'Add Brand'}</h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <Alert message={error} type="error" onClose={() => setError('')} />}
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name*</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                {editing?.logo && !image && (
                  <img src={getImageUrl(editing.logo)} alt="" className="w-20 h-20 object-contain mx-auto mb-2 border rounded-xl p-2" />
                )}
                {image && <p className="text-xs text-primary mb-2">{image.name}</p>}
                <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition">
                  <FaImage className="text-gray-400 text-xl mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Upload brand logo</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0])} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-60 text-dark font-bold py-2.5 rounded-xl transition">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
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

export default BrandsAdminPage;

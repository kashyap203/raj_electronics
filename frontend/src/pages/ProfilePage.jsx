import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaMapMarkerAlt, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AppContext';
import { authService } from '../services';
import { Alert, Loader } from '../components/common';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    authService.getProfile().then(r => {
      setProfile(r.data);
      setForm({ name: r.data.name, email: r.data.email, phone: r.data.phone || '', password: '', newPassword: '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone };
      if (form.newPassword) {
        if (form.newPassword.length < 6) return setError('New password must be at least 6 characters');
        payload.password = form.newPassword;
      }
      const { data } = await authService.updateProfile(payload);
      updateUser(data);
      setSuccess('Profile updated successfully!');
      setForm(f => ({ ...f, password: '', newPassword: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const { data } = await authService.addAddress(addressForm);
      setProfile(p => ({ ...p, addresses: data }));
      setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
      setShowAddressForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const { data } = await authService.deleteAddress(id);
      setProfile(p => ({ ...p, addresses: data }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader />;

  const tabs = ['profile', 'addresses', 'security'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Account</h1>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaUser className="text-primary" /> Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            {[
              { label: 'Full Name', name: 'name', type: 'text', icon: FaUser },
              { label: 'Email Address', name: 'email', type: 'email', icon: FaEnvelope },
              { label: 'Phone Number', name: 'phone', type: 'tel', icon: FaPhone },
            ].map(({ label, name, type, icon: Icon }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type={type}
                    value={form[name]}
                    onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={saving} className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-2.5 rounded-xl transition">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Addresses Tab */}
      {tab === 'addresses' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><FaMapMarkerAlt className="text-primary" /> Saved Addresses</h2>
            <button onClick={() => setShowAddressForm(!showAddressForm)} className="flex items-center gap-1 text-sm bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2 rounded-xl transition">
              <FaPlus size={12} /> Add New
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'fullName', label: 'Full Name', full: false },
                { name: 'phone', label: 'Phone', full: false },
                { name: 'street', label: 'Street Address', full: true },
                { name: 'city', label: 'City', full: false },
                { name: 'state', label: 'State', full: false },
                { name: 'pincode', label: 'Pincode', full: false },
              ].map(f => (
                <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type="text"
                    required
                    value={addressForm[f.name]}
                    onChange={e => setAddressForm(a => ({ ...a, [f.name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={addressForm.isDefault} onChange={e => setAddressForm(a => ({ ...a, isDefault: e.target.checked }))} className="accent-primary" />
                <label htmlFor="isDefault" className="text-sm text-gray-600">Set as default address</label>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" disabled={addressLoading} className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-sm">
                  {addressLoading ? 'Saving...' : 'Save Address'}
                </button>
                <button type="button" onClick={() => setShowAddressForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          )}

          {profile?.addresses?.length > 0 ? (
            <div className="space-y-3">
              {profile.addresses.map(addr => (
                <div key={addr._id} className={`border rounded-xl p-4 ${addr.isDefault ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                  <div className="flex justify-between">
                    <div>
                      {addr.isDefault && <span className="text-xs bg-primary text-white font-bold px-2 py-0.5 rounded-full mb-2 inline-block">Default</span>}
                      <p className="font-medium text-gray-800 text-sm">{addr.fullName}</p>
                      <p className="text-sm text-gray-600">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-sm text-gray-500">{addr.phone}</p>
                    </div>
                    <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-400 hover:text-red-600 transition">
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No saved addresses yet.</p>
          )}
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaLock className="text-primary" /> Change Password</h2>
          <form onSubmit={handleProfileSave} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button type="submit" disabled={saving || !form.newPassword} className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-8 py-2.5 rounded-xl transition">
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

import { useEffect, useState } from 'react';
import { FaBan, FaCheck, FaTrash, FaSearch } from 'react-icons/fa';
import { userService } from '../../services';
import { Loader, Alert } from '../../components/common';

const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    userService.getAll().then(r => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(fetchUsers, []);

  const handleBlock = async (id, isBlocked) => {
    try {
      const { data } = await userService.block(id);
      setUsers(u => u.map(usr => usr._id === id ? data : usr));
      setSuccess(isBlocked ? 'User unblocked' : 'User blocked');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await userService.delete(id);
      setUsers(u => u.filter(usr => usr._id !== id));
      setSuccess('User deleted');
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Users ({users.length})</h1>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No users found</td></tr>
                ) : filtered.map(user => (
                  <tr key={user._id} className={`hover:bg-gray-50 transition ${user.isBlocked ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-dark font-bold text-sm shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleBlock(user._id, user.isBlocked)}
                              title={user.isBlocked ? 'Unblock' : 'Block'}
                              className={`p-2 rounded-lg transition ${user.isBlocked ? 'text-green-500 hover:bg-green-50' : 'text-yellow-500 hover:bg-yellow-50'}`}
                            >
                              {user.isBlocked ? <FaCheck size={14} /> : <FaBan size={14} />}
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                            >
                              <FaTrash size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdminPage;

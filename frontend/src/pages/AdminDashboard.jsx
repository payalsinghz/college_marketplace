import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/Footer';
import { ArrowLeft, Users, ShoppingBag, Star, Trash2, Shield, ChartBar } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/stats', { headers });
    setStats(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/users', { headers });
    setUsers(res.data);
  };

  const fetchItems = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/items', { headers });
    setItems(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchStats(), fetchUsers(), fetchItems()]);
      } catch (err) {
        console.error('Admin fetch error', err);
      }
      setLoading(false);
    };
    init();
  }, []);

  const notify = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const banUser = async (id, name) => {
    if (!window.confirm(`Ban user "${name}"? This will also delete all their listings.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers });
      setUsers(users.filter(u => u._id !== id));
      notify(`✅ User "${name}" has been banned.`);
      fetchStats();
    } catch (err) {
      notify(`❌ ${err.response?.data?.message || 'Failed to ban user.'}`);
    }
  };

  const removeItem = async (id, title) => {
    if (!window.confirm(`Remove item "${title}"?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/items/${id}`, { headers });
      setItems(items.filter(i => i._id !== id));
      notify(`✅ Item "${title}" has been removed.`);
      fetchStats();
    } catch (err) {
      notify(`❌ Failed to remove item.`);
    }
  };

  const tabStyle = (tab) => ({
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
    color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
    border: activeTab === tab ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }} className="hover-text-primary">
            <ArrowLeft size={18} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={20} color="var(--accent-primary)" />
            <span style={{ fontWeight: '700', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Control Panel</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('overview')} style={tabStyle('overview')}><span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Overview</span></button>
          <button onClick={() => setActiveTab('users')} style={tabStyle('users')}>Users ({users.length})</button>
          <button onClick={() => setActiveTab('items')} style={tabStyle('items')}>Items ({items.length})</button>
        </div>
      </nav>

      {actionMsg && (
        <div className="animate-fade-in" style={{ background: actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${actionMsg.startsWith('✅') ? '#10b981' : '#ef4444'}`, color: 'var(--text-primary)', padding: '0.875rem 2rem', textAlign: 'center', fontSize: '0.95rem' }}>
          {actionMsg}
        </div>
      )}

      <main className="container" style={{ marginTop: '3rem', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading platform data...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="animate-fade-in">
                <h2 className="heading-2" style={{ marginBottom: '2rem' }}>Platform Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                  <StatCard icon={<Users size={24} color="#8b5cf6" />} label="Total Users" value={stats.totalUsers} color="#8b5cf6" />
                  <StatCard icon={<ShoppingBag size={24} color="#10b981" />} label="Active Listings" value={stats.totalItems} color="#10b981" />
                  <StatCard icon={<Star size={24} color="#f59e0b" />} label="Total Reviews" value={stats.totalReviews} color="#f59e0b" />
                </div>

                <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Newest Members</h3>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Role</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map((u, i) => (
                        <tr key={u._id} style={{ borderBottom: i < stats.recentUsers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{u.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</td>
                          <td style={{ padding: '1rem' }}><span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>user</span></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="animate-fade-in">
                <h2 className="heading-2" style={{ marginBottom: '2rem' }}>User Management</h2>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Role</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Joined</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{u.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ background: u.role === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)', color: u.role === 'admin' ? '#8b5cf6' : '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {u.role !== 'admin' ? (
                              <button onClick={() => banUser(u._id, u.name)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.4rem 0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                                <Trash2 size={14} /> Ban
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ITEMS TAB */}
            {activeTab === 'items' && (
              <div className="animate-fade-in">
                <h2 className="heading-2" style={{ marginBottom: '2rem' }}>Item Moderation</h2>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Item</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Seller</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Category</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Price</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={item._id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img src={item.imageUrl || `https://picsum.photos/seed/${item._id}/40/40`} alt={item.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = `https://picsum.photos/seed/${item._id}/40/40`; }} />
                              <span style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.owner?.name || 'Unknown'}</td>
                          <td style={{ padding: '1rem' }}><span style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{item.category || 'Other'}</span></td>
                          <td style={{ padding: '1rem', color: '#22c55e', fontWeight: '700' }}>${parseFloat(item.price).toFixed(2)}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button onClick={() => removeItem(item._id, item.title)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.4rem 0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                              <Trash2 size={14} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No items to moderate.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <div style={{ marginTop: '4rem' }}><Footer /></div>
    </div>
  );
};

export default AdminDashboard;

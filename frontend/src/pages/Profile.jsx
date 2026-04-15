import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import Footer from '../components/Footer';
import { LogOut, ArrowLeft, User as UserIcon, Heart, ShoppingBag } from 'lucide-react';
import { initialMockItems } from '../constants/mockData';

const Profile = () => {
  const { user, token, logout } = useContext(AuthContext);
  const { fetchWishlistIds, mockWishlistIds, totalSaved } = useContext(WishlistContext);
  const [items, setItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'wishlist'

  const fetchUserItems = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/items/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch user items', err);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistItems(res.data);
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    }
  };

  useEffect(() => {
    if (token && user?.id) {
      Promise.all([fetchUserItems(), fetchWishlist()]).finally(() => setLoading(false));
    }
  }, [token, user]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(items.filter(item => item._id !== id));
    } catch (err) {
      console.error('Failed to delete item', err);
      alert(err.response?.data?.message || 'Failed to delete the item.');
    }
  };

  // Combine real wishlist items from backend with mock items saved in memory
  const allWishlistItems = [
    ...wishlistItems,
    ...initialMockItems.filter(item => mockWishlistIds.has(item._id))
  ];

  const tabStyle = (tab) => ({
    padding: '0.6rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: activeTab === tab ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
    color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
    border: activeTab === tab ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }} className="hover-text-primary">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.6rem', borderRadius: '50%' }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="container" style={{ marginTop: '3rem', flex: 1 }}>
        {/* Profile Header */}
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)' }}>
            <UserIcon size={48} color="white" />
          </div>
          <h2 className="heading-1" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{user?.email}</p>

          {/* Stats Pills */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1.5rem', borderRadius: '40px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Listings:</span> <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{items.length}</span>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem 1.5rem', borderRadius: '40px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wishlist:</span> <span style={{ color: '#ef4444', fontWeight: '700' }}>{totalSaved}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button style={tabStyle('listings')} onClick={() => setActiveTab('listings')}>
            <ShoppingBag size={16} /> My Listings
          </button>
          <button style={tabStyle('wishlist')} onClick={() => setActiveTab('wishlist')}>
            <Heart size={16} fill={activeTab === 'wishlist' ? 'var(--accent-primary)' : 'none'} /> Saved Items ({totalSaved})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          </div>
        ) : (
          <>
            {/* MY LISTINGS TAB */}
            {activeTab === 'listings' && (
              items.length === 0 ? (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '4rem 2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }} className="animate-fade-in">
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '500' }}>No items listed yet</h3>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Head back to the dashboard to post your first item!</p>
                  <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Go to Dashboard</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '4rem' }} className="animate-fade-in">
                  {items.map((item, index) => (
                    <div key={item._id} style={{ animationDelay: `${(index % 10) * 0.1}s`, height: '100%' }}>
                      <ItemCard item={item} currentUser={user} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              allWishlistItems.length === 0 ? (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '4rem 2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }} className="animate-fade-in">
                  <Heart size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '500' }}>Your wishlist is empty</h3>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Click the ❤️ heart on any item in the marketplace to save it here.</p>
                  <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Browse Items</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '4rem' }} className="animate-fade-in">
                  {allWishlistItems.map((item, index) => (
                    <div key={item._id} style={{ animationDelay: `${(index % 10) * 0.1}s`, height: '100%' }}>
                      <ItemCard 
                        item={item} 
                        currentUser={user} 
                        onBuy={() => {}}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Profile;


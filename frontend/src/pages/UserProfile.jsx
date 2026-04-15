import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import Footer from '../components/Footer';
import { User as UserIcon, Star, ArrowLeft } from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`);
        setProfileData(res.data);
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 className="heading-2">User Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This user might have been deleted or does not exist.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const { user, items, stats } = profileData;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }} className="hover-text-primary">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
      </nav>

      <main className="container" style={{ marginTop: '3rem', flex: 1 }}>
        <div className="animate-fade-in card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4rem', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background glow */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '100px', background: 'var(--accent-primary)', filter: 'blur(80px)', opacity: 0.2 }}></div>

          <div style={{ 
            width: '100px', height: '100px', 
            borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-surface), #222)', 
            border: '2px solid rgba(139, 92, 246, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginBottom: '1.5rem', zIndex: 1
          }}>
            <UserIcon size={48} color="var(--text-secondary)" />
          </div>
          <h2 className="heading-1" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', zIndex: 1 }}>{user.name}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
            <Star color={stats.averageRating > 0 ? "#f59e0b" : "var(--text-secondary)"} fill={stats.averageRating > 0 ? "#f59e0b" : "none"} size={24} />
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.averageRating > 0 ? stats.averageRating : 'New'}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>({stats.totalReviews} reviews)</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem', borderRadius: '40px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Email:</span> <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{user.email}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem', borderRadius: '40px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Active Listings:</span> <span style={{ color: 'var(--accent-primary)', fontWeight: '700', marginLeft: '0.5rem' }}>{items.length}</span>
            </div>
          </div>
        </div>

        <h3 className="heading-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>Listings by {user.name.split(' ')[0]}</h3>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '4rem 2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }} className="animate-fade-in">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '500' }}>No active listings</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>This seller doesn't have any items available right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '4rem' }}>
            {items.map((item, index) => (
              <div key={item._id} className="animate-fade-in" style={{ animationDelay: `${(index % 10) * 0.1}s`, height: '100%' }}>
                <ItemCard item={item} currentUser={currentUser} hideSellerLink />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;

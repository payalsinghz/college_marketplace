import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import Footer from '../components/Footer';
import { LogOut, Plus, X, Search, Filter, Star, MessageCircle, Sparkles } from 'lucide-react';
import { WishlistContext } from '../context/WishlistContext';
import { initialMockItems } from '../constants/mockData';

const Dashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const { totalSaved } = useContext(WishlistContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success
  const [paymentMessage, setPaymentMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [adminContact, setAdminContact] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Other');
  const [tags, setTags] = useState('');
  const [roughText, setRoughText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiInfo, setAiInfo] = useState('');

  const fetchItems = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await axios.get('http://localhost:5000/api/items', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchQuery, category: categoryFilter, minPrice, maxPrice }
      });

      setItems(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch items', err);

      let currentMocks = initialMockItems;
      if (searchQuery) currentMocks = currentMocks.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (categoryFilter !== 'All') currentMocks = currentMocks.filter(i => (i.category || 'Other') === categoryFilter);
      if (minPrice) currentMocks = currentMocks.filter(i => i.price >= Number(minPrice));
      if (maxPrice) currentMocks = currentMocks.filter(i => i.price <= Number(maxPrice));
      setItems(currentMocks);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItems();
      fetchAdminContact();
    }
  }, [token]);

  const fetchAdminContact = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/admin/contact');
      setAdminContact(res.data);
    } catch (err) {
      console.error('Failed to fetch admin contact', err);
    }
  };

  const handleDelete = async (id) => {
    if (id.toString().startsWith('mock')) {
      setItems(items.filter(item => item._id !== id));
      return;
    }
    
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

  const handleBuy = (item) => {
    if (String(item._id || '').startsWith('mock')) {
      alert('Payment is only available for real listed items.');
      return;
    }
    setPurchasingItem(item);
    setPaymentStatus('idle');
    setPaymentMessage('');
  };

  const loadRazorpaySdk = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const triggerPayment = async () => {
    if (!purchasingItem) return;

    setPaymentStatus('processing');
    setPaymentMessage('');
    try {
      const sdkReady = await loadRazorpaySdk();
      if (!sdkReady) {
        throw new Error('Failed to load Razorpay checkout.');
      }

      const configRes = await axios.get('http://localhost:5000/api/payments/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderRes = await axios.post(
        'http://localhost:5000/api/payments/create-order',
        { itemId: purchasingItem._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency } = orderRes.data;
      const options = {
        key: configRes.data.keyId,
        amount,
        currency,
        name: 'College Marketplace',
        description: `Purchase: ${purchasingItem.title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await axios.post(
              'http://localhost:5000/api/payments/verify',
              {
                itemId: purchasingItem._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            setPaymentStatus('success');
            setItems((prev) => prev.filter((i) => i._id !== purchasingItem._id));
          } catch (verifyError) {
            setPaymentStatus('idle');
            setPaymentMessage(
              verifyError.response?.data?.message || 'Payment completed but verification failed.'
            );
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
            setPaymentMessage('Payment was cancelled.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setPaymentStatus('idle');
      setPaymentMessage(error.response?.data?.message || error.message || 'Unable to start payment.');
    }
  };

  const submitRating = async (rating) => {
    try {
      const ownerId = purchasingItem?.owner?._id || purchasingItem?.owner?.id || purchasingItem?.owner;
      if (ownerId && !ownerId.toString().startsWith('mock')) {
        await axios.post('http://localhost:5000/api/reviews', {
          sellerId: ownerId,
          itemId: purchasingItem._id,
          rating,
          comment: ''
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setPurchasingItem(null); // Close modal
    } catch (err) {
      console.error('Failed to submit review', err);
      setPurchasingItem(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image");
      return;
    }
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('image', imageFile);

    try {
      const res = await axios.post('http://localhost:5000/api/items', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setItems([res.data, ...items]);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('Other');
      setTags('');
      setRoughText('');
      setAiInfo('');
      setImageFile(null);
    } catch (err) {
      console.error('Error adding item', err);
      alert(err.response?.data?.message || 'Error posting the item. Make sure you have valid Cloudinary credentials in the .env file.');
    }
    setSubmitting(false);
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const generateWithAI = async () => {
    if (!roughText.trim()) {
      alert('Please enter rough details before generating with AI.');
      return;
    }

    setAiGenerating(true);
    setAiInfo('');
    try {
      const payload = { roughText };
      if (imageFile) {
        payload.imageBase64 = await fileToBase64(imageFile);
        payload.mimeType = imageFile.type || 'image/jpeg';
      }

      const res = await axios.post('http://localhost:5000/api/items/ai-suggest', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const suggestion = res.data;
      setTitle(suggestion.title || '');
      setDescription(suggestion.description || '');
      setCategory(suggestion.category || 'Other');
      setTags((suggestion.tags || []).join(', '));
      if (suggestion.suggestedPriceRange?.min && suggestion.suggestedPriceRange?.max) {
        const suggestedPrice = ((Number(suggestion.suggestedPriceRange.min) + Number(suggestion.suggestedPriceRange.max)) / 2).toFixed(2);
        setPrice(suggestedPrice);
        setAiInfo(
          `AI suggested price range: $${suggestion.suggestedPriceRange.min} - $${suggestion.suggestedPriceRange.max} (${suggestion.source || 'ai'} mode)`
        );
      } else {
        setAiInfo(`AI content generated (${suggestion.source || 'ai'} mode).`);
      }
    } catch (err) {
      console.error('Failed to generate listing with AI', err);
      alert(err.response?.data?.message || 'AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingBottom: '3rem',
      backgroundImage: `linear-gradient(rgba(5, 5, 5, 0.9), rgba(5, 5, 5, 0.9)), url('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2070&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
          College Marketplace
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', display: 'none', '@media (min-width: 640px)': { display: 'block' } }}>
            <Link to="/profile" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s', textDecoration: 'none' }} className="hover-text-primary">
              Hello, <strong style={{color: 'white', fontWeight: '600'}}>{user?.name}</strong>
            </Link>
          </span>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
            <Plus size={18} /> Post Item
          </button>
          {user?.role !== 'admin' && adminContact?.id && (
            <Link
              to={`/chat?user=${adminContact.id}`}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', fontWeight: '600', borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}
            >
              <MessageCircle size={16} /> Chat with Admin
            </Link>
          )}
          <Link to="/chat" className="btn btn-secondary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', fontWeight: '600' }}>
            <MessageCircle size={16} /> Chats
          </Link>
          {/* Wishlist button with count badge */}
          <Link
            to="/profile"
            title="My Wishlist"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ❤️
            {totalSaved > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {totalSaved}
              </span>
            )}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.4)' }}>
              ⚙️ Admin
            </Link>
          )}
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.6rem', borderRadius: '50%' }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="container" style={{ marginTop: '4rem' }}>
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h2 className="heading-1 animate-fade-in" style={{ fontSize: '3.5rem' }}>Discover & Trade</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Find the essential books, notes, calculators, and more from your peers in a secure environment.
          </p>
        </div>

        <form onSubmit={fetchItems} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="animate-fade-in">
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0 1rem', border: '1px solid var(--border-color)' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search items..." style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', padding: '0.875rem 0.5rem', outline: 'none' }} />
          </div>
          
          <div style={{ flex: '1 1 150px' }}>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.875rem', background: '#111' }}>
              <option value="All">All Categories</option>
              <option value="Textbooks">Textbooks</option>
              <option value="Electronics">Electronics</option>
              <option value="Dorm Essentials">Dorm Essentials</option>
              <option value="Notes">Notes</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 200px' }}>
            <input type="number" placeholder="Min $" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-field" style={{ width: '50%', padding: '0.875rem' }} />
            <input type="number" placeholder="Max $" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-field" style={{ width: '50%', padding: '0.875rem' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 1.5rem' }}>
            <Filter size={18} /> Apply Filter
          </button>
        </form>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading marketplace...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '4rem 2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }} className="animate-fade-in">
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '600' }}>It's quiet in here</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>No items have been posted yet.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Be the first to post!</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {items.map((item, index) => (
              <div key={item._id} className="animate-fade-in" style={{ animationDelay: `${(index % 10) * 0.1}s`, height: '100%' }}>
                <ItemCard item={item} currentUser={user} onDelete={handleDelete} onBuy={handleBuy} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {purchasingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} className="animate-fade-in">
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', background: '#111', textAlign: 'center', position: 'relative', border: '1px solid rgba(139, 92, 246, 0.4)', boxShadow: '0 0 50px rgba(139, 92, 246, 0.15)' }}>
            
            {paymentStatus === 'idle' && (
              <div className="animate-fade-in">
                <button onClick={() => setPurchasingItem(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
                <h2 className="heading-2" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Checkout</h2>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem auto', border: '2px solid var(--accent-primary)' }}>
                    <img src={purchasingItem.imageUrl || `https://picsum.photos/seed/${purchasingItem._id}/100/100`} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '500' }}>{purchasingItem.title}</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success-color)' }}>
                    ${parseFloat(purchasingItem.price).toFixed(2)}
                  </p>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}
                  onClick={triggerPayment}
                >
                  Proceed to Secure Pay
                </button>
                {paymentMessage && (
                  <p style={{ marginTop: '0.8rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                    {paymentMessage}
                  </p>
                )}
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="animate-fade-in" style={{ padding: '3rem 0' }}>
                <div className="payment-spinner"></div>
                <h3 style={{ marginTop: '2rem', color: 'var(--accent-primary)', fontSize: '1.35rem', fontWeight: '600' }}>Processing Payment...</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Securely authenticating the transaction. Please do not close.</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="animate-fade-in" style={{ padding: '3rem 0' }}>
                <div className="payment-success">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 style={{ marginTop: '2rem', color: 'var(--success-color)', fontSize: '1.75rem', fontWeight: '700' }}>Payment Successful!</h3>
                <p style={{ color: 'var(--text-primary)', marginTop: '1rem', fontSize: '1rem' }}>You purchased <strong>{purchasingItem.title}</strong>.</p>
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>How was your experience with {purchasingItem.owner?.name?.split(' ')[0] || 'this seller'}?</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => submitRating(star)} className="hover-text-primary" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s, transform 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.transform = 'scale(1.2)'}} onMouseOut={(e) => {e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'scale(1)'}}>
                        <Star size={32} />
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setPurchasingItem(null)} className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem' }}>
                  Skip Rating
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} className="animate-fade-in">
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', background: '#111', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
            <h2 className="heading-2" style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Post a New Item</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Fill manually or use AI to generate high-quality listing content.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Rough Details for AI (optional but recommended)</label>
                <textarea
                  className="input-field"
                  value={roughText}
                  onChange={(e) => setRoughText(e.target.value)}
                  rows="3"
                  placeholder="Example: 2nd year engineering maths textbook, little used, no torn pages, selling urgently."
                />
              </div>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Casio Scientific Calculator FX-991EX" required />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="Condition, specific features, why you're selling..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Price ($)</label>
                  <input type="number" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" placeholder="0.00" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '0.875rem', background: '#111' }}>
                    <option value="Textbooks">Textbooks</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Dorm Essentials">Dorm Essentials</option>
                    <option value="Notes">Notes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Item Image</label>
                <input type="file" className="input-field" style={{ padding: '0.75rem' }} onChange={(e) => setImageFile(e.target.files[0])} accept="image/*" required />
              </div>
              <div className="input-group">
                <label className="input-label">Tags (comma separated)</label>
                <input
                  type="text"
                  className="input-field"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="engineering, semester2, calculator"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.25rem', padding: '0.875rem', borderColor: 'rgba(139,92,246,0.45)', color: 'var(--accent-primary)' }}
                onClick={generateWithAI}
                disabled={aiGenerating}
              >
                <Sparkles size={16} /> {aiGenerating ? 'Generating with AI...' : 'Generate with AI'}
              </button>
              {aiInfo && (
                <p style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#10b981' }}>{aiInfo}</p>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }} disabled={submitting}>
                {submitting ? 'Uploading to Cloudinary...' : 'List Item'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Dashboard;

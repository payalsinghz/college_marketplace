import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Trash2, ShoppingCart, User as UserIcon, Heart } from 'lucide-react';
import { WishlistContext } from '../context/WishlistContext';

const ItemCard = ({ item, currentUser, onDelete, onBuy, hideSellerLink }) => {
  const currentId = currentUser ? String(currentUser.id || currentUser._id) : null;
  // owner can be a populated object {_id, name, email} or a raw ID string
  const ownerId = item.owner
    ? String(item.owner._id || item.owner.id || item.owner)
    : null;
  const isOwner = Boolean(currentId && ownerId && currentId === ownerId);
  const { isSaved, toggleWishlist } = useContext(WishlistContext);
  const saved = !item._id?.toString().startsWith('mock') && isSaved(item._id);
  const canDelete = isOwner || (item._id && item._id.toString().startsWith('mock'));

  return (
    <div className="card item-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {canDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to remove this item?")) {
              onDelete(item._id);
            }
          }}
          style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: '1px solid rgba(239, 68, 68, 1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'transform 0.2s ease, background 0.2s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
          title="Remove Item"
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#dc2626'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'; }}
        >
          <Trash2 size={16} />
        </button>
      )}

        {/* Heart Wishlist Button — only shown to non-owners */}
        {!isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Only persist to backend for real DB items
              if (!item._id?.toString().startsWith('mock')) {
                toggleWishlist(item._id);
              }
            }}
            title={saved ? 'Remove from Wishlist' : 'Save to Wishlist'}
            style={{
              position: 'absolute', top: '12px', right: '12px', zIndex: 10,
              background: saved ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0,0,0,0.6)',
              color: 'white', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Heart size={16} fill={saved ? 'white' : 'none'} />
          </button>
        )}

        <div className="item-image-container" style={{ height: '220px', width: '100%', overflow: 'hidden', position: 'relative' }}>
          <img 
            src={item.imageUrl || `https://picsum.photos/seed/${item._id}/600/400`} 
            alt={item.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', background: 'var(--bg-secondary)' }}
            className="item-img"
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onError={(e) => { 
              if (e.target.src !== `https://picsum.photos/seed/${item._id}/600/400`) {
                e.target.onerror = null; 
                e.target.src = `https://picsum.photos/seed/${item._id}/600/400`;
              }
            }}
          />
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.85)', padding: '0.35rem 0.85rem', borderRadius: '20px', backdropFilter: 'blur(5px)', fontWeight: '700', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            ${parseFloat(item.price).toFixed(2)}
          </div>
        </div>
      
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{item.title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
          {item.description}
        </p>
        
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: 'auto' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-primary)', marginBottom: '0.75rem', fontWeight: '700' }}>Contact Seller</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!hideSellerLink && ownerId && !ownerId.toString().startsWith('mock') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                <UserIcon size={16} color="var(--accent-secondary)" /> 
                <Link to={`/user/${ownerId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} className="hover-text-primary">
                  {item.owner?.name || 'View Public Profile'}
                </Link>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
              <Mail size={16} color="var(--accent-secondary)" /> <span>{item.owner?.email || 'Unknown Email'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
              <Phone size={16} color="var(--accent-secondary)" /> <span>{item.owner?.phone || 'Unknown Phone'}</span>
            </div>
          </div>
        </div>

        {!isOwner && (
          <button 
            onClick={(e) => { e.stopPropagation(); if (onBuy) onBuy(item); }}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.875rem', fontSize: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'; }}
          >
            <ShoppingCart size={18} style={{marginRight: '8px'}} /> Buy Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;

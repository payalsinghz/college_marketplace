import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Monitor, Coffee, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundImage: `linear-gradient(rgba(5, 5, 5, 0.85), rgba(5, 5, 5, 0.85)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      
      {/* Background Decorative Elements - Subtle Glows */}
      <div style={{ 
        position: 'absolute', top: '0', left: '0', 
        width: '100%', height: '100%', background: 'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        zIndex: 1 
      }} />

      {/* Navigation */}
      <nav style={{ 
        padding: '1.25rem 2rem', 
        borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: scrolled ? 'rgba(5,5,5,0.85)' : 'transparent', 
        backdropFilter: scrolled ? 'blur(12px)' : 'none', 
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none', 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBagIcon />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            College Marketplace
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: '500', padding: '0.5rem 1rem', transition: 'color 0.2s' }} className="hover-text-accent">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '40px' }}>
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '80vh', justifyContent: 'center' }}>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.1s', marginBottom: '1.5rem' }}>
            <span style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              color: '#a78bfa', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              fontSize: '0.875rem', 
              fontWeight: '600',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              Your Campus. Your Marketplace.
            </span>
          </div>

          <h1 className="heading-1 animate-fade-in" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', letterSpacing: '-1px', maxWidth: '900px', marginBottom: '1.5rem', animationDelay: '0.2s' }}>
            Buy, Sell, and Trade with your <span style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Peers.</span>
          </h1>
          
          <p className="animate-fade-in" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', maxWidth: '650px', lineHeight: '1.6', marginBottom: '3rem', animationDelay: '0.3s' }}>
            The exclusive marketplace for college students. Find textbooks, electronics, and essentials from people you can trust—right on your campus.
          </p>
          
          <div className="animate-fade-in" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.4s' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1.1rem', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Get Started <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1.1rem', borderRadius: '40px' }}>
              Explore Marketplace
            </Link>
          </div>

          {/* Features Grid */}
          <div className="animate-fade-in" style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px', animationDelay: '0.6s' }}>
            
            <FeatureCard 
              icon={<ShieldCheck size={28} color="#10b981" />}
              title="Verified Students Only"
              description="Secure environment where everyone is authenticated using their student emails."
            />
            <FeatureCard 
              icon={<Zap size={28} color="#f59e0b" />}
              title="Instant Campus Trades"
              description="No shipping wait times. Meet up on campus and exchange instantly."
            />
            <FeatureCard 
              icon={<Users size={28} color="#3b82f6" />}
              title="Community Driven"
              description="Support your peers and save money by buying gently used items locally."
            />

          </div>
        </div>
      </main>

      <Footer />
      <style>{`
        .hover-text-accent:hover {
          color: var(--accent-primary) !important;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card" style={{ 
    padding: '2rem', 
    background: 'rgba(255,255,255,0.02)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '16px',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  }}>
    <div style={{ background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>{description}</p>
  </div>
);

// Custom Shopping Bag Icon for Logo
const ShoppingBagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

export default LandingPage;

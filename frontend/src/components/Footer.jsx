import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ 
      background: '#0a0a0a', 
      borderTop: '1px solid rgba(255,255,255,0.05)', 
      paddingTop: '4rem', 
      paddingBottom: '2rem', 
      marginTop: 'auto' 
    }}>
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '3rem', 
          marginBottom: '3rem' 
        }}>
          
          {/* Column 1: Brand */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
              College Marketplace
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Your ultimate platform for college essentials, textbooks, and opportunities.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '1.25rem', fontSize: '1rem' }}>
              Quick Links
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-text-primary">
                  Explore Items
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-text-primary">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '1.25rem', fontSize: '1rem' }}>
              Resources
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              <li>
                <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-text-primary">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-text-primary">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-text-primary">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '1.25rem', fontSize: '1rem' }}>
              Connect
            </h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-text-primary" aria-label="Email">
                <Mail size={20} />
              </a>
              <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-text-primary" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-text-primary" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-text-primary" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
        </div>

        {/* Sub Footer */}
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          paddingTop: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            © 2026 College Marketplace. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', transition: 'color 0.2s' }} className="hover-text-primary">
              Privacy Policy
            </a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', transition: 'color 0.2s' }} className="hover-text-primary">
              Terms of Service
            </a>
          </div>
        </div>

      </div>

      <style>{`
        .hover-text-primary:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;

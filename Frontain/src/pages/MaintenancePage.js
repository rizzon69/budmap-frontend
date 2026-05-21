import React, { useState, useEffect } from 'react';
import { Wallet, Wrench, Clock, ArrowRight } from 'lucide-react';

const MaintenancePage = ({ message }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafb 50%, #ecfdf5 100%)',
      padding: '24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '40px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        }}>
          <Wallet size={22} color="white" />
        </div>
        <span style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.4px',
        }}>BudMap</span>
      </div>

      {/* Main Card */}
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        background: 'white',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 25px 65px -15px rgba(16,185,129,0.1), 0 10px 30px -10px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
      }}>
        {/* Animated Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          position: 'relative',
        }}>
          <Wrench size={36} color="#d97706" />
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '24px',
            height: '24px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>!</span>
          </div>
        </div>

        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#111827',
          marginBottom: '8px',
          letterSpacing: '-0.4px',
        }}>
          We'll Be Right Back
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#6b7280',
          lineHeight: 1.7,
          marginBottom: '28px',
          maxWidth: '360px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {message || 'The system is currently under maintenance. We\'re working to get things back up and running.'}
        </p>

        {/* Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: '#fefce8',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <Clock size={16} color="#d97706" />
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#92400e',
          }}>
            Maintenance in progress{dots}
          </span>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: '#f3f4f6',
          margin: '0 -8px 20px',
        }} />

        {/* Admin login */}
        <a href="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 20px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          fontSize: '0.84rem',
          fontWeight: 600,
          color: '#166534',
          textDecoration: 'none',
        }}>
          Admin Sign In
          <ArrowRight size={14} />
        </a>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: '32px',
        fontSize: '0.78rem',
        color: '#9ca3af',
      }}>
        BudMap &mdash; Budget Management Platform
      </p>
    </div>
  );
};

export default MaintenancePage;

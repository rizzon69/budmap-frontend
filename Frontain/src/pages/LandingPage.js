import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>BudMap</h2>
          </div>
          
          <div className="nav-menu-icon" onClick={toggleMenu}>
            {menuOpen ? '✕' : '☰'}
          </div>

          <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
            <li><a href="#about">What is BudMap?</a></li>
            <li><a href="#features">The App</a></li>
            <li><a href="#method">The Method</a></li>
            <li><a href="#difference">Why BudMap is Different</a></li>
            <li><a href="#guide">Get Started Guide</a></li>
            <li><button className="btn-login" onClick={() => navigate('/login')}>Log In</button></li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <h2>BudMap</h2>
              <button className="close-btn" onClick={toggleMenu}>✕</button>
            </div>
            
            <div className="mobile-menu-image">
              <div className="menu-placeholder-image">
                <span>💰</span>
              </div>
            </div>

            <div className="mobile-menu-section">
              <h3>What is BudMap?</h3>
              <ul>
                <li><a href="#features" onClick={toggleMenu}>The App</a></li>
                <li><a href="#method" onClick={toggleMenu}>The Method</a></li>
                <li><a href="#difference" onClick={toggleMenu}>Why BudMap is Different</a></li>
                <li><a href="#guide" onClick={toggleMenu}>Get Started Guide</a></li>
              </ul>
            </div>

            <button className="btn-mobile-login" onClick={() => {
              toggleMenu();
              navigate('/login');
            }}>
              Log In →
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Take Control of Your Organization's Budget</h1>
            <p className="hero-subtitle">
              Get BudMap. Get organized with your finances.
            </p>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Start Your Free Trial
            </button>
            <p className="trial-note">34-day free trial. No credit card required.</p>
          </div>

          <div className="hero-image">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-preview">
                  <div className="preview-header">
                    <h4>💰 Budget Overview</h4>
                  </div>
                  <div className="preview-item">
                    <span>📊 Total Budget</span>
                    <span className="amount positive">NPR 5M</span>
                  </div>
                  <div className="preview-item">
                    <span>💸 Spent</span>
                    <span className="amount negative">NPR 1.85M</span>
                  </div>
                  <div className="preview-item">
                    <span>💼 Department Budgets</span>
                    <span className="amount">4</span>
                  </div>
                  <div className="preview-item">
                    <span>📈 Monthly Summary</span>
                    <span className="badge">View</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Money Icons */}
            <div className="floating-icon icon-1">💵</div>
            <div className="floating-icon icon-2">💰</div>
            <div className="floating-icon icon-3">💸</div>
            <div className="floating-icon icon-4">💴</div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2>Welcome to BudMap</h2>
          <p className="section-subtitle">
            A smart, user-friendly budgeting solution tailored specifically for SMEs, NGOs, 
            and educational institutions in Nepal.
          </p>
          
          <div className="about-grid">
            <div className="about-card">
              <div className="card-icon">🎯</div>
              <h3>Purpose-Built for Nepal</h3>
              <p>
                Designed specifically for Nepalese organizations with features that align 
                with local fiscal calendars, tax codes, and reporting frameworks.
              </p>
            </div>
            
            <div className="about-card">
              <div className="card-icon">📊</div>
              <h3>Data-Driven Insights</h3>
              <p>
                Make informed decisions with predictive analytics, visual dashboards, 
                and automated reporting that help you understand your financial data.
              </p>
            </div>
            
            <div className="about-card">
              <div className="card-icon">🔒</div>
              <h3>Secure & Transparent</h3>
              <p>
                Role-based access control ensures secure collaboration while maintaining 
                complete transparency across your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2>The App</h2>
          <p className="section-subtitle">
            Everything you need to manage your organization's budget effectively
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>User Management</h3>
              <p>Role-based access for admins, finance officers, department heads, and viewers.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Budget Creation</h3>
              <p>Create, update, and allocate funds to departments or projects with ease.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Real-Time Dashboards</h3>
              <p>Visual charts for income vs. expenses and budget performance tracking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Advanced Filtering</h3>
              <p>Search and filter budgets by fiscal year, department, category, or status.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Predictive Analytics</h3>
              <p>AI-based budget forecasting and recommendations based on spending patterns.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Smart Alerts</h3>
              <p>Get notified about overspending, low budgets, or approaching deadlines.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Report Generation</h3>
              <p>Download customizable reports in multiple formats for stakeholders.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Internal Messaging</h3>
              <p>Collaborate with team members through built-in communication tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section id="method" className="method-section">
        <div className="container">
          <h2>The Method</h2>
          <p className="section-subtitle">
            A simple, proven approach to budget management
          </p>

          <div className="method-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Set Up Your Organization</h3>
                <p>Create your organization profile and add departments and team members.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Create Your Budget</h3>
                <p>Allocate funds to different categories and departments based on your needs.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Track Spending</h3>
                <p>Record transactions and monitor spending against your budget in real-time.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Analyze & Optimize</h3>
                <p>Use insights and reports to make informed decisions and improve efficiency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Difference Section */}
      <section id="difference" className="difference-section">
        <div className="container">
          <h2>Why BudMap is Different</h2>
          
          <div className="difference-grid">
            <div className="difference-card">
              <h3>💵 Cost-Effective</h3>
              <p>
                Free and open-source, making it accessible for organizations with limited budgets. 
                No expensive licensing fees or hidden costs.
              </p>
            </div>

            <div className="difference-card">
              <h3>🇳🇵 Built for Nepal</h3>
              <p>
                Designed with Nepal's fiscal calendar, tax codes, and reporting requirements in mind. 
                No more struggling with international tools that don't fit local needs.
              </p>
            </div>

            <div className="difference-card">
              <h3>👨‍💼 Easy to Use</h3>
              <p>
                User-friendly interface that works even for teams with limited digital skills. 
                No steep learning curve or complex setup.
              </p>
            </div>

            <div className="difference-card">
              <h3>🤝 Collaborative</h3>
              <p>
                Role-based access allows seamless collaboration across departments while 
                maintaining security and accountability.
              </p>
            </div>

            <div className="difference-card">
              <h3>📱 Optimized Performance</h3>
              <p>
                Lightweight interface ensures usability even in areas with poor internet connectivity. 
                Works smoothly on any device.
              </p>
            </div>

            <div className="difference-card">
              <h3>📊 Data-Driven</h3>
              <p>
                Make decisions based on actual financial trends, not assumptions. 
                Predictive analytics help you plan better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Guide Section */}
      <section id="guide" className="guide-section">
        <div className="container">
          <h2>Get Started Guide</h2>
          <p className="section-subtitle">
            Everything you need to know to start using BudMap effectively
          </p>

          <div className="guide-content">
            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-badge">Step 1</span>
                <h3>Create Your Account</h3>
              </div>
              <p>
                Sign up with your organization details. Choose your role (Admin, Finance Officer, 
                Department Head, or Viewer) and complete the email verification.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-badge">Step 2</span>
                <h3>Set Up Your Organization</h3>
              </div>
              <p>
                Add your organization information, create departments, and invite team members. 
                Assign roles based on responsibilities.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-badge">Step 3</span>
                <h3>Configure Budget Categories</h3>
              </div>
              <p>
                Set up income and expense categories that match your organization's needs. 
                BudMap comes with 12 pre-configured categories to get you started.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-badge">Step 4</span>
                <h3>Create Your First Budget</h3>
              </div>
              <p>
                Define your fiscal year, set total budget amount, and allocate funds across 
                departments and categories. Set approval workflows if needed.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-badge">Step 5</span>
                <h3>Start Tracking</h3>
              </div>
              <p>
                Record transactions, monitor spending, and generate reports. Use the dashboard 
                to get real-time insights into your financial performance.
              </p>
            </div>
          </div>

          <div className="cta-box">
            <h3>Ready to Get Started?</h3>
            <p>Start your 34-day free trial today. No credit card required.</p>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2>Contact Us</h2>
          
          <form className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label>NAME</label>
                <input type="text" placeholder="Your name" />
              </div>
              
              <div className="form-group">
                <label>EMAIL</label>
                <input type="email" placeholder="your.email@example.com" />
              </div>
            </div>

            <div className="form-group">
              <label>ADDRESS</label>
              <input type="text" placeholder="Your organization address" />
            </div>

            <div className="form-group">
              <label>QUERY</label>
              <textarea rows="5" placeholder="How can we help you?"></textarea>
            </div>

            <button type="submit" className="btn-submit">Send Message</button>
          </form>

          <div className="contact-info">
            <p><strong>CONTACT US AT:</strong></p>
            <p>Email: support@budmap.com.np</p>
            <p>Phone: +977-1-XXXXXXX</p>
            
            <p style={{ marginTop: '20px' }}><strong>FOLLOW US</strong></p>
            <div className="social-links">
              <a href="#facebook">Facebook</a>
              <a href="#twitter">Twitter</a>
              <a href="#linkedin">LinkedIn</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>BudMap</h3>
              <p>Budget Allocation Application for SMEs, NGOs, and Educational Institutions in Nepal</p>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#guide">Get Started</a></li>
                <li><a href="/login">Login</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 BudMap. Empowering SMEs, NGOs & Educational Institutions in Nepal.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

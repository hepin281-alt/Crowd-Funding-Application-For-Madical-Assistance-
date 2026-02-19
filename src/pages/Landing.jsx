import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero-content">
          <h1>CareFund</h1>
          <p className="hero-tagline">Medical Assistance Crowdfunding — Help those in need</p>
          <p className="hero-desc">
            Hospital-verified campaigns. Donations in escrow. Direct payout to hospitals.
          </p>
          <div className="hero-actions">
            <Link to="/signup">
              <button className="btn btn-primary btn-lg">Get Started</button>
            </Link>
            <Link to="/campaigns">
              <button className="btn btn-secondary btn-lg">Browse Campaigns</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="roles">
        <div className="container">
          <h2>Who are you?</h2>
          <div className="role-cards role-cards-grid">
            <Link to="/signup?role=donor" className="role-card card">
              <span className="role-icon">🤝</span>
              <h3>I want to help</h3>
              <p>Browse hospital-verified campaigns and donate. Funds go to escrow.</p>
              <span className="role-link">Sign up as Donor →</span>
            </Link>
            <Link to="/signup?role=campaigner" className="role-card card">
              <span className="role-icon">📋</span>
              <h3>I need help (Campaigner)</h3>
              <p>Create a campaign, select hospital. Hospital verifies with IPD No.</p>
              <span className="role-link">Sign up as Campaigner →</span>
            </Link>
            <Link to="/signup?role=hospital_admin" className="role-card card">
              <span className="role-icon">🏥</span>
              <h3>Hospital Admin</h3>
              <p>Verify campaigns claiming admission at your facility.</p>
              <span className="role-link">Sign up as Hospital Admin →</span>
            </Link>
            <Link to="/signup?role=employee" className="role-card card">
              <span className="role-icon">✓</span>
              <h3>Platform Admin</h3>
              <p>Manage hospitals, match invoices, trigger payouts to hospitals.</p>
              <span className="role-link">Sign up as Platform Admin →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

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

      <section className="about-section">
        <div className="container">
          <h2>What is CareFund?</h2>
          <p className="section-desc">
            CareFund is a transparent medical crowdfunding platform that connects patients in need with donors who want to help.
            We ensure every campaign is verified by hospitals, and all donations are held in escrow until medical expenses are confirmed.
          </p>
          <div className="features-grid">
            <div className="feature-item card">
              <span className="feature-icon">🔒</span>
              <h3>100% Secure</h3>
              <p>All donations are held in escrow and only released to hospitals after invoice verification.</p>
            </div>
            <div className="feature-item card">
              <span className="feature-icon">✓</span>
              <h3>Hospital Verified</h3>
              <p>Every campaign is verified by the hospital where the patient is admitted using their IPD number.</p>
            </div>
            <div className="feature-item card">
              <span className="feature-icon">💰</span>
              <h3>Direct to Hospital</h3>
              <p>Funds are paid directly to hospitals, ensuring money is used for medical treatment only.</p>
            </div>
            <div className="feature-item card">
              <span className="feature-icon">📊</span>
              <h3>Full Transparency</h3>
              <p>Track every donation and see exactly how funds are being utilized with invoice receipts.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <p className="section-desc">
            Our platform ensures transparency and trust at every step of the fundraising process.
          </p>

          <div className="workflow">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Campaign</h3>
                <p>Patient or family member creates a campaign with medical details and selects the hospital from our verified database.</p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Hospital Verification</h3>
                <p>Hospital admin receives notification and verifies the patient's admission using their IPD/Registration number.</p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Donations Begin</h3>
                <p>Once verified, the campaign goes live. Donors can contribute knowing the case is legitimate and hospital-verified.</p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Funds in Escrow</h3>
                <p>All donations are held securely in escrow until medical invoices are uploaded and verified by our team.</p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Invoice Verification</h3>
                <p>Campaigner uploads hospital invoices. Our platform team matches invoices with donations to ensure authenticity.</p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">6</div>
              <div className="step-content">
                <h3>Direct Payment</h3>
                <p>Verified funds are paid directly to the hospital's bank account. Donors receive receipts showing fund utilization.</p>
              </div>
            </div>
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

      <section className="trust-section">
        <div className="container">
          <h2>Why Trust CareFund?</h2>
          <div className="trust-grid">
            <div className="trust-item">
              <h3>🛡️ Verified Hospitals</h3>
              <p>We only work with verified hospitals in our database. Every hospital is vetted before joining our platform.</p>
            </div>
            <div className="trust-item">
              <h3>🔍 Complete Transparency</h3>
              <p>See exactly where your money goes. Every transaction is tracked and invoices are verified before fund release.</p>
            </div>
            <div className="trust-item">
              <h3>💳 Secure Payments</h3>
              <p>Your donations are protected with bank-grade security and held in escrow until verified.</p>
            </div>
            <div className="trust-item">
              <h3>📧 Regular Updates</h3>
              <p>Donors receive updates on campaign progress and receipts when funds are utilized.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [goalAmount, setGoalAmount] = useState(500000)
    const [avgDonation, setAvgDonation] = useState(2000)
    const [openFaq, setOpenFaq] = useState(0)
    const [trustView, setTrustView] = useState('beneficiary')

    if (user) {
        if (user.role === 'hospital_admin') {
            navigate('/admin-dashboard', { replace: true })
        } else if (user.role === 'super_admin') {
            navigate('/super-admin', { replace: true })
        } else {
            navigate('/dashboard', { replace: true })
        }
        return null
    }

    const calculator = useMemo(() => {
        const processingRate = 0.02
        const effectiveDonation = avgDonation * (1 - processingRate)
        const donorsNeeded = Math.max(1, Math.ceil(goalAmount / effectiveDonation))
        const dailyDonorTarget = Math.max(8, Math.ceil(donorsNeeded / 20))

        return {
            donorsNeeded,
            dailyDonorTarget,
            processingEstimate: Math.round(goalAmount * processingRate),
        }
    }, [goalAmount, avgDonation])

    const faqItems = [
        {
            q: 'How quickly can a campaign go live?',
            a: 'Most campaigns are reviewed after hospital verification and can go live the same day once mandatory documents are complete.',
        },
        {
            q: 'How is misuse prevented?',
            a: 'CareFund uses hospital verification, escrow hold, invoice checks, and admin audits before releasing funds to treatment providers.',
        },
        {
            q: 'Who receives the payout?',
            a: 'By default, verified invoices are settled directly to the hospital account to keep disbursement fully traceable.',
        },
        {
            q: 'Can hospitals track campaign progress?',
            a: 'Yes. Onboarded hospital admins can monitor linked campaigns, review documents, and validate treatment milestones.',
        },
    ]

    const rolePhotos = {
        donor: '/role-photos/donor.jpg',
        campaigner: '/role-photos/campaigner.jpg',
        hospital: '/role-photos/hospital.jpg',
    }

    const trustCards = {
        beneficiary: [
            {
                icon: '🎁',
                title: 'Zero Platform Fees',
                text: 'Only actual payment processing charges with voluntary tipping model',
            },
            {
                icon: '🕒',
                title: 'Fast Withdrawals',
                text: 'Within 24 hours for INR and 5 working days for foreign currencies',
            },
            {
                icon: '🤝',
                title: 'Employer Matching Benefits',
                text: 'Employers contribute towards donations by their employees doubling their impact',
            },
            {
                icon: '👥',
                title: 'Dedicated Support',
                text: 'Personal relationship managers available via WhatsApp, call and email',
            },
        ],
        donors: [
            {
                icon: '🔔',
                title: 'No Spam',
                text: 'We never call or spam you with donation requests via SMS or WhatsApp',
            },
            {
                icon: '📄',
                title: 'Full Transparency',
                text: 'Clear breakup of funds raised, fees deducted, and transfers',
            },
            {
                icon: '🛡️',
                title: 'Data Privacy',
                text: 'Your personal information is never shared with third parties',
            },
            {
                icon: '🕘',
                title: 'Regular Updates',
                text: 'Frequent beneficiary and project updates via email and WhatsApp',
            },
        ],
    }

    return (
        <div className="landing cf-home">
            <section className="cf-home-hero">
                <div className="container cf-home-hero-grid">
                    <div className="cf-home-hero-copy cf-home-hero-copy-v2">
                        <h1>
                            Crowdfunding for India with <span className="cf-home-accent">Trust</span> and
                            Transparency | CareFund
                        </h1>
                        <p>
                            From personal needs and medical emergencies to NGOs,
                            CareFund&apos;s crowdfunding platform makes it easy to raise funds in India.
                        </p>
                        <div className="cf-home-hero-actions">
                            <Link to="/signup" className="cf-home-btn-primary">Start a fundraiser</Link>
                        </div>
                    </div>

                    <div className="cf-home-hero-visual-wrap">
                        <div className="cf-home-hero-visual-card">
                            <div className="cf-home-hero-visual-glow" />
                            <img
                                src="/hero-care-illustration.svg"
                                alt="Hospital care and patient support"
                                className="cf-home-hero-visual-image"
                                loading="lazy"
                            />
                        </div>
                        <div className="cf-home-hero-floating-badge">
                            <strong>0%</strong>
                            <span>Platform Fees</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cf-home-trust">
                <div className="container">
                    <div className="cf-home-trust-head">
                        <h2>
                            Why People Trust <span className="cf-home-accent">CareFund</span>
                        </h2>
                        <p>Our commitment to transparency and user-first policies sets us apart</p>
                    </div>

                    <div className="cf-home-trust-tabs" role="tablist" aria-label="Trust categories">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={trustView === 'beneficiary'}
                            className={`cf-home-trust-tab ${trustView === 'beneficiary' ? 'active' : ''}`}
                            onClick={() => setTrustView('beneficiary')}
                        >
                            Beneficiary
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={trustView === 'donors'}
                            className={`cf-home-trust-tab ${trustView === 'donors' ? 'active' : ''}`}
                            onClick={() => setTrustView('donors')}
                        >
                            Donors
                        </button>
                    </div>

                    <div className="cf-home-trust-grid">
                        {trustCards[trustView].map((card) => (
                            <article key={card.title} className="cf-home-trust-card">
                                <span className="cf-home-trust-icon" aria-hidden="true">{card.icon}</span>
                                <h3>{card.title}</h3>
                                <p>{card.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cf-home-calculator">
                <div className="container cf-home-calculator-wrap">
                    <div className="cf-home-calculator-copy">
                        <h2>Fundraiser Goal Planner</h2>
                        <p>
                            Estimate the donor effort required and plan your outreach with realistic daily targets.
                            This helps families set actionable campaign goals instead of guesswork.
                        </p>
                    </div>
                    <div className="cf-home-calculator-card">
                        <label>
                            Target amount: <strong>Rs. {goalAmount.toLocaleString('en-IN')}</strong>
                            <input
                                type="range"
                                min="50000"
                                max="5000000"
                                step="50000"
                                value={goalAmount}
                                onChange={(e) => setGoalAmount(Number(e.target.value))}
                            />
                        </label>

                        <label>
                            Expected average donation
                            <select value={avgDonation} onChange={(e) => setAvgDonation(Number(e.target.value))}>
                                <option value={500}>Rs. 500</option>
                                <option value={1000}>Rs. 1,000</option>
                                <option value={2000}>Rs. 2,000</option>
                                <option value={5000}>Rs. 5,000</option>
                                <option value={10000}>Rs. 10,000</option>
                            </select>
                        </label>

                        <div className="cf-home-calc-results">
                            <div>
                                <span>Estimated donors needed</span>
                                <strong>{calculator.donorsNeeded}</strong>
                            </div>
                            <div>
                                <span>Daily donor target (20 days)</span>
                                <strong>{calculator.dailyDonorTarget}/day</strong>
                            </div>
                            <div>
                                <span>Gateway + processing estimate</span>
                                <strong>Rs. {calculator.processingEstimate.toLocaleString('en-IN')}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cf-home-process">
                <div className="container">
                    <h2>How CareFund Works</h2>
                    <div className="cf-home-process-grid">
                        <div className="step-card">
                            <span>01</span>
                            <h3>Create Campaign</h3>
                            <p>Submit patient details, target amount, and treatment documents.</p>
                        </div>
                        <div className="step-card">
                            <span>02</span>
                            <h3>Hospital Validation</h3>
                            <p>Hospital admin verifies patient admission and treatment context.</p>
                        </div>
                        <div className="step-card">
                            <span>03</span>
                            <h3>Public Funding</h3>
                            <p>Campaign goes live for donors with verification-backed confidence.</p>
                        </div>
                        <div className="step-card">
                            <span>04</span>
                            <h3>Escrow and Audit</h3>
                            <p>Funds are held securely until treatment invoices are approved.</p>
                        </div>
                        <div className="step-card">
                            <span>05</span>
                            <h3>Invoice Match</h3>
                            <p>Super Admin checks uploaded bills against campaign transactions.</p>
                        </div>
                        <div className="step-card">
                            <span>06</span>
                            <h3>Direct Settlement</h3>
                            <p>Approved amount is settled to verified hospital account records.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cf-home-roles">
                <div className="container">
                    <h2>Choose Your Path</h2>
                    <div className="cf-home-role-grid">
                        <Link to="/signup?role=donor" className="cf-home-role-card">
                            <img
                                src={rolePhotos.donor}
                                alt="Donor supporting a medical fundraiser"
                                className="cf-home-role-image"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = '/role-donor.svg'
                                }}
                            />
                            <h3>Donor</h3>
                            <p>Support verified treatment cases with transparent payout tracking.</p>
                            <span>Join as donor</span>
                        </Link>
                        <Link to="/signup?role=campaigner" className="cf-home-role-card">
                            <img
                                src={rolePhotos.campaigner}
                                alt="Campaigner planning outreach for a fundraiser"
                                className="cf-home-role-image"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = '/role-campaigner.svg'
                                }}
                            />
                            <h3>Campaigner</h3>
                            <p>Raise critical funds with structured verification and clear progress.</p>
                            <span>Start campaign setup</span>
                        </Link>
                        <Link to="/partner-with-us" className="cf-home-role-card">
                            <img
                                src={rolePhotos.hospital}
                                alt="Hospital partner and care staff in medical setting"
                                className="cf-home-role-image"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = '/role-hospital.svg'
                                }}
                            />
                            <h3>Hospital Partner</h3>
                            <p>Onboard your institution and authorize campaign legitimacy faster.</p>
                            <span>Partner with CareFund</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="cf-home-faq">
                <div className="container cf-home-faq-wrap">
                    <div>
                        <h2>Frequently Asked Questions</h2>
                        <p>
                            Clarity builds trust. Here are the most common questions from families,
                            hospital partners, and donors before they start.
                        </p>
                    </div>
                    <div className="cf-home-faq-list">
                        {faqItems.map((item, idx) => (
                            <article key={item.q} className={`cf-home-faq-item ${openFaq === idx ? 'open' : ''}`}>
                                <button type="button" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                                    <span>{item.q}</span>
                                    <strong>{openFaq === idx ? '-' : '+'}</strong>
                                </button>
                                {openFaq === idx && <p>{item.a}</p>}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cf-home-final-cta">
                <div className="container cf-home-final-cta-wrap">
                    <div>
                        <h2>Ready to mobilize support for treatment?</h2>
                        <p>Create a fundraiser in minutes and publish only after trusted verification steps are complete.</p>
                    </div>
                    <div className="cf-home-final-cta-actions">
                        <Link to="/signup" className="cf-home-btn-primary">Create fundraiser</Link>
                        <Link to="/partner-with-us" className="cf-home-btn-secondary">Hospital onboarding</Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

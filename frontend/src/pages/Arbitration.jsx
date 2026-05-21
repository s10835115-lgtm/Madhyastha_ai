import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, CheckCircle, Clock, User, AlertCircle, ShieldCheck, Star, Globe, ArrowRight } from 'lucide-react'
import EscalationTracker from '../components/EscalationTracker'

export default function ArbitrationPage() {
  const { disputeId } = useParams()
  const { API_URL, token } = useAppContext()
  const navigate = useNavigate()
  const [arbitrators, setArbitrators] = useState([])
  const [selectedArb, setSelectedArb] = useState(null)
  const [assigned, setAssigned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => { loadArbitrators() }, [])

  const loadArbitrators = async () => {
    try {
      const res = await fetch(`${API_URL}/arbitrator/available`)
      if (res.ok) setArbitrators(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const assignArbitrator = async () => {
    if (!selectedArb) return
    setAssigning(true)
    try {
      const res = await fetch(`${API_URL}/arbitrator/${disputeId}/assign?arbitrator_id=${selectedArb}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) setAssigned(true)
    } catch (e) { console.error(e) }
    finally { setAssigning(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, marginBottom: 16 }} />
      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading arbitrators...</p>
    </div>
  )

  if (assigned) return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(72,187,120,0.1)',
                   border: '2px solid rgba(72,187,120,0.3)', display: 'flex', alignItems: 'center',
                   justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={40} style={{ color: '#48bb78' }} />
        </motion.div>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>
          Arbitrator Assigned!
        </h2>
        <p style={{ color: '#64748b', marginBottom: 8, lineHeight: 1.7 }}>
          Your request has been sent to the selected arbitrator. Once they accept, you'll be able to join the arbitration session.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 24 }}>
          The arbitrator will review the case brief and join the session as the presiding officer.
        </p>
        <EscalationTracker currentStage="arbitration" />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/session/${disputeId}`)}
          className="btn-primary" style={{ marginTop: 24, padding: '14px 32px', fontSize: '1rem' }}>
          Go to Session
        </motion.button>
      </motion.div>
    </div>
  )

  const [briefSections, setBriefTimeline] = useState([
    { number: 1, heading: 'Case Summary', status: 'completed', content: 'Dispute over unpaid loan of ₹5,00,000.' },
    { number: 2, heading: 'Evidence Review', status: 'completed', content: 'Promissory note and bank statements verified.' },
    { number: 3, heading: 'Mediation History', status: 'completed', content: 'AI mediation failed after 3 rounds due to deadlock.' },
    { number: 4, heading: 'Legal Analysis', status: 'in_progress', content: 'Applying Negotiable Instruments Act, 1881.' },
  ])

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <div className="split-layout">
        
        {/* Left: Arbitrator Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--primary)', marginBottom: 8 }}>
              Arbitration <span style={{ color: 'var(--secondary)' }}>Portal</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.85rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--secondary)' }} />
              Certified under Arbitration & Conciliation Act, 1996
            </div>
          </motion.div>

          <EscalationTracker currentStage="arbitration" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Available Arbitrators</h3>
            {arbitrators.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
                <AlertCircle size={32} color="var(--warning)" style={{ marginBottom: 12 }} />
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No arbitrators online at the moment.</p>
              </div>
            ) : (
              arbitrators.map((arb, i) => (
                <motion.div key={arb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedArb(arb.id)}
                  className="glass-card" style={{
                    padding: '16px 20px', cursor: 'pointer', border: '1px solid',
                    borderColor: selectedArb === arb.id ? 'var(--secondary)' : 'var(--border)',
                    background: selectedArb === arb.id ? 'var(--secondary-glow)' : 'white'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gavel size={18} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{arb.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bar Reg: {arb.bar_registration || 'NP-2024-X'}</div>
                    </div>
                    {selectedArb === arb.id && <CheckCircle size={16} color="var(--secondary)" />}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right: AI Brief Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-static" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} color="var(--accent)" /> AI Case Brief
            </h3>
            
            <div style={{ marginTop: 12 }}>
              {briefSections.map((s, i) => (
                <div key={i} className={`timeline-item ${s.status === 'completed' ? 'completed' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: s.status === 'completed' ? 'var(--success)' : 'var(--primary)' }}>{s.heading}</span>
                    {s.status === 'in_progress' && <div className="spinner" style={{ width: 12, height: 12 }} />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.content}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: 20, borderRadius: 16, background: '#f8fafc', border: '1px dashed var(--border)' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>Hearing Schedule</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#64748b" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tentative: Today, 4:30 PM</span>
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginTop: 16, padding: '10px', fontSize: '0.85rem' }} disabled={!selectedArb}>
                Request Hearing
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

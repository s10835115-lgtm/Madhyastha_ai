import React, { useState, useEffect } from 'react'
import { useAppContext } from '../App'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Send, MapPin, Zap, Shield, Eye, Smartphone, Globe } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.19, 1, 0.22, 1] },
})

export default function Admin() {
  const { API_URL } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [scoringParty, setScoringParty] = useState('PROP-BLR-2024-78901')
  const [riskScore, setRiskScore] = useState(84)
  const [selectedLang, setSelectedLang] = useState('Kannada')

  const civicEvents = [
    { date: '2 days ago', event: 'Unauthorized construction complaint filed on CPGRAMS', type: 'cgrams', source: 'CPGRAMS' },
    { date: '1 week ago', event: 'Property tax payment overdue for 18 months', type: 'tax', source: 'Municipal' },
    { date: '2 weeks ago', event: 'RERA notice issued for project delay', type: 'rera', source: 'RERA' }
  ]

  const nudgeMessages = {
    'Kannada': 'ನಮಸ್ಕಾರ, ನಿಮ್ಮ ಆಸ್ತಿ ವಿವಾದದ ಬಗ್ಗೆ ನಮಗೆ ತಿಳಿದಿದೆ. ನ್ಯಾಯಾಲಯಕ್ಕೆ ಹೋಗುವ ಮೊದಲು ಇದನ್ನು ಶಾಂತಿಯುತವಾಗಿ ಬಗೆಹರಿಸಲು ನಾವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು.',
    'English': 'Hello, we noticed a potential property dispute. We can help you resolve this amicably through AI mediation before it reaches court.',
    'Hindi': 'नमस्ते, हमने संपत्ति विवाद की संभावना देखी है। हम इसे अदालत पहुंचने से पहले सुलझाने में आपकी मदद कर सकते हैं।',
    'Tamil': 'வணக்கம், உங்கள் சொத்து தகராறு குறித்து எங்களுக்குத் தெரியும். நீதிமன்றத்திற்குச் செல்வதற்கு முன் இதைச் சுமூகமாகத் தீர்க்க நாங்கள் உங்களுக்கு உதவலாம்.'
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <motion.div {...fadeUp()} style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a', marginBottom: 4 }}>
          Prevention <span style={{ color: 'var(--primary)' }}>Engine</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Predictive analytics & early dispute intervention system</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Risk Scorer & Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <motion.div {...fadeUp(0.1)} className="glass-card">
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={20} color="var(--primary)" /> Early Risk Detection
            </h3>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <select className="input-field" value={scoringParty} onChange={e => setScoringParty(e.target.value)} style={{ flex: 1 }}>
                <option value="PROP-BLR-2024-78901">🏠 PROP-BLR-2024-78901 (Bengaluru)</option>
                <option value="PROP-MUM-2024-34567">🏢 PROP-MUM-2024-34567 (Mumbai)</option>
              </select>
              <button className="btn-primary" style={{ padding: '0 24px' }}>
                <Zap size={16} /> Run Analysis
              </button>
            </div>
            
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 20, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Calculated Dispute Risk</span>
                <span className="badge badge-danger" style={{ fontSize: '0.8rem' }}>High Risk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${riskScore}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    <span>LOW</span>
                    <span>MODERATE</span>
                    <span>CRITICAL</span>
                  </div>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit', color: '#ef4444', lineHeight: 1 }}>{riskScore}%</div>
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="glass-card">
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={18} color="var(--primary)" /> Civic Event Trail
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {civicEvents.map((e, i) => (
                <div key={i} style={{ padding: '16px 20px', borderRadius: 16, background: 'white', border: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'start' }}>
                  <div style={{ padding: 10, borderRadius: 12, background: '#fff7ed', border: '1px solid #ffedd5' }}>
                    <AlertTriangle size={16} color="#f97316" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>{e.event}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> Bengaluru, KA
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{e.date}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{e.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: WhatsApp Nudge */}
        <motion.div {...fadeUp(0.3)} className="glass-card" style={{ background: '#f0fdfa', borderColor: 'rgba(13, 148, 136, 0.2)', position: 'sticky', top: 100 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={18} color="var(--secondary)" /> WhatsApp Nudge
          </h3>
          
          <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 10px 30px rgba(13, 148, 136, 0.1)', border: '1px solid rgba(13, 148, 136, 0.1)', position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', top: -8, left: 24, width: 16, height: 16, background: 'white', transform: 'rotate(45deg)', borderLeft: '1px solid rgba(13, 148, 136, 0.1)', borderTop: '1px solid rgba(13, 148, 136, 0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="white" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 800 }}>Madhyastha Resolution</div>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>
              {nudgeMessages[selectedLang]}
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f0fdf4', color: '#10b981', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', border: '1px solid #bbf7d0' }}>HELP NEEDED</div>
              <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', border: '1px solid #e2e8f0' }}>IGNORE</div>
            </div>
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--secondary)', display: 'block', marginBottom: 12, letterSpacing: '0.05em' }}>
              <Globe size={12} style={{ display: 'inline', marginRight: 6 }} /> Language Switcher
            </label>
            <div className="pill-selector">
              {Object.keys(nudgeMessages).map(l => (
                <div key={l} className={`pill ${selectedLang === l ? 'selected' : ''}`} 
                  onClick={() => setSelectedLang(l)}
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}>{l}</div>
              ))}
            </div>
          </div>

          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            <Send size={16} /> Deploy Intervention
          </button>
        </motion.div>

      </div>
    </div>
  )
}

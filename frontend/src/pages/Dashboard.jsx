import React, { useState, useEffect } from 'react'
import { useAppContext } from '../App'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart3, Users, CheckCircle, Gavel, AlertTriangle, TrendingUp, FileText, Activity, ArrowUpRight, Shield, Zap, Eye, Send, MapPin, Search, Filter, ExternalLink } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

const COLORS = ['#4c1d95', '#0d9488', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#38b2ac', '#ecc94b', '#9f7aea', '#fc8181']

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.19, 1, 0.22, 1] },
})

function StatCard({ icon: Icon, label, value, color, trend, delay }) {
  return (
    <motion.div {...fadeUp(delay)} className="glass-card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px',
                    background: `${color}08`, zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}10`, border: `1px solid ${color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} style={{ color }} />
          </div>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600, color: '#10b981' }}>
              <ArrowUpRight size={12} /> {trend}
            </div>
          )}
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1.1, color: '#0f172a' }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      </div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(76, 29, 149, 0.1)', borderRadius: 12,
                  padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
      <p style={{ color: '#475569', fontSize: '0.78rem', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#4c1d95', fontWeight: 700, fontSize: '0.88rem' }}>{p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { API_URL } = useAppContext()
  const [stats, setStats] = useState(null)
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [sr, dr] = await Promise.all([
        fetch(`${API_URL}/dispute/stats/summary`), fetch(`${API_URL}/dispute/all`),
      ])
      if (sr.ok) setStats(await sr.json())
      if (dr.ok) setDisputes(await dr.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner" /></div>

  const statCards = stats ? [
    { label: 'Total Disputes', value: stats.total_disputes, icon: FileText, color: '#4c1d95', trend: '+12%' },
    { label: 'Active Mediation', value: stats.active_disputes, icon: Activity, color: '#0d9488', trend: null },
    { label: 'Resolved Cases', value: stats.resolved_disputes, icon: CheckCircle, color: '#10b981', trend: '+5%' },
    { label: 'In Arbitration', value: stats.escalated_to_arbitration, icon: Gavel, color: '#8b5cf6', trend: null },
  ] : []

  const resolutionRateData = [
    { name: 'AI Mediation', value: 65, color: '#4c1d95' },
    { name: 'Human Mediation', value: 20, color: '#0d9488' },
    { name: 'Arbitration', value: 15, color: '#8b5cf6' },
  ]

  const statusBadge = (s) => {
    const m = { registered: 'badge-neutral', awaiting_party_b: 'badge-warning', caucus_a: 'badge-active',
      caucus_b: 'badge-active', synthesis: 'badge-active', joint_session: 'badge-active',
      agreement_pending: 'badge-warning', resolved: 'badge-success', escalated_human: 'badge-warning',
      escalated_arbitration: 'badge-danger', arbitration_hearing: 'badge-warning', award_issued: 'badge-success',
      court_filing: 'badge-danger', closed: 'badge-neutral' }
    return m[s] || 'badge-neutral'
  }

  const filteredDisputes = disputes.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.dispute_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
        <motion.div {...fadeUp()}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a', marginBottom: 4 }}>
            Case <span style={{ color: 'var(--primary)' }}>Dashboard</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Welcome back, Counsel. Here is your overview.</p>
        </motion.div>
        <motion.div {...fadeUp(0.1)} style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input-field" placeholder="Search disputes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 40, width: 260, borderRadius: 100 }} />
          </div>
          <button className="btn-secondary" style={{ padding: '10px 20px', borderRadius: 100 }}>
            <Filter size={16} /> Filter
          </button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="metrics-grid">
        {statCards.map((c, i) => (
          <StatCard key={i} {...c} delay={i * 0.06} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, marginBottom: 32 }}>
        
        {/* Active Disputes List */}
        <motion.div {...fadeUp(0.3)} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Active Disputes</h3>
            <span className="badge badge-active">{filteredDisputes.length} Cases</span>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ textAlign: 'left' }}>
                  {['Title', 'Type', 'Status', 'Risk', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 28px', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '18px 28px', fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{d.title}</td>
                    <td style={{ padding: '18px 28px', color: '#64748b', fontSize: '0.85rem' }}>{d.dispute_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '18px 28px' }}><span className={`badge ${statusBadge(d.status)}`}>{d.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ padding: '18px 28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, width: 60, background: '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ width: `${d.risk_score || 20}%`, height: '100%', background: (d.risk_score || 20) > 70 ? '#ef4444' : '#10b981', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{d.risk_score || 20}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 28px' }}>
                      {(d.status === 'joint_session' || d.status === 'arbitration_hearing') && (
                        <Link to={`/session/${d.id}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8 }}>
                          Join <ExternalLink size={12} />
                        </Link>
                      )}
                      {d.status === 'agreement_pending' && (
                        <Link to={`/agreement/${d.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8 }}>
                          Sign <ExternalLink size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Resolution Rate Breakdown */}
        <motion.div {...fadeUp(0.4)} className="glass-card">
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 24 }}>Resolution Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={resolutionRateData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                {resolutionRateData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resolutionRateData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

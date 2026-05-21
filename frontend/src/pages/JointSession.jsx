import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Users, AlertTriangle, CheckCircle, Wifi, WifiOff, Bot, User, MessageSquare, Flame, Mic, MicOff, Volume2, Square } from 'lucide-react'
import EscalationTracker from '../components/EscalationTracker'
import useSpeechToText from '../hooks/useSpeechToText'

export default function JointSession() {
  const { disputeId } = useParams()
  const [searchParams] = useSearchParams()
  const { API_URL, token: savedToken } = useAppContext()
  const navigate = useNavigate()
  const token = searchParams.get('token') || savedToken

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const [signal, setSignal] = useState(null)
  const [escalationScore, setEscalationScore] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(null) // track which msg is being spoken
  const wsRef = useRef(null)
  const chatEndRef = useRef(null)
  const audioRef = useRef(null)
  const abortControllerRef = useRef(null)

  const { isListening, transcript, startListening, stopListening, isSupported: sttSupported } = useSpeechToText()

  useEffect(() => {
    if (transcript) {
      setInput(prev => (prev ? prev + ' ' + transcript : transcript))
    }
  }, [transcript])

  useEffect(() => { loadSession(); connectWebSocket(); return () => { if (wsRef.current) wsRef.current.close() } }, [disputeId])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadSession = async () => {
    try {
      const res = await fetch(`${API_URL}/session/${disputeId}`)
      if (res.ok) { 
        const data = await res.json()
        if (data.messages) setMessages(data.messages) 
        setError(null)
      } else {
        const errData = await res.json()
        setError(errData.detail || 'Failed to load session')
      }
    } catch (e) { 
      console.error('Failed to load session', e)
      setError('Connection error. Please check your network.')
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    const wsUrl = API_URL.replace('http', 'ws')
    const ws = new WebSocket(`${wsUrl}/ws/session/${disputeId}?token=${token}`)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'history') setMessages(data.messages || [])
      else if (data.type === 'message') {
        setMessages(p => [...p, data])
        if (data.escalation_score !== undefined) setEscalationScore(data.escalation_score)
        // Auto-play AI messages
        if (data.role === 'mediator') {
          playTTS(data.content, data.id || Date.now())
        }
      }
      else if (data.type === 'system') setMessages(p => [...p, { role: 'system', content: data.content }])
      else if (data.type === 'signal') {
        setSignal(data.signal)
        if (data.escalation_score !== undefined) setEscalationScore(data.escalation_score)
      }
    }
  }

  const playTTS = async (text, msgId) => {
    try {
      // Cancel any ongoing fetch request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // If clicking the same message that is already speaking, stop it
      if (isSpeaking === msgId && audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsSpeaking(null)
        return
      }

      // If something else is speaking, stop it first
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsSpeaking(msgId)

      const res = await fetch(`${API_URL}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, use_elevenlabs: true }),
        signal: controller.signal
      })

      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        audioRef.current.onended = () => {
          setIsSpeaking(null)
          abortControllerRef.current = null
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('TTS Error:', e)
        setIsSpeaking(null)
        abortControllerRef.current = null
      }
    }
  }

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ message: input.trim() }))
    setInput('')
  }

  const getRoleStyle = (role) => {
    if (role === 'party_a') return { bg: '#f0f4ff', color: '#667eea', border: '#667eea', icon: User }
    if (role === 'party_b') return { bg: '#f0fff4', color: '#48bb78', border: '#48bb78', icon: User }
    if (role === 'mediator') return { bg: '#ffffff', color: '#764ba2', border: '#764ba2', icon: Bot }
    if (role === 'arbitrator') return { bg: '#fffaf0', color: '#ed8936', border: '#ed8936', icon: Users }
    return { bg: '#f1f5f9', color: '#64748b', border: '#64748b', icon: MessageSquare }
  }

  const [settlementOptions, setSettlementOptions] = useState([
    { id: 'A', title: 'Structured Repayment', terms: 'Pay 50% now, 50% in 6 months', precedent: 'State Bank of India vs. Santosh Gupta (2016)' },
    { id: 'B', title: 'Full Waiver of Interest', terms: 'Pay principal amount only within 30 days', precedent: 'Central Bank of India vs. Ravindra (2001)' }
  ])
  const [selectedOption, setSelectedOption] = useState(null)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 20 }}>
      <div className="spinner" />
      <p style={{ color: '#64748b', fontWeight: 600 }}>Initializing joint session...</p>
    </div>
  )

  if (error) return (
    <div style={{ maxWidth: 500, margin: '100px auto', textAlign: 'center', padding: '0 24px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: 40 }}>
        <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom: 20 }} />
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', marginBottom: 12 }}>Session Unavailable</h2>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%', justifyContent: 'center' }}>
            Back to Dashboard
          </button>
          <button className="btn-secondary" onClick={() => loadSession()} style={{ width: '100%', justifyContent: 'center', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
            Retry Loading
          </button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <div className="split-layout">
        
        {/* Left: Chat Session */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-static" style={{ padding: '16px 24px', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="white" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Joint Mediation</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Real-time session with AI Mediator</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`badge ${connected ? 'badge-success' : 'badge-danger'}`} style={{ gap: 6 }}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />} {connected ? 'Live' : 'Disconnected'}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-static" style={{ borderRadius: 20, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <AnimatePresence>
                {messages.map((msg, i) => {
                  const isSystem = msg.role === 'system'
                  const style = getRoleStyle(msg.role)
                  const isSelf = msg.role === 'party_a' || msg.role === 'party_b'

                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: isSelf ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                      style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: isSystem ? 'center' : isSelf ? 'flex-end' : 'flex-start' }}>
                      {isSystem ? (
                        <div style={{ textAlign: 'center', margin: '16px 0' }}>
                          <span className="badge badge-active">{msg.content}</span>
                        </div>
                      ) : (
                        <div style={{ maxWidth: '85%' }}>
                          <div style={{ fontSize: '0.72rem', color: style.color, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: isSelf ? 'flex-end' : 'flex-start', gap: 6 }}>
                            {msg.party_name || (msg.role === 'mediator' ? 'AI Mediator' : msg.role)}
                            {msg.role === 'mediator' && (
                              <button onClick={() => playTTS(msg.content, i)} style={{ background: 'none', border: 'none', color: isSpeaking === i ? 'var(--danger)' : '#94a3b8', cursor: 'pointer', padding: 0 }}>
                                {isSpeaking === i ? <Square size={12} fill="var(--danger)" /> : <Volume2 size={12} />}
                              </button>
                            )}
                          </div>
                          <div className={isSelf ? `chat-bubble chat-bubble-party-${token === 'party_a' ? 'a' : 'b'}` : (msg.role === 'mediator' ? 'chat-bubble chat-bubble-ai' : `chat-bubble chat-bubble-party-${token === 'party_a' ? 'b' : 'a'}`)}>
                            {msg.content}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'white' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <textarea className="input-field" placeholder="Type your message..."
                  value={input} onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  style={{ borderRadius: 16, minHeight: '48px', maxHeight: '120px' }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={sendMessage} className="btn-primary" style={{ padding: '12px', borderRadius: '50%' }}>
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Settlement Options & Precedents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-static" style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} color="var(--accent)" /> Settlement Options
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {settlementOptions.map(opt => (
                <motion.div key={opt.id} whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedOption(opt.id)}
                  style={{ 
                    padding: 16, borderRadius: 16, cursor: 'pointer', border: '1px solid',
                    borderColor: selectedOption === opt.id ? 'var(--primary)' : 'var(--border)',
                    background: selectedOption === opt.id ? 'var(--primary-glow)' : 'white',
                    transition: 'all 0.3s'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.8rem' }}>OPTION {opt.id}</span>
                    {selectedOption === opt.id && <CheckCircle size={16} color="var(--primary)" />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{opt.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>{opt.terms}</div>
                  
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>Legal Precedent</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>{opt.precedent}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>Escalation Status</h4>
              <div style={{ padding: 20, borderRadius: 16, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Flame size={16} color="var(--warning)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--warning)' }}>Risk Level: {Math.round(escalationScore * 100)}%</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${escalationScore * 100}%` }} style={{ height: '100%', background: 'var(--warning)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}

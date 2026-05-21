import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Lock, AlertCircle, CheckCircle, Bot, User, Sparkles, ShieldCheck, Users, Mic, MicOff, Volume2, Square } from 'lucide-react'
import EscalationTracker from '../components/EscalationTracker'
import useSpeechToText from '../hooks/useSpeechToText'

export default function Caucus() {
  const { API_URL, setToken } = useAppContext()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [partyInfo, setPartyInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [statementComplete, setStatementComplete] = useState(false)
  const [extractedStatement, setExtractedStatement] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [waitingForOther, setWaitingForOther] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(null)
  const chatEndRef = useRef(null)
  const audioRef = useRef(null)
  const abortControllerRef = useRef(null)

  const { isListening, transcript, startListening, stopListening, isSupported: sttSupported } = useSpeechToText()

  useEffect(() => {
    if (transcript) {
      setInput(prev => (prev ? prev + ' ' + transcript : transcript))
    }
  }, [transcript])

  // Initial token verification
  useEffect(() => { if (token) verifyToken() }, [token])

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Poll for joint session after statement submitted (runs only when submitted=true)
  useEffect(() => {
    if (!submitted || !token) return
    setWaitingForOther(true)

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/caucus/verify-token`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (data.valid) {
          setPartyInfo(data)
          if (data.status === 'joint_session') {
            clearInterval(interval)
            setWaitingForOther(false)
            // Both parties submitted and synthesis complete — navigate to the shared joint session
            navigate(`/session/${data.dispute_id}?token=${token}`)
          }
        }
      } catch {}
    }, 3000)

    return () => clearInterval(interval)
  }, [submitted, token])

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/caucus/verify-token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.valid) {
        setPartyInfo(data); setVerified(true); setToken(token)
        // If already in joint session, go directly
        if (data.status === 'joint_session') navigate(`/session/${data.dispute_id}?token=${token}`)
      } else { setError('Invalid or expired session token.') }
    } catch { setError('Failed to verify token.') }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim(); setInput(''); setLoading(true)
    setMessages(p => [...p, { role: 'user', content: msg }])
    try {
      const res = await fetch(`${API_URL}/caucus/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setMessages(p => [...p, { role: 'ai', content: data.ai_response }])
      if (data.statement_complete) { setStatementComplete(true); setExtractedStatement(data.extracted_statement) }
      // Auto-play AI response
      playTTS(data.ai_response, messages.length + 1)
    } catch { setMessages(p => [...p, { role: 'ai', content: 'Connection error. Please try again.' }]) }
    finally { setLoading(false) }
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

  const submitStatement = async () => {
    if (!extractedStatement) return; setLoading(true)
    try {
      const res = await fetch(`${API_URL}/caucus/submit-statement`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(extractedStatement),
      })
      if (res.ok) setSubmitted(true)
    } catch { setError('Failed to submit.') }
    finally { setLoading(false) }
  }

  // ─── No Token ───────────────────────────────────────
  if (!token) return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <AlertCircle size={52} style={{ color: '#ed8936', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', marginBottom: 8 }}>No Session Token</h2>
        <p style={{ color: '#64748b' }}>Use the session link provided during dispute registration.</p>
      </motion.div>
    </div>
  )

  // ─── Error ──────────────────────────────────────────
  if (error) return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <AlertCircle size={52} style={{ color: '#fc5c65', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem' }}>{error}</h2>
      </motion.div>
    </div>
  )

  // ─── Statement Submitted — Waiting for Other Party ──
  if (submitted) return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(72,187,120,0.1)',
                   border: '2px solid rgba(72,187,120,0.3)', display: 'flex', alignItems: 'center',
                   justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldCheck size={40} style={{ color: '#48bb78' }} />
        </motion.div>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>Statement Locked!</h2>
        <p style={{ color: '#64748b', marginBottom: 20, lineHeight: 1.7 }}>
          Your private statement has been securely recorded. Once the other party completes their session, you will both be redirected to the <strong>Joint Mediation Session</strong> automatically.
        </p>

        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
                   padding: '14px 24px', borderRadius: 14, background: 'rgba(102,126,234,0.08)',
                   border: '1px solid rgba(102,126,234,0.2)', marginBottom: 24 }}>
          <Users size={18} style={{ color: '#667eea' }} />
          <span style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: 600 }}>
            Waiting for other party to complete their caucus...
          </span>
        </motion.div>

        <EscalationTracker currentStage={partyInfo?.status || 'caucus'} />

        {partyInfo?.status === 'joint_session' && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/session/${partyInfo.dispute_id}?token=${token}`)}
            className="btn-primary" style={{ marginTop: 24, padding: '14px 32px', fontSize: '1rem' }}>
            Join Session
          </motion.button>
        )}
      </motion.div>
    </div>
  )



  // ─── Main Caucus Chat ──────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-static" style={{ padding: '16px 24px', marginBottom: 12, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>
            Private Caucus — {partyInfo?.party_name}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            {partyInfo?.dispute_title} &bull; {partyInfo?.role === 'party_a' ? 'Complainant' : 'Respondent'}
          </p>
        </div>
        <div className="badge badge-active">
          <Lock size={10} /> Private
        </div>
      </motion.div>

      <EscalationTracker currentStage="caucus" />

      {/* Main Chat Interface */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-static" style={{ marginTop: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', height: '65vh', overflow: 'hidden', position: 'relative' }}>
        
        {!verified && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 40, textAlign: 'center' }}>
            <Lock size={48} color="var(--primary)" style={{ marginBottom: 20, opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', marginBottom: 12 }}>Locked Private Session</h3>
            <p style={{ color: '#64748b', maxWidth: 320 }}>Please verify your identity to access this confidential caucus session.</p>
          </div>
        )}

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Bot size={32} color="var(--primary)" />
              </div>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>The AI Mediator is ready to begin your private interview.</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%' }}>
                  <div style={{ fontSize: '0.72rem', color: msg.role === 'user' ? 'var(--primary)' : 'var(--secondary)', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {msg.role === 'user' ? (partyInfo?.name || 'You') : 'AI Mediator'}
                    {msg.role === 'ai' && (
                      <button onClick={() => playTTS(msg.content, i)} 
                        style={{ background: 'none', border: 'none', color: isSpeaking === i ? 'var(--danger)' : '#94a3b8', 
                                 cursor: 'pointer', padding: 0 }}>
                        {isSpeaking === i ? <Square size={12} fill="var(--danger)" /> : <Volume2 size={12} />}
                      </button>
                    )}
                  </div>
                  <div className={msg.role === 'user' ? `chat-bubble chat-bubble-party-${partyInfo?.role === 'party_a' ? 'a' : 'b'}` : 'chat-bubble chat-bubble-ai'}
                       style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div className="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Statement Preview */}
        <AnimatePresence>
          {statementComplete && extractedStatement && !submitted && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', padding: '0 20px' }}>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(72,187,120,0.06)',
                            border: '1px solid rgba(72,187,120,0.2)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Sparkles size={14} style={{ color: '#48bb78' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#68d391' }}>Statement Ready</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Position', extractedStatement.position], ['Interest', extractedStatement.interest],
                    ['Min Acceptable', extractedStatement.min_acceptable], ['Emotional Need', extractedStatement.emotional_need]].map(([k, v]) => (
                    <div key={k} style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569' }}>{k}:</span>
                      <span style={{ color: '#1e293b', marginLeft: 4 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={submitStatement}
                  className="btn-primary" disabled={loading} style={{ marginTop: 12, fontSize: '0.85rem', padding: '10px 22px' }}>
                  <Lock size={14} /> Submit & Lock Statement
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {sttSupported && (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={isListening ? stopListening : startListening}
                style={{ background: isListening ? 'rgba(245,87,108,0.1)' : 'rgba(0,0,0,0.03)', 
                         border: 'none', color: isListening ? '#f5576c' : '#64748b', 
                         padding: 10, borderRadius: '50%', cursor: 'pointer' }}>
                {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
              </motion.button>
            )}
            <textarea className="input-field" placeholder={isListening ? "Listening..." : "Type your message..."} 
              value={input} onChange={e => setInput(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={submitted || statementComplete} 
              style={{ borderRadius: 14, minHeight: '48px', maxHeight: '120px', padding: '12px 16px' }} />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={sendMessage} className="btn-primary" disabled={loading || !input.trim() || statementComplete}
              style={{ padding: '12px 18px', borderRadius: 14 }}>
              <Send size={18} />
            </motion.button>
          </div>
        </div>
        <audio ref={audioRef} style={{ display: 'none' }} />
      </motion.div>
    </div>
  )
}

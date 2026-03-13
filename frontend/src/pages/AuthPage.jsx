import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.bg} />
      <div style={styles.card} className="animate-in">
        <div style={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <path d="M8 10h16M8 16h10M8 22h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={styles.logoText}>notus</span>
        </div>
        <p style={styles.sub}>
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',padding:'11px'}}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
            style={{color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font)'}}>
            {mode === 'login' ? 'Cadastrar' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  root: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' },
  bg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,106,247,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  card: { width: '100%', maxWidth: 380, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 36px', position: 'relative', zIndex: 1 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoText: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' },
  sub: { color: 'var(--text2)', fontSize: 14, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  error: { color: 'var(--red)', fontSize: 13, padding: '8px 12px', background: 'rgba(247,106,106,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(247,106,106,0.2)' },
  success: { color: 'var(--green)', fontSize: 13, padding: '8px 12px', background: 'rgba(106,247,176,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(106,247,176,0.2)' },
  toggle: { marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text3)' },
}

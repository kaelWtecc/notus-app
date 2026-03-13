import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const COLORS = ['#7c6af7', '#f76a9f', '#6af7b0', '#f7d06a', '#6ab8f7', '#f79a6a', '#c46af7', '#6af7e8']

export default function TagsModal({ onClose }) {
  const [tags, setTags] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getTags().then(setTags)
  }, [])

  async function create(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const t = await api.createTag({ name: name.trim(), color })
      setTags(prev => [...prev, t])
      setName('')
    } finally { setLoading(false) }
  }

  async function remove(id) {
    await api.deleteTag(id)
    setTags(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()} className="animate-in">
        <div style={styles.header}>
          <h3 style={styles.title}>Gerenciar Tags</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={create} style={styles.createForm}>
          <input
            className="input-field"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da tag"
            style={{ flex: 1 }}
          />
          <div style={styles.colorPicker}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{ ...styles.colorDot, background: c, ...(color === c ? styles.colorDotActive : {}) }} />
            ))}
          </div>
          <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !name.trim()}>
            Criar
          </button>
        </form>

        <div style={styles.list}>
          {tags.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Nenhuma tag criada</p>}
          {tags.map(t => (
            <div key={t.id} style={styles.tagRow}>
              <span style={{ ...styles.tagPreview, background: t.color + '20', color: t.color, borderColor: t.color + '40' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                {t.name}
              </span>
              <button onClick={() => remove(t.id)} style={styles.deleteBtn} title="Excluir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 400 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px' },
  title: { fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 4, borderRadius: 6 },
  createForm: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 16px', flexWrap: 'wrap' },
  colorPicker: { display: 'flex', gap: 6 },
  colorDot: { width: 20, height: 20, borderRadius: '50%', border: '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' },
  colorDotActive: { border: '2px solid white', transform: 'scale(1.15)' },
  list: { borderTop: '1px solid var(--border)', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' },
  tagRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tagPreview: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.1s' },
}

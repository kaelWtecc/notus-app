import { useState } from 'react'
import { api } from '../lib/api'

export default function EventModal({ event, defaultDate, tags, onClose, onSaved }) {
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [date, setDate] = useState(event?.date || defaultDate || '')
  const [time, setTime] = useState(event?.time?.slice(0, 5) || '')
  const [selectedTags, setSelectedTags] = useState(event?.tags?.map(t => t.id) || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setLoading(true); setError('')
    try {
      const body = { title: title.trim(), description, date, time: time || null, tag_ids: selectedTags }
      const saved = event ? await api.updateEvent(event.id, body) : await api.createEvent(body)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  function toggleTag(id) {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()} className="animate-in">
        <div style={styles.header}>
          <h3 style={styles.title}>{event ? 'Editar evento' : 'Novo evento'}</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Título *</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento" required autoFocus />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Data *</label>
              <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Horário</label>
              <input className="input-field" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Descrição</label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes..." rows={3} style={{ resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          {tags.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>Tags</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map(t => (
                  <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font)', transition: 'all 0.12s', background: selectedTags.includes(t.id) ? t.color + '25' : 'var(--bg3)', color: selectedTags.includes(t.id) ? t.color : 'var(--text3)', borderColor: selectedTags.includes(t.id) ? t.color + '60' : 'var(--border)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}

          <div style={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : event ? 'Salvar' : 'Criar evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' },
  title: { fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, padding: 20 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
}

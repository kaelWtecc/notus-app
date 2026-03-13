import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/api'

export default function NoteEditor({ note, tags, onSave }) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [selectedTags, setSelectedTags] = useState(note.tags?.map(t => t.id) || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSelectedTags(note.tags?.map(t => t.id) || [])
    isFirstRender.current = true
  }, [note.id])

  const save = useCallback(async (t, c, tids) => {
    setSaving(true)
    try {
      const updated = await api.updateNote(note.id, { title: t, content: c, tag_ids: tids })
      onSave(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally { setSaving(false) }
  }, [note.id, onSave])

  function scheduleAutoSave(t, c, tids) {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(t, c, tids), 800)
  }

  function handleTitle(e) {
    setTitle(e.target.value)
    scheduleAutoSave(e.target.value, content, selectedTags)
  }

  function handleContent(e) {
    setContent(e.target.value)
    scheduleAutoSave(title, e.target.value, selectedTags)
  }

  function toggleTag(id) {
    const next = selectedTags.includes(id) ? selectedTags.filter(x => x !== id) : [...selectedTags, id]
    setSelectedTags(next)
    scheduleAutoSave(title, content, next)
  }

  return (
    <div style={styles.root}>
      <div style={styles.toolbar}>
        <div style={styles.tagRow}>
          {tags.map(t => (
            <button key={t.id} onClick={() => toggleTag(t.id)}
              style={{ ...styles.tagBtn, background: selectedTags.includes(t.id) ? t.color + '25' : 'var(--bg3)', color: selectedTags.includes(t.id) ? t.color : 'var(--text3)', borderColor: selectedTags.includes(t.id) ? t.color + '60' : 'var(--border)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block', flexShrink: 0 }} />
              {t.name}
            </button>
          ))}
        </div>
        <div style={styles.saveStatus}>
          {saving && <span style={{ color: 'var(--text3)', fontSize: 11 }}>Salvando...</span>}
          {saved && !saving && <span style={{ color: 'var(--green)', fontSize: 11 }}>✓ Salvo</span>}
        </div>
      </div>

      <div style={styles.body}>
        <input
          value={title}
          onChange={handleTitle}
          placeholder="Título da nota"
          style={styles.titleInput}
        />
        <textarea
          value={content}
          onChange={handleContent}
          placeholder="Comece a escrever..."
          style={styles.contentArea}
        />
      </div>

      <div style={styles.footer}>
        <span style={{ color: 'var(--text3)', fontSize: 11 }}>
          {content.length} caracteres · {content.split(/\s+/).filter(Boolean).length} palavras
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 11 }}>
          Atualizado {new Date(note.updated_at).toLocaleString('pt-BR')}
        </span>
      </div>
    </div>
  )
}

const styles = {
  root: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border)', gap: 12 },
  tagRow: { display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 },
  tagBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font)', transition: 'all 0.12s', letterSpacing: '0.04em' },
  saveStatus: { flexShrink: 0 },
  body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 32px', overflow: 'hidden' },
  titleInput: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font)', width: '100%', marginBottom: 16, lineHeight: 1.3 },
  contentArea: { flex: 1, fontSize: 15, color: 'var(--text)', background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--mono)', resize: 'none', lineHeight: 1.7, overflowY: 'auto' },
  footer: { display: 'flex', justifyContent: 'space-between', padding: '10px 32px', borderTop: '1px solid var(--border)' },
}

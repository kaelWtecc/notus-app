import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import NoteEditor from '../components/NoteEditor'
import SearchBar from '../components/SearchBar'

const IconPin = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [n, t] = await Promise.all([api.getNotes({ q: search, tag_id: filterTag }), api.getTags()])
      setNotes(n)
      setTags(t)
      if (activeNote) {
        const updated = n.find(x => x.id === activeNote.id)
        if (updated) setActiveNote(updated)
      }
    } finally { setLoading(false) }
  }, [search, filterTag])

  useEffect(() => { load() }, [load])

  async function createNote() {
    if (creating) return
    setCreating(true)
    try {
      const note = await api.createNote({ title: 'Nova nota', content: '' })
      setNotes(prev => [note, ...prev])
      setActiveNote(note)
    } finally { setCreating(false) }
  }

  async function deleteNote(id, e) {
    e.stopPropagation()
    await api.deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeNote?.id === id) setActiveNote(null)
  }

  async function togglePin(note, e) {
    e.stopPropagation()
    const updated = await api.updateNote(note.id, { is_pinned: !note.is_pinned })
    setNotes(prev => prev.map(n => n.id === note.id ? updated : n))
    if (activeNote?.id === note.id) setActiveNote(updated)
  }

  const pinned = notes.filter(n => n.is_pinned)
  const unpinned = notes.filter(n => !n.is_pinned)

  return (
    <div style={styles.root}>
      {/* List Panel */}
      <div style={styles.list}>
        <div style={styles.listHeader}>
          <h1 style={styles.pageTitle}>Notas</h1>
          <button className="btn btn-primary btn-sm" onClick={createNote} disabled={creating}>
            <IconPlus /> Nova
          </button>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Buscar notas..." />

        {/* Tag filters */}
        <div style={styles.tagFilters}>
          <button onClick={() => setFilterTag(null)} style={{ ...styles.tagFilter, ...(filterTag === null ? styles.tagFilterActive : {}) }}>
            Todas
          </button>
          {tags.map(t => (
            <button key={t.id} onClick={() => setFilterTag(filterTag === t.id ? null : t.id)}
              style={{ ...styles.tagFilter, ...(filterTag === t.id ? { background: t.color + '30', color: t.color, borderColor: t.color + '60' } : {}) }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
              {t.name}
            </button>
          ))}
        </div>

        <div style={styles.notesList}>
          {loading && <div style={styles.empty}><div style={{ animation: 'pulse 1s infinite' }}>Carregando...</div></div>}
          {!loading && notes.length === 0 && (
            <div style={styles.empty}>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Nenhuma nota encontrada</p>
              <button className="btn btn-ghost btn-sm" onClick={createNote} style={{ marginTop: 8 }}>Criar nota</button>
            </div>
          )}

          {pinned.length > 0 && (
            <>
              <div style={styles.sectionLabel}>📌 Fixadas</div>
              {pinned.map(note => <NoteItem key={note.id} note={note} active={activeNote?.id === note.id} onClick={() => setActiveNote(note)} onDelete={deleteNote} onPin={togglePin} />)}
              {unpinned.length > 0 && <div style={styles.sectionLabel}>Outras</div>}
            </>
          )}
          {unpinned.map(note => <NoteItem key={note.id} note={note} active={activeNote?.id === note.id} onClick={() => setActiveNote(note)} onDelete={deleteNote} onPin={togglePin} />)}
        </div>
      </div>

      {/* Editor Panel */}
      <div style={styles.editor}>
        {activeNote ? (
          <NoteEditor note={activeNote} tags={tags} onSave={updated => {
            setNotes(prev => prev.map(n => n.id === updated.id ? updated : n).sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.updated_at) - new Date(a.updated_at)))
            setActiveNote(updated)
          }} />
        ) : (
          <div style={styles.emptyEditor}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>Selecione uma nota ou <button onClick={createNote} style={{ color: 'var(--accent)', background: 'none', border: 'none', fontFamily: 'var(--font)', cursor: 'pointer', fontSize: 14 }}>crie uma nova</button></p>
          </div>
        )}
      </div>
    </div>
  )
}

function NoteItem({ note, active, onClick, onDelete, onPin }) {
  return (
    <div onClick={onClick} style={{ ...styles.noteItem, ...(active ? styles.noteItemActive : {}) }} className="animate-in">
      <div style={styles.noteItemHeader}>
        <span style={styles.noteTitle}>{note.title || 'Sem título'}</span>
        <div style={styles.noteActions}>
          <button onClick={e => onPin(note, e)} style={{ ...styles.iconBtn, color: note.is_pinned ? 'var(--accent)' : 'var(--text3)' }} title="Fixar">
            <IconPin filled={note.is_pinned} />
          </button>
          <button onClick={e => onDelete(note.id, e)} style={{ ...styles.iconBtn, color: 'var(--text3)' }} title="Excluir">
            <IconTrash />
          </button>
        </div>
      </div>
      <p style={styles.notePreview}>{note.content?.replace(/\n/g, ' ') || 'Nota vazia'}</p>
      <div style={styles.noteMeta}>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(note.updated_at).toLocaleDateString('pt-BR')}</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {note.tags?.map(t => (
            <span key={t.id} className="tag-pill" style={{ background: t.color + '20', color: t.color }}>{t.name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: { display: 'flex', flex: 1, overflow: 'hidden' },
  list: { width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 12px' },
  pageTitle: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' },
  tagFilters: { display: 'flex', gap: 4, padding: '0 12px 8px', flexWrap: 'wrap' },
  tagFilter: { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', fontFamily: 'var(--font)', transition: 'all 0.12s' },
  tagFilterActive: { background: 'var(--accent-dim)', color: 'var(--accent2)', borderColor: 'var(--accent)' },
  notesList: { flex: 1, overflowY: 'auto', padding: '0 8px 16px' },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 8px 4px' },
  noteItem: { padding: '12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, transition: 'all 0.12s', border: '1px solid transparent' },
  noteItemActive: { background: 'var(--bg3)', borderColor: 'var(--border)' },
  noteItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  noteTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  notePreview: { fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 },
  noteMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  noteActions: { display: 'flex', gap: 2, flexShrink: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' },
  editor: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  emptyEditor: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', fontSize: 14 },
}

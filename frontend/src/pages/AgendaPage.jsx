import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import EventModal from '../components/EventModal'
import SearchBar from '../components/SearchBar'

const IconChevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}/>
  </svg>
)
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [tags, setTags] = useState([])
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState(null)
  const [loading, setLoading] = useState(true)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [e, t] = await Promise.all([
        api.getEvents({ month: monthStr, q: search, tag_id: filterTag }),
        api.getTags()
      ])
      setEvents(e)
      setTags(t)
    } finally { setLoading(false) }
  }, [monthStr, search, filterTag])

  useEffect(() => { load() }, [load])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startOffset = getDay(days[0])
  const selectedEvents = events.filter(e => isSameDay(parseISO(e.date), selectedDay))

  function openNew() {
    setEditingEvent(null)
    setModalOpen(true)
  }
  function openEdit(ev, e) {
    e.stopPropagation()
    setEditingEvent(ev)
    setModalOpen(true)
  }

  async function deleteEvent(id) {
    await api.deleteEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function getEventsForDay(day) {
    return events.filter(e => isSameDay(parseISO(e.date), day))
  }

  return (
    <div style={styles.root}>
      {/* Left: Calendar */}
      <div style={styles.calendarPanel}>
        <div style={styles.calHeader}>
          <button style={styles.navBtn} onClick={() => setCurrentMonth(m => subMonths(m, 1))}><IconChevron dir="left" /></button>
          <h2 style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
          <button style={styles.navBtn} onClick={() => setCurrentMonth(m => addMonths(m, 1))}><IconChevron dir="right" /></button>
        </div>

        <div style={styles.grid}>
          {DAYS.map(d => <div key={d} style={styles.dayLabel}>{d}</div>)}
          {Array(startOffset).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const dayEvents = getEventsForDay(day)
            const selected = isSameDay(day, selectedDay)
            const today = isToday(day)
            return (
              <div key={day.toISOString()} onClick={() => setSelectedDay(day)}
                style={{ ...styles.dayCell, ...(selected ? styles.daySelected : {}), ...(today && !selected ? styles.dayToday : {}) }}>
                <span style={styles.dayNum}>{format(day, 'd')}</span>
                <div style={styles.dotRow}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span key={i} style={{ ...styles.dot, background: e.tags?.[0]?.color || 'var(--accent)' }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tag filter */}
        <div style={styles.tagFilters}>
          <button onClick={() => setFilterTag(null)} style={{ ...styles.tagFilter, ...(filterTag === null ? styles.tagFilterActive : {}) }}>Todos</button>
          {tags.map(t => (
            <button key={t.id} onClick={() => setFilterTag(filterTag === t.id ? null : t.id)}
              style={{ ...styles.tagFilter, ...(filterTag === t.id ? { background: t.color + '30', color: t.color, borderColor: t.color + '60' } : {}) }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Day events */}
      <div style={styles.eventsPanel}>
        <div style={styles.eventsPanelHeader}>
          <div>
            <h2 style={styles.dayTitle}>{format(selectedDay, "d 'de' MMMM", { locale: ptBR })}</h2>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>{selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openNew}><IconPlus /> Evento</button>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Buscar eventos..." />

        <div style={styles.eventsList}>
          {loading && <div style={{ color: 'var(--text3)', padding: 16, animation: 'pulse 1s infinite' }}>Carregando...</div>}
          {!loading && selectedEvents.length === 0 && (
            <div style={styles.noEvents}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Sem eventos para este dia</p>
              <button className="btn btn-ghost btn-sm" onClick={openNew} style={{ marginTop: 4 }}>Adicionar evento</button>
            </div>
          )}
          {selectedEvents.map(ev => (
            <div key={ev.id} onClick={e => openEdit(ev, e)} style={styles.eventCard} className="animate-in">
              <div style={{ ...styles.eventAccent, background: ev.tags?.[0]?.color || 'var(--accent)' }} />
              <div style={styles.eventBody}>
                <div style={styles.eventHeader}>
                  <span style={styles.eventTitle}>{ev.title}</span>
                  {ev.time && <span style={styles.eventTime}>{ev.time.slice(0, 5)}</span>}
                </div>
                {ev.description && <p style={styles.eventDesc}>{ev.description}</p>}
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {ev.tags?.map(t => (
                    <span key={t.id} className="tag-pill" style={{ background: t.color + '20', color: t.color }}>{t.name}</span>
                  ))}
                </div>
              </div>
              <button onClick={async e => { e.stopPropagation(); await deleteEvent(ev.id) }} style={styles.deleteBtn} title="Excluir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <EventModal
          event={editingEvent}
          defaultDate={format(selectedDay, 'yyyy-MM-dd')}
          tags={tags}
          onClose={() => { setModalOpen(false); setEditingEvent(null) }}
          onSaved={saved => {
            setEvents(prev => editingEvent ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved])
            setModalOpen(false); setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

const styles = {
  root: { display: 'flex', flex: 1, overflow: 'hidden' },
  calendarPanel: { width: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '16px 16px 8px', overflow: 'auto', flexShrink: 0 },
  calHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer' },
  monthTitle: { fontSize: 15, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '-0.02em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  dayLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text3)', textAlign: 'center', padding: '4px 0 8px', letterSpacing: '0.06em' },
  dayCell: { aspect: '1', padding: '4px 2px', borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'background 0.12s', minHeight: 42 },
  daySelected: { background: 'var(--accent)', },
  dayToday: { background: 'var(--accent-dim)', },
  dayNum: { fontSize: 13, fontWeight: 500 },
  dotRow: { display: 'flex', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: '50%' },
  tagFilters: { display: 'flex', gap: 4, marginTop: 16, flexWrap: 'wrap' },
  tagFilter: { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', fontFamily: 'var(--font)', transition: 'all 0.12s' },
  tagFilterActive: { background: 'var(--accent-dim)', color: 'var(--accent2)', borderColor: 'var(--accent)' },
  eventsPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  eventsPanelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 12px' },
  dayTitle: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', textTransform: 'capitalize' },
  eventsList: { flex: 1, overflowY: 'auto', padding: '0 16px 16px' },
  noEvents: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '48px 0', color: 'var(--text3)' },
  eventCard: { display: 'flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.12s' },
  eventAccent: { width: 4, flexShrink: 0 },
  eventBody: { flex: 1, padding: '12px 14px' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eventTitle: { fontSize: 14, fontWeight: 600 },
  eventTime: { fontSize: 12, color: 'var(--accent2)', fontFamily: 'var(--mono)', flexShrink: 0 },
  eventDesc: { fontSize: 13, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 },
  deleteBtn: { display: 'flex', alignItems: 'flex-start', padding: '12px 12px 0', color: 'var(--text3)', cursor: 'pointer', background: 'none', border: 'none', transition: 'color 0.12s' },
}

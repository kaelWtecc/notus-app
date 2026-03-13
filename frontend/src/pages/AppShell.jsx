import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import NotesPage from './NotesPage'
import AgendaPage from './AgendaPage'
import TagsModal from '../components/TagsModal'

const IconNotes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export default function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tagsOpen, setTagsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <nav style={{ ...styles.sidebar, width: collapsed ? 64 : 220 }}>
        <div style={styles.sidebarTop}>
          <button onClick={() => setCollapsed(!collapsed)} style={styles.logoBtn}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="var(--accent)" />
              <path d="M8 10h16M8 16h10M8 22h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {!collapsed && <span style={styles.logoTxt}>notus</span>}
          </button>

          <div style={styles.navItems}>
            <NavLink to="/" end style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}>
              <IconNotes />
              {!collapsed && <span>Notas</span>}
            </NavLink>
            <NavLink to="/agenda" style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}>
              <IconCalendar />
              {!collapsed && <span>Agenda</span>}
            </NavLink>
            <button onClick={() => setTagsOpen(true)} style={styles.navItem}>
              <IconTag />
              {!collapsed && <span>Tags</span>}
            </button>
          </div>
        </div>

        <div style={styles.sidebarBottom}>
          {!collapsed && (
            <div style={styles.userEmail} title={user?.email}>
              {user?.email?.split('@')[0]}
            </div>
          )}
          <button onClick={handleSignOut} style={{ ...styles.navItem, color: 'var(--text3)' }} title="Sair">
            <IconLogout />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<NotesPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
        </Routes>
      </main>

      {tagsOpen && <TagsModal onClose={() => setTagsOpen(false)} />}
    </div>
  )
}

const styles = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: { background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0 },
  sidebarTop: { display: 'flex', flexDirection: 'column', gap: 4 },
  logoBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text)', width: '100%' },
  logoTxt: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', whiteSpace: 'nowrap' },
  navItems: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font)', width: '100%', textDecoration: 'none', transition: 'all 0.12s', whiteSpace: 'nowrap' },
  navItemActive: { background: 'var(--accent-dim)', color: 'var(--accent2)' },
  sidebarBottom: { padding: '0 8px 16px' },
  userEmail: { fontSize: 11, color: 'var(--text3)', padding: '0 10px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}

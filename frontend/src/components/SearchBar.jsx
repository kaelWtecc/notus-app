export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={styles.root}>
      <svg style={styles.icon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
      {value && (
        <button onClick={() => onChange('')} style={styles.clear}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

const styles = {
  root: { position: 'relative', margin: '0 12px 8px', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: 10, color: 'var(--text3)', pointerEvents: 'none' },
  input: { width: '100%', padding: '7px 32px 7px 32px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.12s' },
  clear: { position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 2 },
}

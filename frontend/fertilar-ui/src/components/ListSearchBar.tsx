import { Search, X } from 'lucide-react'
import styles from './ListSearchBar.module.css'

type ListSearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function ListSearchBar({
  value,
  onChange,
  placeholder = 'Buscar…',
  className,
}: ListSearchBarProps) {
  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <Search size={16} strokeWidth={1.5} className={styles.icon} aria-hidden />
      <input
        type="search"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}

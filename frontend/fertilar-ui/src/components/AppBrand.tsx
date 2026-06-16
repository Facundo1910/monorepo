import styles from './AppBrand.module.css'

type AppBrandProps = {
  variant?: 'default' | 'light'
}

export default function AppBrand({ variant = 'default' }: AppBrandProps) {
  return (
    <div className={`${styles.brand} ${styles[variant]}`}>
      <span className={styles.name}>fertilar</span>
      <span className={styles.tag}>planta central</span>
    </div>
  )
}

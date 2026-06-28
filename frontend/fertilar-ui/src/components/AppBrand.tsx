import { LOGO_URL } from '../lib/branding'
import styles from './AppBrand.module.css'

type AppBrandProps = {
  variant?: 'default' | 'light' | 'menu'
}

export default function AppBrand({ variant = 'default' }: AppBrandProps) {
  return (
    <div className={`${styles.brand} ${styles[variant]}`}>
      <img src={LOGO_URL} alt="FertilAR" className={styles.logo} />
    </div>
  )
}

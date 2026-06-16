import styles from './FertilARLogo.module.css'

export default function FertilARLogo() {
  return (
    <div className={styles.wrapper}>
      {/* Gota / ícono */}
      <svg
        className={styles.icon}
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M16 2C16 2 2 16.5 2 24.5C2 32.5 8.3 38 16 38C23.7 38 30 32.5 30 24.5C30 16.5 16 2 16 2Z"
          fill="#4ade80"
          opacity="0.9"
        />
        <path
          d="M16 10C16 10 6 21 6 26.5C6 31 10.5 35 16 35"
          stroke="#86efac"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      <div className={styles.text}>
        <span className={styles.brand}>FertilAR</span>
        <span className={styles.sub}>Planta Central v1</span>
      </div>
    </div>
  )
}

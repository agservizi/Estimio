import type { Variants } from 'framer-motion'

/** Fade + slide up — per pagine e card */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

/** Fade semplice — per overlay, dialogs */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

/** Container con stagger sui figli */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

/** Singolo elemento dentro uno staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

/** Transizione di pagina */
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

/** Hover su card e pulsanti */
export const cardHover = {
  whileHover: { scale: 1.01, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
}

/** Slide laterale per la sidebar */
export const sidebarVariants = {
  expanded: { width: 240 },
  collapsed: { width: 68 },
}

export const sidebarTransition = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 30,
}

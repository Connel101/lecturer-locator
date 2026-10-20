export type Theme = 'system' | 'light' | 'dark'

export const themeLabels = { system: 'Device setting', light: 'Light', dark: 'Dark' }

const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)')
let preference: Theme = 'system'

try {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') preference = saved
} catch { /* Device settings still work when storage is unavailable. */ }

export function getTheme() {
  return preference
}

function applyTheme() {
  document.documentElement.dataset.theme = preference === 'system'
    ? deviceTheme.matches ? 'dark' : 'light'
    : preference
}

export function setTheme(theme: Theme) {
  preference = theme
  applyTheme()
  try { localStorage.setItem('theme', theme) } catch { /* Keep the choice for this visit. */ }
}

deviceTheme.addEventListener('change', applyTheme)
applyTheme()

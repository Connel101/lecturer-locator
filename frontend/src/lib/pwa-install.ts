export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let prompt: BeforeInstallPromptEvent | null = null

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  prompt = event as BeforeInstallPromptEvent
  window.dispatchEvent(new Event('pwa-install-available'))
})

window.addEventListener('appinstalled', () => { prompt = null })

export const getInstallPrompt = () => prompt
export const clearInstallPrompt = () => { prompt = null }

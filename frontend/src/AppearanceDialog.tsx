import { useEffect, useRef } from 'react'
import { themeLabels, type Theme } from './lib/theme'

export default function AppearanceDialog({ theme, onChange, onClose }: {
  theme: Theme
  onChange: (theme: Theme) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="appearance-dialog" aria-labelledby="appearance-title" onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className="appearance-dialog__content">
        <p className="eyebrow">Make yourself comfortable</p>
        <h2 id="appearance-title">Appearance</h2>
        <p className="appearance-dialog__description">Choose your look, or follow your device.</p>
        <fieldset className="appearance-options">
          <legend className="sr-only">Colour theme</legend>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <label className="appearance-option" key={option}>
              <input type="radio" name="theme" value={option} aria-label={option === 'system' ? 'Use device setting' : themeLabels[option]} checked={theme === option}
                onChange={() => onChange(option)} />
              <span className={`appearance-preview appearance-preview--${option}`} aria-hidden="true">
                <span className="appearance-preview__bar" />
                <span className="appearance-preview__card"><span /><span /><span /></span>
              </span>
              <span className="appearance-option__label">
                {option === 'system' ? 'Device' : themeLabels[option]}
                <span className="appearance-option__check" aria-hidden="true">✓</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="appearance-dialog__hint">
          {theme === 'system' ? 'Automatically matches your device’s light or dark setting.' : 'Your choice is remembered on this browser.'}
        </p>
        <button type="button" className="primary-button" onClick={() => dialog.current?.close()}>Done</button>
      </div>
    </dialog>
  )
}

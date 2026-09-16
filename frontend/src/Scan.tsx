import { BrowserQRCodeReader } from '@zxing/browser'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQrcode } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useRef, useState } from 'react'

function cameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was denied. Please allow camera access and try again.'
    }

    if (error.name === 'NotFoundError') {
      return 'No camera was found on this device.'
    }

    if (error.name === 'NotReadableError') {
      return 'The camera is already in use or could not be started.'
    }
  }

  return 'The camera could not be opened. Please try again.'
}

function Scan() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  async function startCamera() {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera scanning is not supported by this browser.')
      return
    }

    if (!videoRef.current) {
      return
    }

    setIsStarting(true)

    try {
      controlsRef.current?.stop()

      const codeReader = new BrowserQRCodeReader()

      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        () => {
          // QR decoding will be added in the next step.
        },
      )

      controlsRef.current = controls
      setIsScanning(true)
    } catch (cameraError) {
      controlsRef.current = null
      setIsScanning(false)
      setError(cameraErrorMessage(cameraError))
    } finally {
      setIsStarting(false)
    }
  }

  function stopCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  return (
    <main className="page-shell feature-page">
      <div className="feature-icon" aria-hidden="true">
        <FontAwesomeIcon icon={faQrcode} />
      </div>

      <h1>Scan a lecturer's QR code</h1>

      <p>Point your camera at the code to find their office.</p>

      <div className="scanner-frame">
        <video
          ref={videoRef}
          className="scanner-video"
          muted
          playsInline
        />

        {!isScanning && !isStarting && (
          <div className="scanner-placeholder">
            Camera preview will appear here.
          </div>
        )}

        {isStarting && (
          <div className="scanner-placeholder">
            Opening camera...
          </div>
        )}
      </div>

      {error && (
        <p className="status-message status-message--error" role="alert">
          {error}
        </p>
      )}

      {!isScanning ? (
        <button
          type="button"
          className="primary-button"
          onClick={startCamera}
          disabled={isStarting}
        >
          {isStarting ? 'Opening camera...' : 'Open camera'}
        </button>
      ) : (
        <button
          type="button"
          className="primary-button"
          onClick={stopCamera}
        >
          Stop camera
        </button>
      )}
    </main>
  )
}

export default Scan

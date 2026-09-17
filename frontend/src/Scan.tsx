import { BrowserQRCodeReader } from '@zxing/browser'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQrcode } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

function getLecturerProfilePath(scannedText: string): string | null {
  try {
    const url = new URL(scannedText)

    // Only accept Lecturer Locator profile URLs with a UUID lecturer ID.
    const lecturerProfilePattern =
      /^\/lecturers\/info\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\/?$/i

    // Reject QR codes from other websites.
    if (url.origin !== window.location.origin) {
      return null
    }

    if (!lecturerProfilePattern.test(url.pathname)) {
      return null
    }

    return url.pathname
  } catch {
    return null
  }
}

function isRoutineScanError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  // ZXing reports these repeatedly while no readable QR code is in view.
  // They are normal during scanning and should not be shown to the user.
  return [
    'NotFoundException',
    'ChecksumException',
    'FormatException',
  ].includes(error.name)
}

function Scan() {
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const hasHandledResultRef = useRef(false)

  const [isScanning, setIsScanning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  async function startCamera() {
    setError('')
    hasHandledResultRef.current = false

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
      controlsRef.current = null

      const codeReader = new BrowserQRCodeReader()

      // Prefer the rear-facing camera on phones while still allowing desktop webcams.
      const controls = await codeReader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: {
              ideal: 'environment',
            },
          },
        },
        videoRef.current,
        (result, scanError, scanControls) => {
          if (result && !hasHandledResultRef.current) {
            const scannedText = result.getText()
            const profilePath = getLecturerProfilePath(scannedText)

            if (!profilePath) {
              setError(
                'This QR code is not a valid Lecturer Locator profile. Try another code.',
              )
              return
            }

            // Prevent the same QR code from triggering navigation more than once.
            hasHandledResultRef.current = true
            setError('')

            scanControls.stop()
            controlsRef.current = null
            setIsScanning(false)

            navigate(profilePath)
            return
          }

          if (scanError && !isRoutineScanError(scanError)) {
            setError(
              'There was a problem reading the QR code. Please try again.',
            )
          }
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
    hasHandledResultRef.current = false
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

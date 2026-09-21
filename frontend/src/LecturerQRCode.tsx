import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface LecturerQRCodeProps {
  lecturerId: string
  size?: number
}

export default function LecturerQRCode({
  lecturerId,
  size = 128,
}: LecturerQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function generateQRCode() {
      if (!lecturerId.trim()) {
        setQrCodeUrl('')
        setError('QR code unavailable.')
        return
      }

      const profileUrl =
        `${window.location.origin}/lecturers/info/${encodeURIComponent(lecturerId)}`

      try {
        const dataUrl = await QRCode.toDataURL(profileUrl, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
        })

        if (!cancelled) {
          setQrCodeUrl(dataUrl)
          setError('')
        }
      } catch {
        if (!cancelled) {
          setQrCodeUrl('')
          setError('QR code unavailable.')
        }
      }
    }

    void generateQRCode()

    return () => {
      cancelled = true
    }
  }, [lecturerId, size])

  if (error) {
    return (
      <p className="text-sm text-[#695c6c]" role="status">
        {error}
      </p>
    )
  }

  if (!qrCodeUrl) {
    return (
      <p className="text-sm text-[#695c6c]" role="status">
        Generating QR code…
      </p>
    )
  }

  return (
    <img
      src={qrCodeUrl}
      alt="QR code linking to this lecturer's public profile"
      width={size}
      height={size}
      className="h-full w-full object-contain"
    />
  )
}

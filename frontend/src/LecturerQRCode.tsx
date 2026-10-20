import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface LecturerQRCodeProps {
  lecturerId: string
  size?: number
  showDownload?: boolean
}

export default function LecturerQRCode({
  lecturerId,
  size = 128,
  showDownload = false,
}: LecturerQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState('')

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

  async function downloadPDF() {
    try {
      setDownloadError('')

      const { jsPDF } = await import('jspdf')

      const profileUrl =
        `${window.location.origin}/lecturers/info/${encodeURIComponent(lecturerId)}`

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const qrSize = 70
      const qrX = (pageWidth - qrSize) / 2

      pdf.setFontSize(18)
      pdf.text('Lecturer QR Code', pageWidth / 2, 25, {
        align: 'center',
      })

      pdf.addImage(qrCodeUrl, 'PNG', qrX, 35, qrSize, qrSize)

      pdf.setFontSize(10)
      const urlLines = pdf.splitTextToSize(profileUrl, 170)
      pdf.text(urlLines, pageWidth / 2, 115, {
        align: 'center',
      })

      pdf.save(`lecturer-${lecturerId}-qr.pdf`)
    } catch {
      setDownloadError('PDF download failed. Please try again.')
    }
  }

  if (error) {
    return (
      <p className="text-sm text-[color:var(--theme-muted)]" role="status">
        {error}
      </p>
    )
  }

  if (!qrCodeUrl) {
    return (
      <p className="text-sm text-[color:var(--theme-muted)]" role="status">
        Generating QR code…
      </p>
    )
  }

  const qrImage = (
    <img
      src={qrCodeUrl}
      alt="QR code linking to this lecturer's public profile"
      width={size}
      height={size}
      className="h-full w-full object-contain"
    />
  )

  if (!showDownload) {
    return qrImage
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {qrImage}

      <div className="flex gap-2">
        <a
          href={qrCodeUrl}
          download={`lecturer-${lecturerId}-qr.png`}
          className="rounded-md bg-[#4a214f] px-4 py-2 text-sm font-medium text-white"
        >
          Download PNG
        </a>

        <button
          type="button"
          onClick={() => void downloadPDF()}
          className="rounded-md bg-[#4a214f] px-4 py-2 text-sm font-medium text-white"
        >
          Download PDF
        </button>
      </div>

      {downloadError && (
        <p className="text-sm text-red-700" role="status">
          {downloadError}
        </p>
      )}
    </div>
  )
}

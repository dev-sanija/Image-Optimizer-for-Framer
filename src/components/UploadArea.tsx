import { memo, useId, useRef, useState } from "react"
import { ImagePlus, UploadCloud } from "lucide-react"

interface UploadAreaProps {
  onFilesSelect: (files: FileList | File[] | null) => void
  disabled: boolean
}

const acceptedTypes = "image/png,image/jpeg,image/webp,image/svg+xml"

export const UploadArea = memo(function UploadArea({ onFilesSelect, disabled }: UploadAreaProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    onFilesSelect(files)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <section
      className={`upload-area ${isDragging ? "is-dragging" : ""}`}
      aria-label="Image upload area"
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        if (event.currentTarget.contains(event.relatedTarget as Node)) return
        setIsDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (!disabled) onFilesSelect(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        className="visually-hidden"
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={(event) => handleFiles(event.target.files)}
        disabled={disabled}
      />
      <div className="upload-content">
        <div className="upload-glyph" aria-hidden="true">
          {isDragging ? <UploadCloud size={32} /> : <ImagePlus size={32} />}
        </div>
        <div className="upload-copy">
          <h2>Drop images here</h2>
          <p>Optimize, resize, convert, and compare images in one workflow.</p>
        </div>
        <div className="format-chips" aria-label="Supported formats">
          <span>PNG</span>
          <span>JPEG</span>
          <span>WEBP</span>
          <span>SVG Preview</span>
        </div>
        <label className={`button button-secondary upload-button ${disabled ? "is-disabled" : ""}`} htmlFor={inputId}>
          <ImagePlus size={18} aria-hidden="true" />
          Browse Files
        </label>
      </div>
    </section>
  )
})

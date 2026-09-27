import { memo } from "react"
import { Info } from "lucide-react"
import type { ImageMetadata } from "../types/image"
import { formatBytes, formatImageFormat } from "../utils/imageInfo"

interface ImageInfoProps {
  info: ImageMetadata
}

export const ImageInfo = memo(function ImageInfo({ info }: ImageInfoProps) {
  return (
    <section className="panel info-panel" aria-labelledby="image-info-heading">
      <div className="panel-title-row">
        <div className="title-with-icon">
          <Info size={15} aria-hidden="true" />
          <h2 id="image-info-heading">Metadata</h2>
        </div>
      </div>
      <dl className="info-grid">
        <InfoItem label="Width" value={`${info.width}px`} />
        <InfoItem label="Height" value={`${info.height}px`} />
        <InfoItem label="Format" value={formatImageFormat(info.format)} />
        <InfoItem label="Aspect" value={info.aspectRatio} />
        <InfoItem label="File Size" value={formatBytes(info.fileSize)} />
        <InfoItem label="Transparency" value={formatTransparency(info.transparency)} />
        <InfoItem label="Color Space" value={info.colorSpace ?? "Unavailable"} />
        <InfoItem label="DPI" value={info.dpi ? `${info.dpi}` : "Unavailable"} />
      </dl>
    </section>
  )
})

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function formatTransparency(value: ImageMetadata["transparency"]): string {
  if (value === "yes") return "Yes"
  if (value === "no") return "No"
  return "Unknown"
}

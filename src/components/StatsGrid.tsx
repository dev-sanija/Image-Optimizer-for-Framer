import { memo } from "react"
import type { ReactNode } from "react"
import { Archive, Gauge, Image, Package, Percent, Zap } from "lucide-react"
import type { ImageQueueItem } from "../types/image"
import { formatBytes } from "../utils/imageInfo"

interface StatsGridProps {
  item: ImageQueueItem
}

export const StatsGrid = memo(function StatsGrid({ item }: StatsGridProps) {
  const optimizedSize = item.result?.info.fileSize ?? item.estimate.estimatedSize
  const savedPercent = item.result?.savedPercent ?? item.estimate.savedPercent
  const compressionRatio = item.result?.compressionRatio ?? item.estimate.compressionRatio
  const loading = item.result?.estimatedLoadImprovement ?? item.estimate.loadingImprovement

  return (
    <section className="results-section" aria-labelledby="results-heading">
      <div className="panel-title-row section-title-row">
        <h2 id="results-heading">Results</h2>
        <span className="muted-label">{item.result ? "Optimized" : "Live estimate"}</span>
      </div>
      <div className="stats-grid">
        <StatCard icon={<Package size={16} />} label="Original Size" value={formatBytes(item.info.fileSize)} hint="Before optimization" />
        <StatCard icon={<Archive size={16} />} label="Optimized Size" value={formatBytes(optimizedSize)} hint={item.result ? "Actual export" : "Estimated export"} />
        <StatCard icon={<Zap size={16} />} label="Space Saved" value={formatBytes(Math.max(0, item.info.fileSize - optimizedSize))} hint="Transfer reduction" />
        <StatCard icon={<Gauge size={16} />} label="Compression Ratio" value={`${compressionRatio.toFixed(1)}x`} hint="Output efficiency" />
        <StatCard icon={<Image size={16} />} label="Resolution" value={`${item.info.width} x ${item.info.height}`} hint="Current source" />
        <StatCard icon={<Percent size={16} />} label="Improvement" value={`${savedPercent}% saved`} hint={loading} />
      </div>
    </section>
  )
})

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  )
}

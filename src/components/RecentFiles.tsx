import { memo } from "react"
import { Clock3 } from "lucide-react"
import type { RecentFile } from "../types/image"
import { formatBytes, formatImageFormat } from "../utils/imageInfo"

interface RecentFilesProps {
  files: RecentFile[]
}

export const RecentFiles = memo(function RecentFiles({ files }: RecentFilesProps) {
  if (files.length === 0) return null

  return (
    <section className="panel recent-panel" aria-labelledby="recent-heading">
      <div className="panel-title-row">
        <div className="title-with-icon">
          <Clock3 size={15} aria-hidden="true" />
          <h2 id="recent-heading">Recent</h2>
        </div>
      </div>
      <div className="recent-list">
        {files.map((file) => (
          <div key={file.id} className="recent-row">
            <strong>{file.name}</strong>
            <span>
              {formatImageFormat(file.format)} - {formatBytes(file.size)} - Saved {file.savedPercent}%
            </span>
          </div>
        ))}
      </div>
    </section>
  )
})

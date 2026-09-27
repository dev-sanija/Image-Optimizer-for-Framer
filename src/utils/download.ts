import JSZip from "jszip"

export function downloadFile(file: File): void {
  const objectUrl = URL.createObjectURL(file)
  const link = document.createElement("a")

  link.href = objectUrl
  link.download = file.name
  link.rel = "noopener"
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export async function downloadZip(files: File[], archiveName = "optimized-images.zip"): Promise<void> {
  const zip = new JSZip()

  files.forEach((file) => {
    zip.file(file.name, file)
  })

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" })
  downloadFile(new File([blob], archiveName, { type: "application/zip", lastModified: Date.now() }))
}

export function canCopyImageToClipboard(file: File | null): boolean {
  return Boolean(
    file &&
      typeof navigator !== "undefined" &&
      "clipboard" in navigator &&
      typeof ClipboardItem !== "undefined" &&
      file.type !== "image/svg+xml",
  )
}

export async function copyImageToClipboard(file: File): Promise<void> {
  if (!canCopyImageToClipboard(file)) {
    throw new Error("Copying images to the clipboard is not supported in this browser.")
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      [file.type]: file,
    }),
  ])
}

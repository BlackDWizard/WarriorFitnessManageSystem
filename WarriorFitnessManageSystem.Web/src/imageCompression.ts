// 上傳前在瀏覽器裡把圖片縮小、重新編碼：
// 1. 手機原圖常常 5MB 以上，縮到最長邊 1920px 後通常剩幾百 KB
// 2. 重新編碼會丟掉照片的 EXIF 資料，包含拍攝地點的 GPS 座標
export type CompressOptions = {
  maxSize?: number
  quality?: number
}

export async function compressImage(
  file: File,
  { maxSize = 1920, quality = 0.82 }: CompressOptions = {},
): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    // imageOrientation: 'from-image' 依照 EXIF 的方向資訊轉正，手機直拍的照片才不會躺著
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('無法讀取這張圖片，請改用 JPG、PNG 或 WebP 格式')
  }

  // 只縮小不放大：最長邊超過 maxSize 才等比例縮小
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('這個瀏覽器無法處理圖片')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // 優先轉成 WebP；不支援 WebP 編碼的瀏覽器會偷偷改給 PNG，這時改用 JPEG
  const webp = await toBlob(canvas, 'image/webp', quality)
  if (webp.type === 'image/webp') return webp

  // JPEG 沒有透明度，透明的地方會變黑色，先在圖片「後面」鋪一層白色
  context.globalCompositeOperation = 'destination-over'
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, width, height)
  return toBlob(canvas, 'image/jpeg', quality)
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('圖片轉換失敗'))),
      type,
      quality,
    )
  })
}
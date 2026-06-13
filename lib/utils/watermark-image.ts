import sharp from 'sharp'

const WATERMARK_LABEL = 'KelalShop'
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export async function applyKelalShopWatermark(
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const input = Buffer.from(fileBuffer)
  const normalizedType = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType

  if (!ALLOWED_TYPES.has(mimeType) && !ALLOWED_TYPES.has(normalizedType)) {
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    return { buffer: input, contentType: mimeType, ext }
  }

  try {
    const image = sharp(input)
    const metadata = await image.metadata()
    const width = metadata.width ?? 800
    const height = metadata.height ?? 600
    const minDim = Math.min(width, height)
    const centerFontSize = Math.max(32, Math.round(minDim * 0.1))
    const cornerFontSize = Math.max(18, Math.round(minDim * 0.055))
    const badgeW = cornerFontSize * 8 + 8

    const svg = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <!-- Center Watermark -->
        <g transform="translate(${width / 2}, ${height / 2}) rotate(-25)">
          <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${centerFontSize}" font-weight="700" fill="#ffffff" fill-opacity="0.25">${WATERMARK_LABEL}</text>
        </g>
        <!-- Corner Watermark Badge -->
        <rect x="${width - badgeW - 16}" y="${height - cornerFontSize - 36}" width="${badgeW}" height="${cornerFontSize + 16}" rx="8" fill="#000000" fill-opacity="0.35"/>
        <text x="${width - 20}" y="${height - 24}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${cornerFontSize}" font-weight="700" fill="#ffffff" fill-opacity="0.92">${WATERMARK_LABEL}</text>
      </svg>
    `)

    const composited = await image.composite([{ input: svg, top: 0, left: 0 }]).toBuffer()

    if (normalizedType === 'image/png') {
      return {
        buffer: await sharp(composited).png({ compressionLevel: 8 }).toBuffer(),
        contentType: 'image/png',
        ext: 'png',
      }
    }
    if (normalizedType === 'image/webp') {
      return {
        buffer: await sharp(composited).webp({ quality: 85 }).toBuffer(),
        contentType: 'image/webp',
        ext: 'webp',
      }
    }
    return {
      buffer: await sharp(composited).jpeg({ quality: 88, mozjpeg: true }).toBuffer(),
      contentType: 'image/jpeg',
      ext: 'jpg',
    }
  } catch {
    const ext = normalizedType === 'image/png' ? 'png' : normalizedType === 'image/webp' ? 'webp' : 'jpg'
    return { buffer: input, contentType: normalizedType, ext }
  }
}

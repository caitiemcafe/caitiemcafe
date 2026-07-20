import { resolve } from 'node:path'
import QRCode from 'qrcode'

const raw = process.argv[2]
if (!raw) throw new Error('Cách dùng: npm run generate:qr -- https://ten-mien-cua-ban/vibe')
const url = new URL(raw)
if (url.protocol !== 'https:' || url.pathname.replace(/\/$/, '') !== '/vibe') throw new Error('QR production phải là URL HTTPS có đường dẫn /vibe.')
const output = resolve('frontend/public/images/brand/vibe-qr.png')
await QRCode.toFile(output, url.toString(), { width: 1200, margin: 3, errorCorrectionLevel: 'H', color: { dark: '#3B2417', light: '#F5EBDD' } })
console.log(`Đã tạo QR: ${output}\nURL: ${url}`)

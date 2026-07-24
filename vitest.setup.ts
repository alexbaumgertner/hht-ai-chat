import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(dirname, '.env') })
dotenv.config({ path: path.resolve(dirname, '.env.local'), override: true })

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

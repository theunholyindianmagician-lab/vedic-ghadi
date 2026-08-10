/**
 * Shim for the Python parity test (backend/tests/test_parity.py).
 *
 * Invoked as:
 *   node --experimental-strip-types _parity_shim.mts YYYY MM DD HH MM SS TZ [LAT LON]
 *
 * Prints the JSON stamp from the TypeScript substrate so the Python suite
 * can compare it against its own output, field-by-field.
 */
import { kalaSubstrateStamp } from "./substrate.ts"

const args = process.argv.slice(2).map(Number)
const [y, mo, d, h, mi, sec, tz] = args
const lat = args[7]
const lon = args[8]
process.stdout.write(JSON.stringify(
  Number.isFinite(lat) && Number.isFinite(lon)
    ? kalaSubstrateStamp(y, mo, d, h, mi, sec, tz, lat, lon)
    : kalaSubstrateStamp(y, mo, d, h, mi, sec, tz),
))

/**
 * Shim for the Python parity test (backend/tests/test_parity.py).
 *
 * Invoked as:
 *   node --experimental-strip-types _parity_shim.mts YYYY MM DD HH MM SS TZ
 *
 * Prints the JSON stamp from the TypeScript substrate so the Python suite
 * can compare it against its own output, field-by-field.
 */
import { kalaSubstrateStamp } from "./substrate.ts"

const [y, mo, d, h, mi, sec, tz] = process.argv.slice(2).map(Number)
process.stdout.write(JSON.stringify(
  kalaSubstrateStamp(y, mo, d, h, mi, sec, tz),
))

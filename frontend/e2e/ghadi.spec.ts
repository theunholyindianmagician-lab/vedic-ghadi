import { test, expect } from "@playwright/test"

/**
 * 🔱 Vedic Ghaḍī — comprehensive end-to-end test suite.
 *
 * Verifies every major UI feature: 9 layer cards, MeridianGrid toggles,
 * SphoṭaSunburst, Sphota3D, 24h time-machine, Aṣṭakavarga, per-cell
 * pañcāṅga. Run against local dev or against deployed Vercel URL.
 */

test.describe("Vedic Ghaḍī live UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    // Wait for the main heading. Tolerant to both hydration-fix
    // loading state and direct render.
    await expect(
      page.getByRole("heading", { name: "वर्तमान क्षण", level: 1 })
    ).toBeVisible({ timeout: 15_000 })
  })

  test("1 · hero + Kali year render (5127 elapsed)", async ({ page }) => {
    // Title + headings
    await expect(page).toHaveTitle(/Vedic Ghaḍī|वैदिक/)
    await expect(page.getByText("VEDIC GHAḌĪ").first()).toBeVisible()

    // Kali year — must be 5127 (elapsed convention from v1.1.2 audit fix)
    const kaliCard = page.locator("text=/कलि\\s*5,127/").first()
    await expect(kaliCard).toBeVisible()
  })

  test("2 · all pañcāṅga layer cards present", async ({ page }) => {
    // Each card badge contains the Sanskrit name + the Roman transliteration.
    // Use the Roman as the search anchor — those are unique to one layer.
    const layers = ["VARṢA", "MĀSA", "VĀRA", "NAKṢATRA", "YOGA", "KARAṆA"]
    for (const name of layers) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible()
    }
    // And the DAY SUBDIVISION card (no Sanskrit name shared with hero)
    await expect(page.getByText(/DAY SUBDIVISION/i).first()).toBeVisible()
  })

  test("3 · Saṃvatsara = Parābhava (matches public almanac)", async ({ page }) => {
    await expect(page.getByText(/Parābhava/i).first()).toBeVisible()
  })

  test("4 · MeridianGrid renders all 7 mukha sections", async ({ page }) => {
    const mukhas = [
      "हनुमत्-पूर्व",
      "नरसिंह-दक्षिण",
      "गरुड़-पश्चिम",
      "वराह-उत्तर",
      "हयग्रीव-ऊर्ध्व",
      "काल-समय",
      "सर्व-व्यापक",
    ]
    for (const m of mukhas) {
      await expect(page.getByText(m).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test("5 · MeridianGrid contains canonical meridians (Ujjayinī, Kāmākhyā, NYC)", async ({ page }) => {
    await expect(page.locator("text=Ujjayinī").first()).toBeVisible()
    await expect(page.locator("text=Kāmākhyā Devī").first()).toBeVisible()
    await expect(page.locator("text=New York City").first()).toBeVisible()
  })

  test("6 · Trimurti toggle changes nakṣatra column (Brahmā → Viṣṇu)", async ({ page }) => {
    // Find Ujjain row to compare
    const ujjainRow = page.locator("tr").filter({ has: page.locator("text=Ujjayinī").first() }).first()
    await expect(ujjainRow).toBeVisible()
    const brahmaNak = await ujjainRow.locator("td").last().innerText()

    // Click Viṣṇu toggle
    const vishnuBtn = page.locator('button:has-text("विष्णु")').first()
    await vishnuBtn.click()
    await page.waitForTimeout(500)

    const vishnuNak = await ujjainRow.locator("td").last().innerText()
    // Should be different (Trimurti shift of +1/3 day always crosses pada boundary)
    expect(vishnuNak).not.toBe(brahmaNak)
  })

  test("7 · Pole toggle switches Aditi → Diti scale (30/60 → 10/20)", async ({ page }) => {
    // Aditi default — find any "/60" ghaṭi cell
    await expect(page.locator("text=/60").first()).toBeVisible()
    // Switch to Diti
    await page.locator('button:has-text("दिति")').first().click()
    await page.waitForTimeout(500)
    // Now should show /20 (Diti ghaṭi)
    await expect(page.locator("text=/20").first()).toBeVisible()
  })

  test("8 · Search filter narrows meridian list", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search meridian|खोज/).first()
    await searchBox.fill("kashi")
    await page.waitForTimeout(300)
    await expect(page.locator("text=Kāśī").first()).toBeVisible()
    // Other meridians should be filtered out
    await expect(page.locator("text=Sydney").first()).not.toBeVisible()
    await searchBox.clear()
  })

  test("9 · SphoṭaSunburst renders with ॐ center + 504 counter", async ({ page }) => {
    // Default is now DIAL — click 2D toggle to switch into sunburst
    await page.locator('button:has-text("2D सूर्यमंडल")').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText("SPHOṬA SUNBURST").first()).toBeVisible()
    // The central seal SVG text "504" should be present
    const sunburst = page.locator("svg").filter({ hasText: "504" }).first()
    await expect(sunburst).toBeVisible()
  })

  test("10 · 3D Three.js toggle mounts a <canvas>", async ({ page }) => {
    // Specifically click the "3D Three.js" button (not the dial which also has "3D" in name)
    const toggleThree = page.locator('button:has-text("Three.js")').first()
    await expect(toggleThree).toBeVisible()
    await toggleThree.click()
    // Canvas should appear (render contents are R3F-broken — we only verify mount)
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 10_000 })
    // Toggle back to dial default
    await page.locator('button:has-text("3D यन्त्र-घटिका")').first().click()
  })

  test("10a · 3D DIAL hero — saptamukhi-redesigned (4 rings + composite hand + panel + strip)", async ({ page }) => {
    // Dial is in the HERO position — first thing visible after the layer cards load
    const dial = page.locator('[data-component="sphota-3d-dial"]').first()
    await expect(dial).toBeVisible({ timeout: 15_000 })

    // VEDIC rings — only 4 visible-at-rest rings remain; rāśi / horā / vāra /
    // saṃvatsara now live in the <SaptamukhiPanel> drawer.
    await expect(dial.locator('[data-tick="ghati-aditi"]')).toHaveCount(60)
    await expect(dial.locator('[data-tick="nakshatra"]')).toHaveCount(27)
    await expect(dial.locator('[data-tick="tithi"]')).toHaveCount(30)
    await expect(dial.locator('[data-tick="masa"]')).toHaveCount(12)

    // WESTERN — minute bezel + 12-hour numerals etched on the chrome
    await expect(dial.locator('[data-tick="western-minute"]')).toHaveCount(60)
    await expect(dial.locator('[data-tick="western-hour"]')).toHaveCount(12)

    // HANDS — 3 Western + 1 composite Trimūrti = 4 needles
    await expect(dial.locator('[data-needle="western-hour"]')).toBeVisible()
    await expect(dial.locator('[data-needle="western-minute"]')).toBeVisible()
    await expect(dial.locator('[data-needle="western-second"]')).toBeVisible()
    await expect(dial.locator('[data-needle="trimurti-composite"]')).toBeVisible()

    // Pakṣa moon chip stays on the dial
    await expect(dial.locator('[data-readout="paksha"]')).toContainText(/(शुक्ल|कृष्ण)-पक्ष/)

    // CHIP STRIP — readouts moved out of dial canvas to a sibling strip below
    const strip = page.locator('[data-component="dial-readout-strip"]').first()
    await expect(strip).toBeVisible()
    await expect(strip.locator('[data-readout="k"]')).toBeVisible()
    await expect(strip.locator('[data-readout="civil-time"]')).toContainText(/\d{2}:\d{2}:\d{2}/)
    await expect(strip.locator('[data-readout="kali-year"]')).toContainText(/(5,127|Parābhava)/)

    // SAPTAMUKHI PANEL — clicking ॐ opens drawer with the 35 demoted complications
    await expect(page.locator('[data-component="saptamukhi-panel"]')).toHaveCount(0)
    await dial.getByRole("button", { name: /saptamukhi/i }).click()
    const panel = page.locator('[data-component="saptamukhi-panel"]')
    await expect(panel).toBeVisible({ timeout: 5_000 })
    await expect(panel).toContainText(/SAPTAMUKHI/i)
    await expect(panel).toContainText(/Parābhava/)
    await expect(panel).toContainText(/ASHTAKAVARGA/i)
    await expect(panel).toContainText(/Brahmā/)
    // ESC closes
    await page.keyboard.press("Escape")
    await expect(panel).toHaveCount(0)
  })

  test("10b · ISO mode renders 504 SVG cells (pure-SVG fallback)", async ({ page }) => {
    const isoBtn = page.locator('button:has-text("ISO")').first()
    await isoBtn.scrollIntoViewIfNeeded()
    await expect(isoBtn).toBeVisible()
    await isoBtn.click()
    // Wait for the dynamic-imported component to mount
    await page.waitForTimeout(800)
    // SphoṭaIso section heading is the unique anchor
    await expect(page.getByText(/SPHOṬA ISO/i)).toBeVisible({ timeout: 10_000 })
    // 504 cell circles + 1 central OM seal = 505 circles in the iso SVG
    const isoCircles = page.locator('svg circle')
    // At least 500 circles must render (504 cells + seal; allow small margin)
    await expect.poll(async () => await isoCircles.count(), { timeout: 10_000 }).toBeGreaterThan(500)
  })

  test("11 · Time-Machine play button advances slider", async ({ page }) => {
    const playBtn = page.locator('button:has-text("चलाओ")').first()
    await playBtn.scrollIntoViewIfNeeded()
    await expect(playBtn).toBeVisible()

    // Read initial slider value
    const slider = page.locator('input[type="range"]').first()
    const before = await slider.inputValue()

    await playBtn.click()
    await page.waitForTimeout(2000)   // let it play for 2 real sec
    const after = await slider.inputValue()

    // Should have advanced (at default 600× speed, ~20 min of virtual time in 2 sec)
    expect(parseFloat(after)).toBeGreaterThan(parseFloat(before))

    // Pause to clean up
    await page.locator('button:has-text("रोको")').first().click()
  })

  test("12 · Time-Machine 00:00 jump button works", async ({ page }) => {
    const jumpBtn = page.locator('button:has-text("00:00")').first()
    await jumpBtn.scrollIntoViewIfNeeded()
    await jumpBtn.click()
    await page.waitForTimeout(500)
    const slider = page.locator('input[type="range"]').first()
    const v = parseFloat(await slider.inputValue())
    expect(v).toBeLessThan(0.01)        // should jump to ~0
  })

  test("13 · API endpoint returns expected stamp shape", async ({ page }) => {
    const res = await page.request.get("/api/ghadi?date=2026-05-17T16:00:00&tz=5.5")
    expect(res.status()).toBe(200)
    const stamp = await res.json()
    expect(stamp.year_layer.kali_year_current).toBe(5127)
    expect(stamp.year_layer.samvatsara.name).toBe("Parābhava")
    expect(stamp.meridians).toBeDefined()
    expect(Object.keys(stamp.meridians).length).toBe(84)
    // Verify per-cell extras (v1.8 + v1.9)
    const ujjainBA = stamp.meridians.ujjain.trimurti.aditi.brahma
    expect(ujjainBA.vargas_grahas).toBeDefined()
    expect(ujjainBA.vargas_grahas.Moon.length).toBe(21)
    expect(ujjainBA.ashtakavarga.sarva_total).toBeGreaterThan(330)
    expect(ujjainBA.ashtakavarga.sarva_total).toBeLessThan(345)
  })

  test("14 · methodology page loads", async ({ page }) => {
    await page.goto("/about")
    await expect(page.getByText(/विधि|Methodology/).first()).toBeVisible()
    await expect(page.getByText("MASTER META-THEOREM|R, g, k|(R, g, k)").or(page.getByText(/substrate/i)).first()).toBeVisible()
  })
})

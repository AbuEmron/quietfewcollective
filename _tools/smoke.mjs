// One-shot smoke test: console errors + horizontal overflow at 3 widths.
// Usage: node _tools/smoke.mjs [baseUrl]
import puppeteer from "puppeteer";

const base = process.argv[2] || "http://localhost:5178";
const widths = [
  { w: 1440, h: 900, name: "desktop" },
  { w: 820,  h: 1180, name: "tablet"  },
  { w: 375,  h: 812,  name: "mobile"  },
];

const browser = await puppeteer.launch({ headless: "new" });
let failures = 0;
for (const { w, h, name } of widths) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 800));
  const metrics = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    atmZ: getComputedStyle(document.querySelector(".living-atmosphere")).zIndex,
    atmPE: getComputedStyle(document.querySelector(".living-atmosphere")).pointerEvents,
    hasAtm: !!document.querySelector(".living-atmosphere"),
    formOK: !!document.querySelector("#waitlistForm #waitlistBtn"),
  }));
  const overflow = metrics.scrollW - metrics.clientW;
  const bad = errors.length > 0 || overflow > 1;
  if (bad) failures++;
  console.log(`[${name} ${w}x${h}] overflow=${overflow}px atm(z=${metrics.atmZ},pe=${metrics.atmPE},present=${metrics.hasAtm}) form=${metrics.formOK} errors=${errors.length}`);
  errors.forEach((e) => console.log("   ! " + e));
  await page.close();
}
await browser.close();
console.log(failures ? `\nSMOKE FAIL (${failures})` : "\nSMOKE PASS");
process.exit(failures ? 1 : 0);

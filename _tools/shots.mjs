// Host-side preview screenshots for sharing (not part of the shipped site).
// Renders the running site at a desktop viewport and writes PNGs to disk.
// Usage: node _tools/shots.mjs <baseUrl> <heroOut> <appsOut>
import puppeteer from "puppeteer";

const [baseUrl, heroOut, appsOut] = process.argv.slice(2);
const WIDTH = 1280, HEIGHT = 860;

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  // Force scroll-reveal elements visible + freeze motion so nothing is caught mid-fade.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible")));
  await new Promise((r) => setTimeout(r, 500));

  // 1) Hero / top of page — viewport-height shot.
  await page.screenshot({ path: heroOut, type: "png" });
  console.log("wrote", heroOut);

  // 2) Apps hub section — framed to the section.
  const clip = await page.evaluate(() => {
    const el = document.querySelector("#apps");
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    return { x: 0, y: Math.max(0, top - 24), width: document.documentElement.clientWidth, height: r.height + 48 };
  });
  await page.screenshot({ path: appsOut, type: "png", clip });
  console.log("wrote", appsOut);
} finally {
  await browser.close();
}

// Full-page preview screenshot (for sharing). Not part of the shipped site.
// Usage: node _tools/fullshot.mjs <baseUrl> <outFile>
import puppeteer from "puppeteer";

const [baseUrl, outFile] = process.argv.slice(2);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  // Reduced motion => .reveal elements render fully visible, animations frozen.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible")));
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: outFile, type: "png", fullPage: true });
  console.log("wrote", outFile);
} finally {
  await browser.close();
}

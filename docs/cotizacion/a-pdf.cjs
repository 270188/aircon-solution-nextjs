// Convierte la cotización HTML a PDF A4 y a una imagen de vista previa.
// Uso: node a-pdf.cjs <archivo.html> <carpeta-salida>
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const [html, outDir] = process.argv.slice(2);
  const base = path.join(outDir, path.basename(html, '.html'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(html).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `${base}.pdf`, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.screenshot({ path: `${base}.png`, fullPage: true });
  await browser.close();
})();

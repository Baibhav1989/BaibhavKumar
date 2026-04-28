#!/usr/bin/env node
/**
 * Generates a PDF from resume.html using Puppeteer.
 * Output: "Baibhav Kumar – Salesforce Architect.pdf"
 *
 * Run: node generate-resume-pdf.js
 * (Puppeteer is auto-installed if missing)
 */

const fs = require('fs');
const path = require('path');

async function generatePDF() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('Installing puppeteer…');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer --no-save', { stdio: 'inherit' });
    puppeteer = require('puppeteer');
  }

  const htmlPath = path.join(__dirname, 'resume.html');
  const pdfPath = path.join(__dirname, 'Baibhav Kumar – Salesforce Architect.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('resume.html not found');
    process.exit(1);
  }

  console.log('Launching browser…');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Load Google Fonts and inline scripts
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // Let script.js run (experience-years counter, etc.)
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-experience-years]');
    return el && el.textContent.trim() !== '0';
  }, { timeout: 5000 }).catch(() => {});

  // Small settling delay for fonts/layout
  await new Promise(r => setTimeout(r, 400));

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
    printBackground: true,
    displayHeaderFooter: false,
  });

  await browser.close();
  console.log('PDF saved:', pdfPath);
}

generatePDF().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

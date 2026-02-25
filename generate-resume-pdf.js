#!/usr/bin/env node
/**
 * Generates PDF from resume.html using Puppeteer
 * Run: npx puppeteer node generate-resume-pdf.js
 * Or: node generate-resume-pdf.js (after npm install puppeteer)
 */

const fs = require('fs');
const path = require('path');

async function generatePDF() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('Installing puppeteer...');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer --no-save', { stdio: 'inherit' });
    puppeteer = require('puppeteer');
  }

  const htmlPath = path.join(__dirname, 'resume.html');
  const pdfPath = path.join(__dirname, 'Baibhav_Kumar_Resume.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('resume.html not found');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 150));

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  });

  await browser.close();
  console.log('PDF generated:', pdfPath);
}

generatePDF().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

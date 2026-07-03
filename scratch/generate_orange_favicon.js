const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgString = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" ry="128" fill="#FF6A00" />
  <g transform="translate(96, 96) scale(13.333333333333334)">
    <circle cx="9" cy="20" r="1.5" fill="white" />
    <circle cx="17" cy="20" r="1.5" fill="white" />
    <path
      d="M3 4h2l2.2 11.4a2 2 0 002 1.6h8.6a2 2 0 001.9-1.5L21 7H7"
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>
`;

async function main() {
  const buffer = Buffer.from(svgString);

  // Generate 512x512 PNG
  const png512 = await sharp(buffer)
    .png()
    .toBuffer();

  // Generate 32x32 PNG for favicon.ico
  const png32 = await sharp(buffer)
    .resize(32, 32)
    .png()
    .toBuffer();

  // Paths to save
  const targets = [
    { dir: 'public', name: 'icon.png', data: png512 },
    { dir: 'public', name: 'favicon.png', data: png512 },
    { dir: 'public', name: 'favicon.ico', data: png32 },
    { dir: 'app', name: 'icon.png', data: png512 },
    { dir: 'app', name: 'apple-icon.png', data: png512 },
    { dir: 'app', name: 'favicon.ico', data: png32 }
  ];

  for (const target of targets) {
    const filePath = path.join(__dirname, '..', target.dir, target.name);
    fs.writeFileSync(filePath, target.data);
    console.log(`Saved: ${filePath}`);
  }

  console.log('All icons generated successfully!');
}

main().catch(console.error);

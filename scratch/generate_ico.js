const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  const sourcePath = path.join(__dirname, '../app/icon.png');
  const targetPaths = [
    path.join(__dirname, '../app/favicon.ico'),
    path.join(__dirname, '../public/favicon.ico')
  ];

  console.log(`Reading source icon from: ${sourcePath}`);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source icon not found at ${sourcePath}`);
  }

  const sizes = [16, 32, 48];
  const pngBuffers = [];

  for (const size of sizes) {
    console.log(`Resizing to ${size}x${size}...`);
    const buffer = await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buffer });
  }

  // ICO header: 6 bytes
  // - Reserved (2 bytes, must be 0)
  // - Type (2 bytes, 1 for ICO)
  // - Count (2 bytes, number of images)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  // Directory entries: 16 bytes per image
  const directoryEntries = [];
  let currentOffset = 6 + 16 * sizes.length;

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    // Width (1 byte, 0 means 256)
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    // Height (1 byte, 0 means 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    // Color palette (1 byte, 0)
    entry.writeUInt8(0, 2);
    // Reserved (1 byte, 0)
    entry.writeUInt8(0, 3);
    // Color planes (2 bytes, 1)
    entry.writeUInt16LE(1, 4);
    // Bits per pixel (2 bytes, 32 bits for PNG)
    entry.writeUInt16LE(32, 6);
    // Image data size (4 bytes)
    entry.writeUInt32LE(buffer.length, 8);
    // Image data offset (4 bytes)
    entry.writeUInt32LE(currentOffset, 12);

    currentOffset += buffer.length;
    directoryEntries.push(entry);
  }

  // Concatenate all parts
  const icoBuffer = Buffer.concat([
    header,
    ...directoryEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);

  for (const targetPath of targetPaths) {
    fs.writeFileSync(targetPath, icoBuffer);
    console.log(`Successfully generated ICO at ${targetPath} (${icoBuffer.length} bytes)`);
  }
}

generateIco().catch(err => {
  console.error(err);
  process.exit(1);
});

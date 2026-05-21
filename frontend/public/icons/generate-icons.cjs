/**
 * PWA Icon Generator — Tạo placeholder PNG icons từ Canvas
 * Chạy: node generate-icons.js
 * 
 * Tạo các kích thước icon cần thiết cho PWA manifest.
 * Sử dụng canvas đơn giản (không cần dependency ngoài).
 */

const fs = require('fs');
const path = require('path');

// Các kích thước cần tạo
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Tạo 1-pixel PNG placeholder cho mỗi size
// (Production: thay bằng real PNG icons hoặc dùng sharp/canvas)
function createPlaceholderPNG(size) {
  // Minimal PNG — solid color block
  // Trong production, dùng tool như sharp hoặc Figma export
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg)"/>
    <text x="${size/2}" y="${size * 0.66}" text-anchor="middle" fill="white" font-size="${Math.round(size * 0.55)}" font-weight="bold" font-family="system-ui">N</text>
  </svg>`;
  
  return svg;
}

sizes.forEach((size) => {
  const svgContent = createPlaceholderPNG(size);
  const filePath = path.join(__dirname, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filePath, svgContent, 'utf-8');
  console.log(`✓ Created icon-${size}x${size}.svg`);
});

console.log('\\n📌 Note: Manifest references .png files.');
console.log('   For production, convert SVGs to PNGs using:');
console.log('   - sharp (npm install sharp)');
console.log('   - Figma export');
console.log('   - Online SVG-to-PNG converter');
console.log('\\nFor now, update manifest.json to use .svg extension,');
console.log('or use a build tool to auto-convert.');

// Simple script to generate PWA icons using Canvas API
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.1}"/>
    <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" fill="white" rx="${size * 0.05}"/>
    <rect x="${size * 0.3}" y="${size * 0.3}" width="${size * 0.4}" height="${size * 0.1}" fill="#2563eb" rx="${size * 0.02}"/>
    <rect x="${size * 0.3}" y="${size * 0.45}" width="${size * 0.4}" height="${size * 0.1}" fill="#2563eb" rx="${size * 0.02}"/>
    <rect x="${size * 0.3}" y="${size * 0.6}" width="${size * 0.4}" height="${size * 0.1}" fill="#2563eb" rx="${size * 0.02}"/>
  </svg>`;
};

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
iconSizes.forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

// Generate maskable icons (same as regular for now)
[192, 512].forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `maskable-icon-${size}x${size}.svg`), svg);
  console.log(`Generated maskable-icon-${size}x${size}.svg`);
});

console.log('PWA icons generated successfully!');
console.log('Note: For production, convert SVG icons to PNG format for better browser support.');









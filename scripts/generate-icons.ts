import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 512x512 Standalone SVG Icon matching the user's uploaded image exactly
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Subtle soft shadow under the central disc -->
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#17212B" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Outer Dashed Orbit Circle (Light Blue/Gray) -->
  <circle
    cx="256"
    cy="256"
    r="192"
    fill="none"
    stroke="#CBD5E1"
    stroke-width="14"
    stroke-linecap="round"
    stroke-dasharray="16 16"
  />

  <!-- Main Dark Badge Circle (Obsidian Charcoal Navy #17212B) -->
  <circle
    cx="256"
    cy="256"
    r="144"
    fill="#17212B"
    filter="url(#badgeShadow)"
  />

  <!-- Crisp White Checkmark in the Center -->
  <path
    d="M 204 258 L 244 298 L 314 220"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Golden-Amber Sun Dot on the Orbit at Top-Right (approx 1:30 position) with Clean White Border -->
  <g transform="translate(362, 150)">
    <circle
      cx="0"
      cy="0"
      r="28"
      fill="#F2A33A"
      stroke="#FFFFFF"
      stroke-width="8"
    />
  </g>
</svg>
`;

// App Icon with subtle safe-area background for mobile home screens (Apple Touch & PWA)
const svgAppIconWithBackground = (bg = '#EEF3F6') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="badgeShadowBg" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#17212B" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Soft Rounded Card Background -->
  <rect width="512" height="512" rx="112" fill="${bg}" />

  <!-- Outer Dashed Orbit Circle -->
  <circle
    cx="256"
    cy="256"
    r="164"
    fill="none"
    stroke="#CBD5E1"
    stroke-width="12"
    stroke-linecap="round"
    stroke-dasharray="14 14"
  />

  <!-- Main Dark Badge Circle -->
  <circle
    cx="256"
    cy="256"
    r="124"
    fill="#17212B"
    filter="url(#badgeShadowBg)"
  />

  <!-- Crisp White Checkmark -->
  <path
    d="M 212 258 L 246 292 L 306 226"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="24"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Golden Sun Dot with White Halo -->
  <g transform="translate(348, 164)">
    <circle
      cx="0"
      cy="0"
      r="24"
      fill="#F2A33A"
      stroke="#FFFFFF"
      stroke-width="7"
    />
  </g>
</svg>
`;

// Maskable PWA Icon (Extra padding so circular/squircle cuts do not crop the orbit)
const svgMaskableIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="badgeShadowM" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#17212B" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Solid background fill to edge for Android Adaptive Icons -->
  <rect width="512" height="512" fill="#EEF3F6" />

  <!-- Outer Dashed Orbit Circle inside safe zone -->
  <circle
    cx="256"
    cy="256"
    r="140"
    fill="none"
    stroke="#CBD5E1"
    stroke-width="11"
    stroke-linecap="round"
    stroke-dasharray="12 12"
  />

  <!-- Main Dark Badge Circle -->
  <circle
    cx="256"
    cy="256"
    r="105"
    fill="#17212B"
    filter="url(#badgeShadowM)"
  />

  <!-- Crisp White Checkmark -->
  <path
    d="M 218 258 L 248 288 L 298 230"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="20"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Golden Sun Dot with White Halo -->
  <g transform="translate(334, 178)">
    <circle
      cx="0"
      cy="0"
      r="20"
      fill="#F2A33A"
      stroke="#FFFFFF"
      stroke-width="6"
    />
  </g>
</svg>
`;

async function generateIcons() {
  const publicDir = path.resolve('public');

  // 1. Write the primary icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf-8');
  console.log('Saved /public/icon.svg');

  // 2. Generate PNGs using Sharp
  const svgBuf = Buffer.from(svgAppIconWithBackground('#EEF3F6'));
  const maskableBuf = Buffer.from(svgMaskableIcon);

  // 512x512 PWA Icon
  await sharp(svgBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved /public/pwa-512x512.png');

  // 192x192 PWA Icon
  await sharp(svgBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved /public/pwa-192x192.png');

  // Maskable 512x512 PWA Icon
  await sharp(maskableBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved /public/pwa-maskable-512x512.png');

  // Apple Touch Icon 180x180
  await sharp(svgBuf)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved /public/apple-touch-icon.png');

  // Favicon 32x32 and 64x64 PNG
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(Buffer.from(svgIcon))
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Saved favicons');
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Import creatures data
const creatures = [
  {
    id: 'shark-1',
    name: 'Great White Shark',
    markerId: 'shark-marker',
  },
  {
    id: 'dolphin-1',
    name: 'Bottlenose Dolphin',
    markerId: 'dolphin-marker',
  },
  {
    id: 'turtle-1',
    name: 'Sea Turtle',
    markerId: 'turtle-marker',
  },
  {
    id: 'octopus-1',
    name: 'Giant Pacific Octopus',
    markerId: 'octopus-marker',
  },
  {
    id: 'jellyfish-1',
    name: 'Moon Jellyfish',
    markerId: 'jellyfish-marker',
  },
  {
    id: 'whale-1',
    name: 'Humpback Whale',
    markerId: 'whale-marker',
  },
];

// QR code generation function
const generateQRCodeData = (markerId) => {
  return JSON.stringify({
    type: 'aquarium-creature',
    markerId,
    timestamp: Date.now(),
    version: '1.0',
  });
};

async function generateAllQRCodes() {
  const outputDir = path.join(__dirname, '../public/qr-codes');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🌊 Generating QR codes for Aquarium creatures...\n');

  for (const creature of creatures) {
    try {
      const qrData = generateQRCodeData(creature.markerId);
      const filename = `${creature.id}-qr.png`;
      const filepath = path.join(outputDir, filename);

      // Generate QR code with custom options
      await QRCode.toFile(filepath, qrData, {
        width: 512,
        margin: 2,
        color: {
          dark: '#1e3a8a', // Blue color matching the aquarium theme
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      console.log(`✅ Generated QR code for ${creature.name}`);
      console.log(`   File: /qr-codes/${filename}`);
      console.log(`   Data: ${qrData}\n`);
    } catch (error) {
      console.error(`❌ Failed to generate QR code for ${creature.name}:`, error);
    }
  }

  // Generate a single printable sheet with all QR codes
  await generatePrintableSheet(creatures, outputDir);

  console.log('🎉 All QR codes generated successfully!');
  console.log('📄 Access them at: https://aquarium.loca.lt/qr-codes/');
}

async function generatePrintableSheet(creatures, outputDir) {
  console.log('📋 Generating printable QR code sheet...');

  // Create HTML content for printable sheet
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aquarium QR Codes - Print Sheet</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-bottom: 30px;
    }
    .qr-item {
      text-align: center;
      border: 2px solid #e5e7eb;
      border-radius: 15px;
      padding: 20px;
      break-inside: avoid;
    }
    .qr-item img {
      width: 200px;
      height: 200px;
      margin-bottom: 15px;
    }
    .creature-name {
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    .instructions {
      font-size: 12px;
      color: #6b7280;
      margin-top: 10px;
    }
    @media print {
      body { margin: 0; }
      .header { page-break-after: avoid; }
      .qr-item { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌊 Aquarium WebAR Experience</h1>
    <h2>QR Codes for Sea Creature Exhibits</h2>
    <p>Scan these codes with your smartphone to bring sea creatures to life in AR!</p>
  </div>

  <div class="grid">
    ${creatures.map(creature => `
      <div class="qr-item">
        <img src="${creature.id}-qr.png" alt="QR Code for ${creature.name}" />
        <div class="creature-name">${creature.name}</div>
        <div class="instructions">
          Scan with camera to view in AR<br>
          Visit: https://aquarium.loca.lt/ar
        </div>
      </div>
    `).join('')}
  </div>

  <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280;">
    <p>🔗 Direct AR Experience: https://aquarium.loca.lt/ar</p>
    <p>📱 Works on any smartphone browser - no app required!</p>
  </div>
</body>
</html>`;

  const htmlPath = path.join(outputDir, 'print-sheet.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('✅ Printable sheet generated: /qr-codes/print-sheet.html');
}

// Run the generator
generateAllQRCodes().catch(console.error);
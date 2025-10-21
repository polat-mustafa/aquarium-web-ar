const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Import creatures data - ALL creatures from gallery
const creatures = [
  // Fish
  { id: 'shark', name: 'Shark', markerId: 'shark-marker' },
  { id: 'angelfish', name: 'Angelfish', markerId: 'angelfish-marker' },
  { id: 'tuna', name: 'Tuna', markerId: 'tuna-marker' },

  // Marine Mammals
  { id: 'whale', name: 'Whale', markerId: 'whale-marker' },
  { id: 'dolphin', name: 'Dolphin', markerId: 'dolphin-marker' },
  { id: 'seal', name: 'Seal', markerId: 'seal-marker' },

  // Shellfish
  { id: 'crab', name: 'Crab', markerId: 'crab-marker' },
  { id: 'lobster', name: 'Lobster', markerId: 'lobster-marker' },
  { id: 'shrimp', name: 'Shrimp', markerId: 'shrimp-marker' },

  // Mollusks
  { id: 'octopus', name: 'Octopus', markerId: 'octopus-marker' },
  { id: 'squid', name: 'Squid', markerId: 'squid-marker' },

  // Jellyfish
  { id: 'jellyfish', name: 'Jellyfish', markerId: 'jellyfish-marker' },
  { id: 'medusa', name: 'Medusa', markerId: 'medusa-marker' },

  // Sea Reptiles
  { id: 'turtle', name: 'Turtle', markerId: 'turtle-marker' },
  { id: 'sea-snake', name: 'Sea Snake', markerId: 'sea-snake-marker' },

  // Baltic Species
  { id: 'herring', name: 'Herring', markerId: 'herring-marker' },
  { id: 'cod', name: 'Cod', markerId: 'cod-marker' },
  { id: 'flounder', name: 'Flounder', markerId: 'flounder-marker' },
  { id: 'baltic-seal', name: 'Baltic Seal', markerId: 'baltic-seal-marker' },

  // 3D Model Creatures
  { id: 'model-tuna-fish', name: 'Tuna Fish', markerId: 'tuna-fish-marker' },
  { id: 'model-zebrasoma-xanthurum', name: 'Zebrasoma Xanthurum', markerId: 'zebrasoma-marker' },
];

// QR code generation function - generates direct AR URLs
const generateQRCodeData = (creatureId) => {
  // Generate direct URL to AR experience for this specific creature
  return `https://aquarium-web-ar.vercel.app/ar?creature=${creatureId}`;
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
      const qrData = generateQRCodeData(creature.id);
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
      console.log(`   URL: ${qrData}\n`);
    } catch (error) {
      console.error(`❌ Failed to generate QR code for ${creature.name}:`, error);
    }
  }

  // Generate a single printable sheet with all QR codes
  await generatePrintableSheet(creatures, outputDir);

  console.log('🎉 All QR codes generated successfully!');
  console.log('📄 Access them at: https://aquarium-web-ar.vercel.app/qr-codes/');
}

async function generatePrintableSheet(creatures, outputDir) {
  console.log('📋 Generating printable QR code sheet...');

  // Create HTML content for printable sheet
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aquarium QR Codes - Print Sheet</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);
      color: #1e293b;
      padding: 40px 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .header {
      text-align: center;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 3px solid #0ea5e9;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 30px;
      border-radius: 16px;
    }

    .header h1 {
      font-size: 42px;
      font-weight: 800;
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }

    .header h2 {
      font-size: 24px;
      color: #1e40af;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .header p {
      font-size: 16px;
      color: #475569;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .qr-item {
      text-align: center;
      border: 3px solid #e0f2fe;
      border-radius: 20px;
      padding: 30px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      break-inside: avoid;
    }

    .qr-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(14, 165, 233, 0.2);
      border-color: #0ea5e9;
    }

    .qr-item img {
      width: 220px;
      height: 220px;
      margin-bottom: 20px;
      border-radius: 12px;
      padding: 10px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .creature-name {
      font-size: 22px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 12px;
    }

    .instructions {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 10px;
      margin-top: 12px;
    }

    .domain-highlight {
      color: #0ea5e9;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .footer {
      text-align: center;
      margin-top: 50px;
      padding: 30px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 16px;
      border: 2px solid #bae6fd;
    }

    .footer p {
      font-size: 15px;
      color: #334155;
      margin: 8px 0;
      line-height: 1.8;
    }

    .footer-icon {
      font-size: 20px;
      margin-right: 8px;
    }

    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0;
    }

    @media print {
      body {
        margin: 0;
        padding: 20px;
        background: white;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
      .header {
        page-break-after: avoid;
        box-shadow: none;
      }
      .qr-item {
        page-break-inside: avoid;
        box-shadow: none;
      }
      .qr-item:hover {
        transform: none;
        box-shadow: none;
      }
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .header h1 {
        font-size: 32px;
      }
      .header h2 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌊 Aquarium WebAR Experience</h1>
      <h2>QR Codes for Sea Creature Exhibits</h2>
      <p>Scan these codes with your smartphone to bring sea creatures to life in AR!</p>
      <div class="badge">No App Required</div>
    </div>

    <div class="grid">
${creatures.map(creature => `
      <div class="qr-item">
        <img src="${creature.id}-qr.png" alt="QR Code for ${creature.name}" />
        <div class="creature-name">${creature.name}</div>
        <div class="instructions">
          <strong>Scan to Experience in AR</strong><br>
          <span class="domain-highlight">aquarium-web-ar.vercel.app/ar?creature=${creature.id}</span>
        </div>
      </div>
`).join('')}
    </div>

    <div class="footer">
      <p><span class="footer-icon">🔗</span> <strong>Direct AR Experience:</strong> <span class="domain-highlight">aquarium-web-ar.vercel.app/ar</span></p>
      <p><span class="footer-icon">📱</span> Works on any smartphone browser - no app required!</p>
      <p><span class="footer-icon">🎨</span> View Gallery: <span class="domain-highlight">aquarium-web-ar.vercel.app/gallery</span></p>
    </div>
  </div>
</body>
</html>`;

  const htmlPath = path.join(outputDir, 'print-sheet.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('✅ Printable sheet generated: /qr-codes/print-sheet.html');
}

// Run the generator
generateAllQRCodes().catch(console.error);
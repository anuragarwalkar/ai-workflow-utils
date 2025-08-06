#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Icon sizes to process
const iconSizes = [
  { name: '48x48', size: 48 },
  { name: '72x72', size: 72 },
  { name: '96x96', size: 96 },
  { name: '128x128', size: 128 },
  { name: '144x144', size: 144 },
  { name: '152x152', size: 152 },
  { name: '192x192', size: 192 },
  { name: '256x256', size: 256 },
  { name: '384x384', size: 384 },
  { name: '512x512', size: 512 }
];

async function checkImageMagick() {
  try {
    await execAsync('convert -version');
    return true;
  } catch (error) {
    return false;
  }
}

async function createPaddedIconWithImageMagick(inputPath, outputPath, size) {
  // Create icon with 20% padding (content is 80% of canvas)
  const contentSize = Math.floor(size * 0.8);
  
  const command = `convert "${inputPath}" -resize ${contentSize}x${contentSize} -background transparent -gravity center -extent ${size}x${size} "${outputPath}"`;
  
  try {
    await execAsync(command);
    console.log(`✓ Created padded icon: ${path.basename(outputPath)} (${contentSize}px content in ${size}px canvas)`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to create ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

async function createPaddedIconWithSips(inputPath, outputPath, size) {
  // Create icon with 20% padding (content is 80% of canvas)
  const contentSize = Math.floor(size * 0.8);
  const tempPath = path.join(path.dirname(outputPath), `temp_${path.basename(outputPath)}`);
  
  try {
    // First resize the content
    await execAsync(`sips -z ${contentSize} ${contentSize} "${inputPath}" --out "${tempPath}"`);
    
    // Then create canvas with padding
    await execAsync(`sips -p ${size} ${size} "${tempPath}" --out "${outputPath}"`);
    
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    console.log(`✓ Created padded icon: ${path.basename(outputPath)} (${contentSize}px content in ${size}px canvas)`);
    return true;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.error(`✗ Failed to create ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

async function main() {
  const iconsDir = path.join(__dirname, 'ui', 'public', 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    console.error('Icons directory not found:', iconsDir);
    process.exit(1);
  }
  
  console.log('🎨 Creating padded PWA icons...\n');
  
  // Check available tools
  const hasImageMagick = await checkImageMagick();
  console.log(`ImageMagick available: ${hasImageMagick ? '✓' : '✗'}`);
  
  if (!hasImageMagick) {
    console.log('Installing ImageMagick is recommended for better results.');
    console.log('Install with: brew install imagemagick\n');
  }
  
  // Create backup directory if it doesn't exist
  const backupDir = path.join(iconsDir, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  let successCount = 0;
  let totalCount = iconSizes.length;
  
  for (const { name, size } of iconSizes) {
    const iconPath = path.join(iconsDir, `icon-${name}.png`);
    const backupPath = path.join(backupDir, `icon-${name}.png`);
    const outputPath = iconPath;
    
    if (!fs.existsSync(iconPath)) {
      console.log(`⚠️  Skipping ${name} - file not found`);
      continue;
    }
    
    // Backup original if not already backed up
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(iconPath, backupPath);
      console.log(`📦 Backed up: icon-${name}.png`);
    }
    
    let success = false;
    
    if (hasImageMagick) {
      success = await createPaddedIconWithImageMagick(backupPath, outputPath, size);
    } else {
      success = await createPaddedIconWithSips(backupPath, outputPath, size);
    }
    
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n🎉 Icon processing complete!`);
  console.log(`✓ Successfully processed: ${successCount}/${totalCount} icons`);
  console.log(`📦 Original icons backed up to: ui/public/icons/backup/`);
  console.log(`🎨 New icons have 20% padding for better macOS integration\n`);
  
  console.log('Next steps:');
  console.log('1. npm run build');
  console.log('2. Test the PWA installation');
  console.log('\nTo restore original icons if needed:');
  console.log('cp ui/public/icons/backup/* ui/public/icons/');
}

// Run the main function if this script is executed directly
main().catch(console.error);

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const src = path.join(__dirname, '../assets/realmforge_player-Template.png');
const outDir = path.join(__dirname, '../assets/slices');
const tileSize = 20;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const { width, height } = await sharp(src).metadata();
  const cols = Math.floor(width / tileSize);
  const rows = Math.floor(height / tileSize);
  const tasks = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const file = path.join(outDir, `${idx}.png`);
      tasks.push(
        sharp(src)
          .extract({ left: x * tileSize, top: y * tileSize, width: tileSize, height: tileSize })
          .toFile(file)
      );
    }
  }

  await Promise.all(tasks);
  console.log(`Sliced ${tasks.length} tiles to`, outDir);

  // Generate simple index.json listing all generated files
  const index = [];
  for (let i = 0; i < tasks.length; i++) {
    index.push({ file: `${i}.png`, index: i });
  }
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log('Created index.json');
})();
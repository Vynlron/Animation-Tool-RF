import { addCanvasSprite, screenToWorld } from '../studio/studio.js';

let isDraggingFromPalette = false;
let lastClickTime = 0;
const CLICK_DEBOUNCE = 200; // ms

// Helper function to create a sprite item for the palette
function createPaletteSprite(src) {
  const itemWrapper = document.createElement('div');
  itemWrapper.className = 'palette-sprite-item';

  const el = document.createElement('img');
  el.src = src;
  el.draggable = true;
  el.style.imageRendering = 'pixelated';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'palette-sprite-delete-btn';
  deleteBtn.textContent = 'X';
  deleteBtn.title = 'Delete from palette';

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent the click from triggering other listeners
    itemWrapper.remove(); // Remove the sprite from the panel
  });
  
  el.addEventListener('dragstart', ev => {
    isDraggingFromPalette = true;
    ev.dataTransfer.setData('text/plain', JSON.stringify({ src }));
  });

  el.addEventListener('dragend', () => {
    setTimeout(() => { isDraggingFromPalette = false; }, 10);
  });

  el.addEventListener('click', () => {
    if (isDraggingFromPalette) return;
    const now = Date.now();
    if (now - lastClickTime < CLICK_DEBOUNCE) return;
    lastClickTime = now;
    insertSprite(src, 0, 0);
  });
  
  itemWrapper.appendChild(el);
  itemWrapper.appendChild(deleteBtn);
  
  return itemWrapper;
}

export function addSpriteToPanel(src) {
  const panel = document.getElementById('sprite-selector-panel');
  if (!panel) return;

  let customCategory = panel.querySelector('.sprite-category[data-category="CUSTOM"]');
  if (!customCategory) {
    customCategory = document.createElement('div');
    customCategory.className = 'sprite-category';
    customCategory.dataset.category = 'CUSTOM';
    
    const title = document.createElement('h4');
    title.textContent = 'CUSTOM';
    
    const grid = document.createElement('div');
    grid.className = 'sprite-grid';

    customCategory.appendChild(title);
    customCategory.appendChild(grid);
    panel.appendChild(customCategory);
  }

  const grid = customCategory.querySelector('.sprite-grid');
  const spriteItem = createPaletteSprite(src);
  grid.appendChild(spriteItem);
}

export async function initSprites() {
  const img = new Image();
  img.src = 'assets/realmforge_player-Template.png';
  await img.decode();

  const tileSize = 20;
  const cols = img.width / tileSize;
  const totalTiles = cols * (img.height / tileSize);

  const panel = document.getElementById('sprite-selector-panel');
  panel.innerHTML = '';

  const categories = {
    HEAD: [0, cols],
    BODY: [cols, cols * 2]
  };

  const groups = {};
  for (const [name] of Object.entries(categories)) {
    const wrap = document.createElement('div');
    wrap.className = 'sprite-category';
    const title = document.createElement('h4');
    title.textContent = name;
    const grid = document.createElement('div');
    grid.className = 'sprite-grid';
    wrap.appendChild(title);
    wrap.appendChild(grid);
    panel.appendChild(wrap);
    groups[name] = grid;
  }

  for (let i = 0; i < totalTiles; i++) {
    const frame = [i % cols, Math.floor(i / cols)];
    const sx = frame[0] * tileSize;
    const sy = frame[1] * tileSize;

    const c = document.createElement('canvas');
    c.width = tileSize;
    c.height = tileSize;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, tileSize, tileSize, 0, 0, tileSize, tileSize);
    const url = c.toDataURL();

    const cat = i < categories.HEAD[1] ? 'HEAD' : 'BODY';
    const spriteItem = createPaletteSprite(url);
    groups[cat].appendChild(spriteItem);
  }
}

function insertSprite(src, x, y) {
  const img = new Image();
  img.onload = () => {
    addCanvasSprite(img, x, y);
  };
  img.onerror = () => {
    console.error('Failed to load sprite image:', src);
  };
  img.src = src;
}

export function enableDrop(canvas) {
  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    if (!isDraggingFromPalette) return;
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const pos = screenToWorld(e.offsetX, e.offsetY);
    insertSprite(data.src, pos.x, pos.y);
    isDraggingFromPalette = false;
  });
}
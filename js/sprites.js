import { addCanvasSprite, screenToWorld } from '../studio/studio.js';

let isDraggingFromPalette = false;
let lastClickTime = 0;
const CLICK_DEBOUNCE = 200; // ms

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
    ctx.drawImage(img, sx, sy, tileSize, tileSize, 0, 0, tileSize, tileSize);
    const url = c.toDataURL();

    const cat = i < categories.HEAD[1] ? 'HEAD' : 'BODY';
    const el = document.createElement('img');
    el.src = url;
    el.draggable = true;
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.imageRendering = 'pixelated';

    // On drag start, mark we're dragging from the sprite palette
    el.addEventListener('dragstart', ev => {
      isDraggingFromPalette = true;
      ev.dataTransfer.setData('text/plain', JSON.stringify({ src: url, cat, frame }));
    });

    // On drop end, reset drag flag
    el.addEventListener('dragend', () => {
      setTimeout(() => {
        isDraggingFromPalette = false;
      }, 10);
    });

    // On click, add sprite to current frame only
    el.addEventListener('click', () => {
      if (isDraggingFromPalette) return;
      
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE) return;
      lastClickTime = now;
      
      insertSprite(url, 0, 0);
    });

    groups[cat].appendChild(el);
  }
}

function insertSprite(src, x, y) {
  const img = new Image();
  img.onload = () => {
    // Ensure image is fully loaded before adding to frame
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
    
    // Change: This will now add sprite to current frame only
    insertSprite(data.src, pos.x, pos.y);

    isDraggingFromPalette = false;
  });
}
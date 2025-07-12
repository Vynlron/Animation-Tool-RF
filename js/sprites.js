import { addFrame, addCanvasSprite, screenToWorld } from '../studio/studio.js';

export async function initSprites() {
  const img = new Image();
  img.src = 'assets/realmforge_player-Template.png';
  await img.decode();

  const tileSize = 20;
  const cols = img.width / tileSize;
  const totalTiles = (img.width / tileSize) * (img.height / tileSize);

  const panel = document.getElementById('sprite-selector-panel');
  panel.innerHTML = '';

  let isDraggingSprite = false;
  let ignoreNextClick = false;

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
    el.addEventListener('dragstart', ev => {
      isDraggingSprite = true;
      ignoreNextClick = true;
      ev.dataTransfer.setData('text/plain', JSON.stringify({ src: url, cat, frame }));
    });
    el.addEventListener('dragend', () => {
      isDraggingSprite = false;
    });
    el.addEventListener('click', () => {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
      }
      insertSprite(url, cat, 0, 0);
      addFrame(frame);
      if (window.renderTimeline) window.renderTimeline();
    });
    groups[cat].appendChild(el);
  }
}

function insertSprite(src, layer, x, y) {
  const img = new Image();
  img.src = src;
  img.onload = () => addCanvasSprite(img, x, y);
}

export function enableDrop(canvas) {
  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const pos = screenToWorld(e.offsetX, e.offsetY);
    insertSprite(data.src, data.cat, pos.x, pos.y);
    if (data.frame) {
      addFrame(data.frame);
      if (window.renderTimeline) window.renderTimeline();
    }
  });
}
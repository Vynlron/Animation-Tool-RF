import { addFrame } from '../studio/studio.js';

export async function initSprites() {
  const img = new Image();
  img.src = 'assets/realmforge_player-Template.png';
  await img.decode();

  const tileSize = 20;
  const cols = img.width / tileSize;
  const totalTiles = (img.width / tileSize) * (img.height / tileSize);

  const panel = document.getElementById('sprite-panel');
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
    el.addEventListener('dragstart', ev => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({ src: url, cat, frame }));
    });
    el.addEventListener('click', () => {
      insertSprite(url, cat, 0, 0);
      addFrame(frame);
      if (window.renderTimeline) window.renderTimeline();
    });
    groups[cat].appendChild(el);
  }
}

function insertSprite(src, layer, x, y) {
  const layerEl = document.getElementById(`layer-${layer}`);
  if (!layerEl) return;
  const img = document.createElement('img');
  img.src = src;
  img.classList.add('canvas-sprite');
  img.style.left = x + 'px';
  img.style.top = y + 'px';
  makeDraggable(img);
  layerEl.appendChild(img);
}

function makeDraggable(el) {
  let drag = null;
  el.addEventListener('mousedown', (e) => {
    drag = { x: e.clientX, y: e.clientY, left: parseInt(el.style.left, 10) || 0, top: parseInt(el.style.top, 10) || 0 };
    e.stopPropagation();
  });
  document.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    el.style.left = drag.left + dx + 'px';
    el.style.top = drag.top + dy + 'px';
  });
  document.addEventListener('mouseup', () => { drag = null; });
}

export function enableDrop(wrapper) {
  wrapper.addEventListener('dragover', e => e.preventDefault());
  wrapper.addEventListener('drop', e => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    insertSprite(data.src, data.cat, e.offsetX, e.offsetY);
    if (data.frame) {
      addFrame(data.frame);
      if (window.renderTimeline) window.renderTimeline();
    }
  });
}
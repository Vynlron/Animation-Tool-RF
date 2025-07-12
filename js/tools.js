import { pan, addCanvasSprite } from '../studio/studio.js';

let isGridVisible = true;
let isPlaying = true;
let activeTool = '';
let isPanning = false;
let panStart = { x: 0, y: 0 };

export function initTools(canvas) {
  function setActiveTool(id) {
    activeTool = id;
    document.querySelectorAll('.studio-sidebar button').forEach(btn => {
      btn.classList.toggle('active', btn.id === id);
    });
  }

  setActiveTool('tool-pan');

  document.getElementById('tool-toggle-grid').addEventListener('click', () => {
    isGridVisible = !isGridVisible;
  });

  const playBtn = document.getElementById('tool-toggle-play');
  playBtn.textContent = isPlaying ? '⏸️' : '▶️';
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
  });

  document.getElementById('tool-add-sprite').addEventListener('click', () => {
    setActiveTool('tool-add-sprite');
    document.getElementById('sprite-loader').click();
  });

  document.getElementById('sprite-loader').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => addCanvasSprite(img, 0, 0);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('tool-pan').addEventListener('click', () => {
    setActiveTool('tool-pan');
  });

  canvas.addEventListener('mousedown', (e) => {
    if (activeTool === 'tool-pan' && e.button === 0) {
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY };
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      panStart = { x: e.clientX, y: e.clientY };
      pan(dx, dy);
    }
  });

  document.addEventListener('mouseup', () => {
    isPanning = false;
  });

  canvas.addEventListener('dragover', (e) => e.preventDefault());
}

export function isPlaybackEnabled() {
  return isPlaying;
}

export function isGridEnabled() {
  return isGridVisible;
}

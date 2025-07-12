import { pan } from '../studio/studio.js';

let isGridVisible = true;
let isPlaying = true;
let activeTool = '';
let isPanning = false;
let panStart = { x: 0, y: 0 };
let spriteCounter = 0;
const sprites = [];

export function initTools(canvasWrapper) {
  function setActiveTool(id) {
    activeTool = id;
    document.querySelectorAll('.studio-sidebar button').forEach(btn => {
      btn.classList.toggle('active', btn.id === id);
    });
  }

  setActiveTool('tool-pan');

  document.getElementById('tool-toggle-grid').addEventListener('click', () => {
    isGridVisible = !isGridVisible;
    canvasWrapper.style.setProperty('--grid-opacity', isGridVisible ? '0.3' : '0');
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
      img.onload = () => {
        const el = document.createElement('img');
        const id = 'sp' + (++spriteCounter);
        sprites.push({ id, src: img.src, name: file.name });
        el.src = img.src;
        el.dataset.id = id;
        el.classList.add('canvas-sprite');
        el.style.left = '0px';
        el.style.top = '0px';
        makeDraggable(el);
        const layerEl = document.getElementById('layer-HEAD');
        if (layerEl) layerEl.appendChild(el);
      };
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('tool-pan').addEventListener('click', () => {
    setActiveTool('tool-pan');
  });

  canvasWrapper.addEventListener('mousedown', (e) => {
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

  canvasWrapper.addEventListener('dragover', (e) => e.preventDefault());

  function makeDraggable(el) {
    let drag = null;
    let zoom = parseFloat(canvasWrapper.style.getPropertyValue('--zoom') || '1');
    el.addEventListener('mousedown', (e) => {
      if (activeTool === 'tool-pan') return;
      zoom = parseFloat(canvasWrapper.style.getPropertyValue('--zoom') || '1');
      drag = {
        x: e.clientX,
        y: e.clientY,
        left: parseFloat(el.style.left || '0'),
        top: parseFloat(el.style.top || '0')
      };
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = (e.clientX - drag.x) / zoom;
      const dy = (e.clientY - drag.y) / zoom;
      el.style.left = `${drag.left + dx}px`;
      el.style.top = `${drag.top + dy}px`;
    });

    document.addEventListener('mouseup', () => {
      drag = null;
    });
  }
}

export function isPlaybackEnabled() {
  return isPlaying;
}

export function isGridEnabled() {
  return isGridVisible;
}

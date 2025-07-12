import { setFrameIndex } from '../studio/studio.js';

const layers = ['HEAD', 'BODY'];
const framesCount = 20;
const activeFrame = {};
let playbackLine; let scrollEl;

export function initLayerTimeline() {
  const container = document.getElementById('layer-timeline');
  if (!container) return;
  scrollEl = container.querySelector('.timeline-scroll');
  playbackLine = container.querySelector('.playback-line');

  layers.forEach(layer => {
    const row = container.querySelector(`.layer-row[data-layer="${layer}"]`);
    activeFrame[layer] = 0;
    for (let i = 0; i < framesCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'frame-cell';
      cell.textContent = i + 1;
      const bar = document.createElement('div');
      bar.className = 'bar';
      cell.appendChild(bar);
      cell.addEventListener('click', () => selectFrame(layer, i));
      row.appendChild(cell);
    }
  });

  document.getElementById('btn-duplicate').onclick = () => {
    console.log('Duplicate frame');
  };
  document.getElementById('btn-insert-center').onclick = () => {
    console.log('Insert in center');
  };
  document.getElementById('btn-tween').onclick = () => {
    console.log('Tween');
  };

  updateUI();
}

function selectFrame(layer, index) {
  activeFrame[layer] = index;
  setFrameIndex(index);
  updateUI();
}

function updateUI() {
  layers.forEach(layer => {
    const row = scrollEl.querySelector(`.layer-row[data-layer="${layer}"]`);
    row.querySelectorAll('.frame-cell').forEach((cell, i) => {
      cell.classList.toggle('active', i === activeFrame[layer]);
    });
  });
  const firstRow = scrollEl.querySelector(`.layer-row[data-layer="${layers[0]}"]`);
  if (firstRow) {
    const cell = firstRow.children[activeFrame[layers[0]]];
    if (cell) playbackLine.style.left = cell.offsetLeft + 'px';
  }
}

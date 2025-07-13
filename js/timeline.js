import { getFrames, setFrameIndex, removeFrame, moveFrame, createFramePreview, addFrame } from '../studio/studio.js';

let selectedFrame = 0;

export function renderTimeline() {
  const container = document.querySelector('.frame-grid');  
  if (!container) return;
  container.innerHTML = '';

  const frames = getFrames();
  frames.forEach((frame, index) => {
    const item = document.createElement('div');
    item.className = 'frame-item';
    if (index === selectedFrame) item.classList.add('selected');

    item.onclick = () => {
      selectedFrame = index;
      setFrameIndex(index);
      renderTimeline();
    };

    const preview = createFramePreview(index, 1);
    if (preview) {
      preview.style.maxWidth = '100%';
      preview.style.maxHeight = '100%';
      item.appendChild(preview);
    }

    const del = document.createElement('button');
    del.innerText = '✖';
    del.onclick = (e) => {
      e.stopPropagation();
      removeFrame(index);
      if (selectedFrame >= frames.length - 1) selectedFrame = Math.max(0, frames.length - 2);
      renderTimeline();
    };
    item.appendChild(del);

    container.appendChild(item);
  });
}

export function initTimeline() {
  document.getElementById('add-frame')?.addEventListener('click', () => {
    addFrame();
    renderTimeline();
  });

  document.getElementById('remove-frame')?.addEventListener('click', () => {
    removeFrame(selectedFrame);
    selectedFrame = Math.max(0, selectedFrame - 1);
    renderTimeline();
  });

  document.getElementById('copy-frame')?.addEventListener('click', () => {
    const frames = getFrames();
    if (frames[selectedFrame]) {
      localStorage.setItem('copied-frame', JSON.stringify(frames[selectedFrame]));
    }
  });

  document.getElementById('paste-frame')?.addEventListener('click', () => {
    const data = localStorage.getItem('copied-frame');
    if (!data) return;
    const frame = JSON.parse(data);
    addFrame(frame);
    renderTimeline();
  });

  document.getElementById('copy-assets')?.addEventListener('click', () => {
    const sprites = getFrameSprites(selectedFrame);
    const copyData = sprites.map(s => ({ src: s.img.src, x: s.x, y: s.y }));
    localStorage.setItem('copied-assets', JSON.stringify(copyData));
  });

  document.getElementById('paste-assets')?.addEventListener('click', () => {
    const raw = localStorage.getItem('copied-assets');
    if (!raw) return;
    const assets = JSON.parse(raw);
    assets.forEach(({ src, x, y }) => {
      const img = new Image();
      img.src = src;
      img.onload = () => addCanvasSprite(img, x, y);
    });
  });

  renderTimeline();
}

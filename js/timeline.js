import {
  getFrames,
  setFrameIndex,
  removeFrame,
  moveFrame,
  createFramePreview,
  addFrame,
  copySpritesToFrame
} from '../studio/studio.js';

let selectedFrame = 0;
let copiedFrame = null;
let copiedAssetsFrom = null;

export function renderTimeline() {
  const container = document.getElementById('frame-list');
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

    const num = document.createElement('div');
    num.className = 'frame-number';
    num.textContent = index;
    item.appendChild(num);

    container.appendChild(item);
  });
}

export function initTimeline() {
  const playToggle = document.getElementById('tool-toggle-play');

  document.getElementById('play-btn')?.addEventListener('click', () => {
    playToggle?.click();
  });

  document.getElementById('stop-btn')?.addEventListener('click', () => {
    if (window.isPlaybackEnabled && window.isPlaybackEnabled()) {
      playToggle?.click();
    }
  });

  document.getElementById('copy-btn')?.addEventListener('click', () => {
    const frames = getFrames();
    copiedFrame = frames[selectedFrame]?.slice();
  });

  document.getElementById('cut-btn')?.addEventListener('click', () => {
    const frames = getFrames();
    copiedFrame = frames[selectedFrame]?.slice();
    removeFrame(selectedFrame);
    selectedFrame = Math.max(0, selectedFrame - 1);
    renderTimeline();
  });

  document.getElementById('paste-btn')?.addEventListener('click', () => {
    if (!copiedFrame) return;
    addFrame(copiedFrame.slice());
    const frames = getFrames();
    moveFrame(frames.length - 1, selectedFrame + 1);
    selectedFrame++;
    renderTimeline();
  });

  document.getElementById('duration-plus')?.addEventListener('click', () => {
    const input = document.getElementById('duration-input');
    input.value = parseInt(input.value, 10) + 1;
  });

  document.getElementById('duration-minus')?.addEventListener('click', () => {
    const input = document.getElementById('duration-input');
    input.value = Math.max(0, parseInt(input.value, 10) - 1);
  });

  document.getElementById('play-frame-btn')?.addEventListener('click', () => {
    setFrameIndex(selectedFrame);
  });

  document.getElementById('copy-frame-btn')?.addEventListener('click', () => {
    const frames = getFrames();
    copiedFrame = frames[selectedFrame]?.slice();
  });

  document.getElementById('paste-frame-btn')?.addEventListener('click', () => {
    if (!copiedFrame) return;
    addFrame(copiedFrame.slice());
    const frames = getFrames();
    moveFrame(frames.length - 1, selectedFrame + 1);
    renderTimeline();
  });

  document.getElementById('copy-assets-btn')?.addEventListener('click', () => {
    copiedAssetsFrom = selectedFrame;
  });

  document.getElementById('paste-assets-btn')?.addEventListener('click', () => {
    if (copiedAssetsFrom !== null) {
      copySpritesToFrame(copiedAssetsFrom, selectedFrame);
    }
  });

  document.getElementById('frame-list')?.addEventListener('wheel', (e) => {
    const container = e.currentTarget;
    container.scrollLeft += e.deltaY;
  });

  renderTimeline();
}

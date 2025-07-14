import {
  getFrames,
  setFrameIndex,
  removeFrame,
  moveFrame,
  createFramePreview,
  addFrame,
  getFrameSprites,
  setFrameDuration,
  getFrameDuration
} from '../studio/studio.js';

let selectedFrame = 0;
let isTimelineInitialized = false;

export function renderTimeline() {
  const container = document.querySelector('.frame-grid');
  if (!container) return;
  container.innerHTML = '';

  const frames = getFrames();
  frames.forEach((frame, index) => {
    const item = document.createElement('div');
    item.className = 'frame-item';
    if (index === selectedFrame) item.classList.add('selected');

    item.draggable = true;
    item.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', index);
    };
    item.ondragover = (e) => {
      e.preventDefault();
      item.style.borderColor = '#00aaff';
    };
    item.ondragleave = () => {
      item.style.borderColor = '';
    };
    item.ondrop = (e) => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = index;
      if (from !== to) {
        moveFrame(from, to);
        selectedFrame = to;
        setFrameIndex(to);
        updateDurationInput();
        renderTimeline();
      }
    };

    item.onclick = () => {
      selectedFrame = index;
      setFrameIndex(index);
      updateDurationInput();
      renderTimeline();
    };

    const preview = createFramePreview(index, 1);
    if (preview) {
      preview.style.width = '60px';
      preview.style.height = '60px';
      item.appendChild(preview);
    }

    container.appendChild(item);
  });
}

function updateDurationInput() {
  const input = document.getElementById('frame-duration');
  if (input) {
    input.value = getFrameDuration(selectedFrame);
  }
}

export function initTimeline() {
  // Only initialize the listeners once
  if (isTimelineInitialized) return;

  document.getElementById('add-frame')?.addEventListener('click', () => {
    addFrame();
    renderTimeline();
  });

  document.getElementById('remove-frame')?.addEventListener('click', () => {
    if (getFrames().length <= 1) return;
    removeFrame(selectedFrame);
    selectedFrame = Math.max(0, selectedFrame - 1);
    setFrameIndex(selectedFrame);
    updateDurationInput();
    renderTimeline();
  });

  document.getElementById('copy-frame')?.addEventListener('click', () => {
    const frames = getFrames();
    const baseFrame = frames[selectedFrame];
    if (!baseFrame) return;

    const sprites = getFrameSprites(selectedFrame);
    const serializedSprites = sprites.map(s => ({ src: s.img.src, x: s.x, y: s.y }));

    const dataToCopy = {
      frame: baseFrame,
      sprites: serializedSprites
    };

    localStorage.setItem('copied-frame', JSON.stringify(dataToCopy));
  });

  document.getElementById('paste-frame')?.addEventListener('click', () => {
    const data = localStorage.getItem('copied-frame');
    if (!data) return;
    const { frame, sprites } = JSON.parse(data);
    addFrame(frame, sprites);
    renderTimeline();
  });

  const durationInput = document.getElementById('frame-duration');
  if (durationInput) {
    durationInput.addEventListener('input', () => {
      const value = parseInt(durationInput.value);
      if (!isNaN(value)) {
        setFrameDuration(selectedFrame, value);
      }
    });
  }
  
  isTimelineInitialized = true;
}
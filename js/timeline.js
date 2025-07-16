import {
  getFrames,
  setFrameIndex,
  removeFrame,
  moveFrame,
  createFramePreview,
  addFrame,
  setFrameDuration,
  getFrameDuration,
  // --- Import functions needed for copy/paste ---
  getCurrentFrameIndex,
  getFrameSprites,
  pasteFrameData
} from '../studio/studio.js';

let selectedFrame = 0;
let isTimelineInitialized = false;

// --- Data storage for copy/paste now lives in this file ---
let copiedFrameData = null;

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
      item.style.borderColor = '';
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
  if (isTimelineInitialized) return;

  document.getElementById('add-frame')?.addEventListener('click', () => {
    addFrame();
    selectedFrame = getFrames().length - 1;
    setFrameIndex(selectedFrame);
    updateDurationInput();
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
    const index = getCurrentFrameIndex();
    const sprites = getFrameSprites(index);
    copiedFrameData = { sprites: sprites };
    
    const copyBtn = document.getElementById('copy-frame');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy Frame'; }, 1000);
  });

  // --- THIS IS THE UPDATED PASTE LOGIC ---
  document.getElementById('paste-frame')?.addEventListener('click', () => {
    if (!copiedFrameData) {
      alert("Nothing to paste. Please copy a frame first.");
      return;
    }

    // Get a deep copy of the sprites to paste.
    const spritesToPaste = structuredClone(copiedFrameData.sprites);
    
    // Call addFrame(), passing the copied sprites to populate the new frame.
    addFrame(null, spritesToPaste);

    // Automatically select the new frame that was just created.
    selectedFrame = getFrames().length - 1;
    setFrameIndex(selectedFrame);
    updateDurationInput();
    renderTimeline(); 
  });
  // --- END OF UPDATED LOGIC ---

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
import { getFrames, setFrameIndex, removeFrame, moveFrame, createFramePreview, addFrame } from '../studio/studio.js';

let selectedFrame = 0;

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
  document.getElementById('tool-add-frame')?.addEventListener('click', () => {
    addFrame(); // Empty frame
    renderTimeline();
  });

  document.getElementById('frame-delete-btn')?.addEventListener('click', () => {
    removeFrame(selectedFrame);
    selectedFrame = Math.max(0, selectedFrame - 1);
    renderTimeline();
  });

  document.getElementById('frame-left-btn')?.addEventListener('click', () => {
    if (selectedFrame > 0) {
      moveFrame(selectedFrame, selectedFrame - 1);
      selectedFrame--;
      renderTimeline();
    }
  });

  document.getElementById('frame-right-btn')?.addEventListener('click', () => {
    const frames = getFrames();
    if (selectedFrame < frames.length - 1) {
      moveFrame(selectedFrame, selectedFrame + 1);
      selectedFrame++;
      renderTimeline();
    }
  });

  renderTimeline();
}

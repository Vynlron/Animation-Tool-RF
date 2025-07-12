import { getFrames, setFrameIndex, removeFrame, moveFrame, createFramePreview, addFrame } from '../studio/studio.js';

export function renderTimeline() {
  const container = document.getElementById('timeline-frames');
  if (!container) return;
  container.innerHTML = '';

  const frames = getFrames();
  frames.forEach((frame, index) => {
    const item = document.createElement('div');
    item.className = 'timeline-frame';

    const preview = createFramePreview(index, 2);
    if (preview) {
      preview.classList.add('preview');
      item.appendChild(preview);
    }

    const indexLabel = document.createElement('div');
    indexLabel.className = 'frame-index';
    indexLabel.textContent = index;
    item.appendChild(indexLabel);

    // Toolbar
    const controls = document.createElement('div');
    controls.className = 'frame-controls';

    const selectBtn = document.createElement('button');
    selectBtn.textContent = '🎯';
    selectBtn.title = 'Select Frame';
    selectBtn.onclick = () => setFrameIndex(index);
    controls.appendChild(selectBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✖';
    deleteBtn.title = 'Delete Frame';
    deleteBtn.onclick = () => {
      removeFrame(index);
      renderTimeline();
    };
    controls.appendChild(deleteBtn);

    const duplicateBtn = document.createElement('button');
    duplicateBtn.textContent = '⧉';
    duplicateBtn.title = 'Duplicate Frame';
    duplicateBtn.onclick = () => {
      addFrame(frame);
      renderTimeline();
    };
    controls.appendChild(duplicateBtn);

    const moveLeftBtn = document.createElement('button');
    moveLeftBtn.textContent = '←';
    moveLeftBtn.title = 'Move Left';
    moveLeftBtn.onclick = () => {
      if (index > 0) {
        moveFrame(index, index - 1);
        renderTimeline();
      }
    };
    controls.appendChild(moveLeftBtn);

    const moveRightBtn = document.createElement('button');
    moveRightBtn.textContent = '→';
    moveRightBtn.title = 'Move Right';
    moveRightBtn.onclick = () => {
      if (index < frames.length - 1) {
        moveFrame(index, index + 1);
        renderTimeline();
      }
    };
    controls.appendChild(moveRightBtn);

    item.appendChild(controls);
    container.appendChild(item);
  });
}

export function initTimeline() {
  const panel = document.getElementById('timeline-panel');
  if (!panel) return;

  // Ensure the timeline frame container exists
  let container = document.getElementById('timeline-frames');
  if (!container) {
    container = document.createElement('div');
    container.id = 'timeline-frames';
    panel.appendChild(container);
  }

  renderTimeline();
}

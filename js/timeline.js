import { addFrame, getFrames, setFrameIndex, removeFrame, moveFrame, createFramePreview } from '../studio/studio.js';

let selectedFrame = 0;
let frameList;
let moveLeftBtn;
let moveRightBtn;
let deleteFrameBtn;

export function initTimeline() {
  frameList = document.getElementById('frame-list');
  moveLeftBtn = document.getElementById('frame-left-btn');
  moveRightBtn = document.getElementById('frame-right-btn');
  deleteFrameBtn = document.getElementById('frame-delete-btn');

  moveLeftBtn.addEventListener('click', () => {
    if (selectedFrame > 0) {
      moveFrame(selectedFrame, selectedFrame - 1);
      selectedFrame--;
      renderTimeline();
    }
  });

  moveRightBtn.addEventListener('click', () => {
    if (selectedFrame < getFrames().length - 1) {
      moveFrame(selectedFrame, selectedFrame + 1);
      selectedFrame++;
      renderTimeline();
    }
  });

  deleteFrameBtn.addEventListener('click', () => {
    removeFrame(selectedFrame);
    if (selectedFrame >= getFrames().length) {
      selectedFrame = getFrames().length - 1;
    }
    renderTimeline();
  });

  renderTimeline();
}

export function renderTimeline() {
  frameList.innerHTML = '';
  const frames = getFrames();
  frames.forEach((_, idx) => {
    const item = document.createElement('div');
    item.className = 'frame-item';
    if (idx === selectedFrame) item.classList.add('selected');
    const thumb = createFramePreview(idx, 2);
    if (thumb) item.appendChild(thumb);
    const delBtn = document.createElement('button');
    delBtn.textContent = '✖';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFrame(idx);
      if (selectedFrame >= getFrames().length) {
        selectedFrame = getFrames().length - 1;
      }
      renderTimeline();
    });
    item.appendChild(delBtn);
    item.addEventListener('click', () => {
      selectedFrame = idx;
      setFrameIndex(idx);
      renderTimeline();
    });
    frameList.appendChild(item);
  });
}

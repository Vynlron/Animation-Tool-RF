import { initStudio } from '../studio/studio.js';
import { initTimeline, renderTimeline } from './timeline.js';
import { initMenu } from './menu.js';
import { initStudioControls, studioTitle, speedSlider } from './studioControls.js';
import { initTools, isPlaybackEnabled } from './tools.js';
import { initSprites, enableDrop } from './sprites.js';
import { loadAnimation, setSpeed } from '../studio/studio.js';
import { showModal } from '../ui/modal.js';

const canvas = document.getElementById('preview');
initStudio(canvas);

initStudioControls();
initTimeline();
const canvasWrapper = document.querySelector('.canvas-wrapper');
initTools(canvasWrapper);
enableDrop(canvasWrapper);
initSprites();
initMenu({
  mainMenu: document.getElementById('main-menu'),
  studio: document.getElementById('studio'),
  studioTitle,
  speedSlider,
  renderTimeline,
  loadAnimation,
  setSpeed,
  showModal
});

window.isPlaybackEnabled = isPlaybackEnabled;
window.renderTimeline = renderTimeline;

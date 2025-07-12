import { initStudio } from '../studio/studio.js';
import { initTimeline, renderTimeline } from './timeline.js'; // ✅ keep this one
import { initMenu } from './menu.js';
import { initStudioControls, studioTitle, speedSlider } from './studioControls.js';
import { initTools, isPlaybackEnabled, isGridEnabled } from './tools.js';
import { initSprites, enableDrop } from './sprites.js';
import { loadAnimation, setSpeed } from '../studio/studio.js';
import { showModal } from '../ui/modal.js'; // ✅ this is fine
import { initLayerTimeline } from './layerTimeline.js';

// ❌ REMOVE this line:
// import { renderTimeline } from './ui/timeline.js';

const canvas = document.getElementById('preview');
initStudio(canvas);

initStudioControls();
initTimeline();
initLayerTimeline();
initTools(canvas);
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

initSprites();
enableDrop(canvas);
renderTimeline();

window.isPlaybackEnabled = isPlaybackEnabled;
window.renderTimeline = renderTimeline;
window.isGridEnabled = isGridEnabled;

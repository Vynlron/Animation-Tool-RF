import { 
    pan, 
    addCanvasSprite, 
    screenToWorld, 
    getSpriteAtPoint, 
    removeSpriteFromCurrentFrame, 
    selectedSprite, 
    setSelectedSprite,
    moveSpriteLayer,
    undo,
    redo,
    saveState
} from '../studio/studio.js';
// Obsolete import removed: import { addSpriteToPanel } from './sprites.js';

let isGridVisible = true;
let isPlaying = false;
let isLooping = true;
let activeTool = '';
let isPanning = false;
let isDragging = false;
let panStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };

function updateSpriteOptionsPanel() {
  const panel = document.getElementById('sprite-options');
  const timeline = document.querySelector('.frame-panel');

  if (selectedSprite) {
    const timelineHeight = timeline.offsetHeight;
    panel.style.bottom = `${timelineHeight + 10}px`;
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
}

export function initTools(canvas) {
  function setActiveTool(id) {
    activeTool = id;
    document.querySelectorAll('.studio-sidebar button').forEach(btn => {
      btn.classList.toggle('active', btn.id === id);
    });
  }

  setActiveTool('tool-pan');

  document.getElementById('tool-toggle-grid').addEventListener('click', () => {
    isGridVisible = !isGridVisible;
  });

  document.getElementById('play-btn').addEventListener('click', () => {
    isPlaying = true;
  });

  document.getElementById('pause-btn').addEventListener('click', () => {
    isPlaying = false;
  });

  const loopToggle = document.getElementById('loop-toggle');
  loopToggle.checked = isLooping;
  loopToggle.addEventListener('change', () => {
    isLooping = loopToggle.checked;
  });

  // --- OBSOLETE CODE REMOVED ---
  // The event listeners for 'tool-add-sprite', 'add-sprite-right-btn',
  // and 'sprite-loader' have been removed as they are no longer needed.
  // The new "Load Spritesheet" input handles this functionality now.
  // --- END REMOVAL ---

  document.getElementById('tool-pan').addEventListener('click', () => {
    setActiveTool('tool-pan');
  });
  
  document.getElementById('flip-h').addEventListener('click', () => {
      if (selectedSprite) {
          selectedSprite.flipH = !selectedSprite.flipH;
          saveState();
      }
  });
  
  document.getElementById('flip-v').addEventListener('click', () => {
      if (selectedSprite) {
          selectedSprite.flipV = !selectedSprite.flipV;
          saveState();
      }
  });

  document.getElementById('layer-up').addEventListener('click', () => {
      if (selectedSprite) {
          moveSpriteLayer(selectedSprite, 1);
      }
  });

  document.getElementById('layer-down').addEventListener('click', () => {
      if (selectedSprite) {
          moveSpriteLayer(selectedSprite, -1);
      }
  });

  document.getElementById('delete-selected-sprite').addEventListener('click', () => {
      if (selectedSprite) {
          removeSpriteFromCurrentFrame(selectedSprite);
          setSelectedSprite(null);
          updateSpriteOptionsPanel();
      }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const pos = screenToWorld(e.offsetX, e.offsetY);
    const sprite = getSpriteAtPoint(pos.x, pos.y);

    if (sprite) {
      setSelectedSprite(sprite);
      isDragging = true;
      dragOffset = { x: pos.x - sprite.x, y: pos.y - sprite.y };
    } else {
      setSelectedSprite(null);
      if (activeTool === 'tool-pan') {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
      }
    }
    updateSpriteOptionsPanel();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging && selectedSprite) {
      const rect = canvas.getBoundingClientRect();
      const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      selectedSprite.x = pos.x - dragOffset.x;
      selectedSprite.y = pos.y - dragOffset.y;
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      panStart = { x: e.clientX, y: e.clientY };
      pan(dx, dy);
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (isDragging) {
        saveState();
    }
    isPanning = false;
    isDragging = false;
  });

  canvas.addEventListener('dragover', (e) => e.preventDefault());
  
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undo();
            return;
        }
        if (e.key === 'y') {
            e.preventDefault();
            redo();
            return;
        }
    }

    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    if (selectedSprite) {
      let moved = false;
      const increment = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowUp':   selectedSprite.y -= increment; moved = true; break;
        case 'ArrowDown': selectedSprite.y += increment; moved = true; break;
        case 'ArrowLeft': selectedSprite.x -= increment; moved = true; break;
        case 'ArrowRight':selectedSprite.x += increment; moved = true; break;
      }
      if (moved) {
        e.preventDefault();
      }
    }
  });
  
  window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedSprite) {
          saveState();
      }
  });

  updateSpriteOptionsPanel();

  window.addEventListener('resize', () => {
      if (selectedSprite) {
          updateSpriteOptionsPanel();
      }
  });
}

export function isPlaybackEnabled() {
  return isPlaying;
}

export function isLoopingEnabled() {
    return isLooping;
}

export function pausePlayback() {
    isPlaying = false;
}

export function isGridEnabled() {
  return isGridVisible;
}
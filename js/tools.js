import {
  pan,
  screenToWorld,
  getSpriteAtPoint,
  removeSpriteFromCurrentFrame,
  moveSpriteLayer,
  undo,
  redo,
  saveState,
  selectedSprites,
  clearSelection,
  addToSelection,
  getFrameSprites,
  getCurrentFrameIndex,
  marqueeRect,
  setMarqueeRect,
  clearMarqueeRect
} from '../studio/studio.js';

let isGridVisible = true;
let isPlaying = false;
let isLooping = true;

let isPanning = false;
let isMarqueeSelecting = false;
let isDraggingSprite = false;
let lastMousePos = { x: 0, y: 0 };
let marqueeStart = { x: 0, y: 0 };

function intersects(rect1, rect2) {
  return !(rect2.x > rect1.x + rect1.w ||
           rect2.x + rect1.w < rect1.x ||
           rect2.y > rect1.y + rect1.h ||
           rect2.y + rect1.h < rect1.y);
}

function updateSpriteOptionsPanel() {
  const panel = document.getElementById('sprite-options');
  if (!panel) return;
  const timeline = document.querySelector('.frame-panel');
  const timelineHeight = timeline ? timeline.offsetHeight : 0;
  if (selectedSprites.length > 0) {
    panel.style.bottom = `${timelineHeight + 10}px`;
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
}

export function initTools(canvas) {
  document.getElementById('tool-toggle-grid').addEventListener('click', () => { isGridVisible = !isGridVisible; });
  document.getElementById('play-btn').addEventListener('click', () => { isPlaying = true; });
  document.getElementById('pause-btn').addEventListener('click', () => { isPlaying = false; });
  const loopToggle = document.getElementById('loop-toggle');
  loopToggle.checked = isLooping;
  loopToggle.addEventListener('change', () => { isLooping = loopToggle.checked; });
  document.getElementById('flip-h').addEventListener('click', () => { selectedSprites.forEach(sprite => sprite.flipH = !sprite.flipH); if (selectedSprites.length > 0) saveState(); });
  document.getElementById('flip-v').addEventListener('click', () => { selectedSprites.forEach(sprite => sprite.flipV = !sprite.flipV); if (selectedSprites.length > 0) saveState(); });
  document.getElementById('layer-up').addEventListener('click', () => { selectedSprites.forEach(sprite => moveSpriteLayer(sprite, 1)); if (selectedSprites.length > 0) saveState(); });
  document.getElementById('layer-down').addEventListener('click', () => { [...selectedSprites].reverse().forEach(sprite => moveSpriteLayer(sprite, -1)); if (selectedSprites.length > 0) saveState(); });
  document.getElementById('delete-selected-sprite').addEventListener('click', () => {
    if (selectedSprites.length > 0) {
      selectedSprites.forEach(sprite => removeSpriteFromCurrentFrame(sprite));
      saveState();
    }
    clearSelection();
    updateSpriteOptionsPanel();
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', (e) => {
    const worldPos = screenToWorld(e.offsetX, e.offsetY);
    lastMousePos = { x: e.offsetX, y: e.offsetY };
    if (e.button === 2) {
      isPanning = true;
      canvas.style.cursor = 'grabbing';
    } else if (e.button === 0) {
      const spriteUnderCursor = getSpriteAtPoint(worldPos.x, worldPos.y);
      if (spriteUnderCursor) {
        isDraggingSprite = true;
        if (e.shiftKey) { addToSelection(spriteUnderCursor); }
        else if (!selectedSprites.includes(spriteUnderCursor)) { clearSelection(); addToSelection(spriteUnderCursor); }
      } else {
        isMarqueeSelecting = true;
        marqueeStart = worldPos;
        if (!e.shiftKey) clearSelection();
      }
    }
    updateSpriteOptionsPanel();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dx = e.offsetX - lastMousePos.x;
      const dy = e.offsetY - lastMousePos.y;
      pan(dx, dy);
    } else if (isDraggingSprite) {
      const worldPos = screenToWorld(e.offsetX, e.offsetY);
      const worldLastPos = screenToWorld(lastMousePos.x, lastMousePos.y);
      const dx = worldPos.x - worldLastPos.x;
      const dy = worldPos.y - worldLastPos.y;
      selectedSprites.forEach(sprite => { sprite.x += dx; sprite.y += dy; });
    } else if (isMarqueeSelecting) {
      const worldPos = screenToWorld(e.offsetX, e.offsetY);
      const x = Math.min(marqueeStart.x, worldPos.x);
      const y = Math.min(marqueeStart.y, worldPos.y);
      const w = Math.abs(marqueeStart.x - worldPos.x);
      const h = Math.abs(marqueeStart.y - worldPos.y);
      setMarqueeRect({ x, y, w, h });
    }
    lastMousePos = { x: e.offsetX, y: e.offsetY };
  });

  canvas.addEventListener('mouseup', () => {
    if (isMarqueeSelecting) {
      if (marqueeRect) {
        const allSpritesInFrame = getFrameSprites(getCurrentFrameIndex());
        allSpritesInFrame.forEach(sprite => {
          const spriteRect = { x: sprite.x, y: sprite.y, w: sprite.sourceRect.sWidth, h: sprite.sourceRect.sHeight };
          if (intersects(marqueeRect, spriteRect)) addToSelection(sprite);
        });
      }
      clearMarqueeRect();
    }
    if (isDraggingSprite) saveState();
    isPanning = false;
    isMarqueeSelecting = false;
    isDraggingSprite = false;
    canvas.style.cursor = 'grab';
    updateSpriteOptionsPanel();
  });

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if (e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      return;
    }
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (selectedSprites.length > 0) {
      let moved = false;
      const increment = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowUp':   selectedSprites.forEach(s => s.y -= increment); moved = true; break;
        case 'ArrowDown': selectedSprites.forEach(s => s.y += increment); moved = true; break;
        case 'ArrowLeft': selectedSprites.forEach(s => s.x -= increment); moved = true; break;
        case 'ArrowRight':selectedSprites.forEach(s => s.x += increment); moved = true; break;
      }
      if (moved) e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedSprites.length > 0) {
      saveState();
    }
  });
  updateSpriteOptionsPanel();
}
export function isPlaybackEnabled() { return isPlaying; }
export function isLoopingEnabled() { return isLooping; }
export function pausePlayback() { isPlaying = false; }
export function isGridEnabled() { return isGridVisible; }
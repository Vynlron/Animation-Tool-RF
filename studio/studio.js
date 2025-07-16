// studio/studio.js

import { RfAni } from '../engine/rfani.js';
import { isPlaybackEnabled, isLoopingEnabled, pausePlayback } from '../js/tools.js';
import { UndoRedoManager } from './UndoRedoManager.js';
import { loadAndDisplaySheets } from '../js/sprites.js';
import { defaultSheets } from '../js/main.js';

const historyManager = new UndoRedoManager();

let rfAni = null;
let ctx = null;
let lastTime = performance.now();
let zoomLevel = 2;
const minZoom = 0.5;
const maxZoom = 12;
let canvasRef = null;
export let selectedSprite = null;

// --- KEY CHANGE ---
// We now store a collection of named spritesheets, not just one.
// The key is the filename (e.g., 'heads.png'), and the value is the Image object.
let spritesheetSources = new Map();
// frameSprites will now store objects including the `sourceName`.
const frameSprites = new Map();
// --- END KEY CHANGE ---

const frameDurations = new Map();
let offsetX = 0;
let offsetY = 0;

// --- KEY CHANGE: New functions to manage multiple sources ---
export function addSpritesheet(name, image) {
    spritesheetSources.set(name, image);
}
// In studio/studio.js

export function clearSpritesheets() {    
    spritesheetSources.clear();
    // Also clear the animation frames, as they are now invalid.
    frameSprites.clear();
    if(rfAni) {
      rfAni.frames.forEach((_, i) => frameSprites.set(i, []));
    }
}
// --- END KEY CHANGE ---

export function saveState() {
    const currentState = getAnimationData();
    if (currentState) {
        historyManager.saveState(currentState);
    }
}

export async function loadState(stateData) {
    if (!stateData) return;
    const shouldSave = false;
    // Note: Loading a state won't load the images, it just restores the data.
    // The user will need to re-load the required spritesheets via the UI.
    loadAnimation(stateData, async () => {
        const main = await import('../js/main.js');
        main.updateUIForLoadedAnimation(stateData);
    }, shouldSave);
}


export function setSelectedSprite(sprite) {
  selectedSprite = sprite;
}

export function pan(dx, dy) {
  offsetX += dx / zoomLevel;
  offsetY += dy / zoomLevel;
}

export function initStudio(canvasElement) {
  canvasRef = canvasElement;
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
  ctx = canvasElement.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  lastTime = performance.now();
  window.addEventListener('resize', () => {
    canvasRef.width = window.innerWidth;
    canvasRef.height = window.innerHeight;
  });
  canvasElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + (delta < 0 ? 0.1 : -0.1)));
    zoomLevel = Math.round(zoomLevel * 10) / 10;
  });
  requestAnimationFrame(loop);
}

// ... (drawGrid and drawCrosshair functions remain the same) ...
function drawGrid(ctx, width, height, zoom) {
  const baseSize = 10;
  const gridSize = baseSize;
  const majorLineEvery = 5;
  const worldLeft = -width / 2 / zoom - offsetX;
  const worldRight = width / 2 / zoom - offsetX;
  const worldTop = -height / 2 / zoom - offsetY;
  const worldBottom = height / 2 / zoom - offsetY;

  const startX = Math.floor(worldLeft / gridSize) * gridSize;
  const endX = Math.ceil(worldRight / gridSize) * gridSize;
  const startY = Math.floor(worldTop / gridSize) * gridSize;
  const endY = Math.ceil(worldBottom / gridSize) * gridSize;

  ctx.save();
  ctx.lineWidth = 1 / zoom;
  let index = 0;
  for (let x = startX; x <= endX; x += gridSize, index++) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.strokeStyle = (index % majorLineEvery === 0) ? '#444' : '#2a2a2a';
    ctx.stroke();
  }

  index = 0;
  for (let y = startY; y <= endY; y += gridSize, index++) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.strokeStyle = (index % majorLineEvery === 0) ? '#444' : '#2a2a2a';
    ctx.stroke();
  }
  ctx.restore();
}

function drawCrosshair(ctx, width, height, zoom) {
  ctx.save();
  ctx.lineWidth = 1 / zoom;
  ctx.strokeStyle = '#aa0000';
  ctx.beginPath();
  ctx.moveTo(-10000, 0);
  ctx.lineTo(10000, 0);
  ctx.stroke();

  ctx.strokeStyle = '#0033cc';
  ctx.beginPath();
  ctx.moveTo(0, -10000);
  ctx.lineTo(0, 10000);
  ctx.stroke();
  ctx.restore();
}


function loop(time) {
  const dt = time - lastTime;
  lastTime = time;
  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
  ctx.imageSmoothingEnabled = false;
  const centerX = canvasRef.width / 2;
  const centerY = canvasRef.height / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(offsetX, offsetY);

  if (window.isGridEnabled ? window.isGridEnabled() : true) {
    drawGrid(ctx, canvasRef.width, canvasRef.height, zoomLevel);
  }
  drawCrosshair(ctx, canvasRef.width, canvasRef.height, zoomLevel);

  if (rfAni) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1 / zoomLevel;
      ctx.setLineDash([4 / zoomLevel, 2 / zoomLevel]);
      ctx.strokeRect(-rfAni.frameWidth / 2, -rfAni.frameHeight / 2, rfAni.frameWidth, rfAni.frameHeight);
      ctx.restore();
  }

  if (rfAni) {
    if (isPlaybackEnabled()) {
        const currentDuration = frameDurations.get(rfAni.index) ?? rfAni.speed;
        rfAni.timer += dt;
        if (rfAni.timer >= currentDuration) {
            rfAni.timer = 0;
            const isAtEnd = rfAni.index >= rfAni.frames.length - 1;
            if (isAtEnd) {
                if (isLoopingEnabled()) {
                    rfAni.index = 0;
                } else {
                    pausePlayback();
                }
            } else {
                rfAni.index++;
            }
        }
    }
    
    // --- KEY CHANGE: DRAWING LOGIC ---
    // We now draw all sprites by looking up their source image from the Map.
    const currentFrameSprites = frameSprites.get(rfAni.index) || [];
    for (const s of currentFrameSprites) {
        const sourceImage = spritesheetSources.get(s.sourceName);
        if (sourceImage) { // Only draw if the source image is loaded
            ctx.save();
            const { sWidth, sHeight } = s.sourceRect;
            const drawX = s.x + sWidth / 2;
            const drawY = s.y + sHeight / 2;
            ctx.translate(drawX, drawY);
            ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
            ctx.drawImage(sourceImage, s.sourceRect.sx, s.sourceRect.sy, sWidth, sHeight, -sWidth / 2, -sHeight / 2, sWidth, sHeight);
            ctx.restore();
        }
    }
    // Update selection highlight logic
    if (selectedSprite && currentFrameSprites.includes(selectedSprite)) {
        const sourceImage = spritesheetSources.get(selectedSprite.sourceName);
        if(sourceImage) {
            ctx.save();
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 2 / zoomLevel;
            const s = selectedSprite;
            const { sWidth, sHeight } = s.sourceRect;
            const centerX = s.x + sWidth / 2;
            const centerY = s.y + sHeight / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
            ctx.strokeRect(-sWidth / 2, -sHeight / 2, sWidth, sHeight);
            ctx.restore();
        }
    }
    // --- END KEY CHANGE ---
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

// --- KEY CHANGE: LOADING LOGIC ---

export async function loadAnimation(data, onReady, shouldSave = true) {
    spritesheetSources.clear();
    frameSprites.clear();
    frameDurations.clear();
    
    if (data.frameSprites) {
        for (const [frameIndex, sprites] of Object.entries(data.frameSprites)) {
            const loadedSprites = sprites.map(spriteData => {
                return { ...spriteData, flipH: spriteData.flipH || false, flipV: spriteData.flipV || false };
            });
            frameSprites.set(parseInt(frameIndex), loadedSprites.filter(s => s));
        }
    }

    if(data.frameDurations) {
        for (const [frameIndex, duration] of Object.entries(data.frameDurations)) {
            frameDurations.set(parseInt(frameIndex), duration);
        }
    }
    
    rfAni = new RfAni(new Image(), data.frameWidth, data.frameHeight, data.frames, data.speed, data.name || 'Unnamed', '');
    
    const requiredSources = data.sources || [];
    if (requiredSources.length > 0) {
        
        // --- NEW: Smart Loading Logic ---
        const sourcesToLoadFromURL = [];
        const sourcesToPromptFor = [];
        const defaultSheetMap = new Map(defaultSheets.map(def => [def.name, def]));

        for (const sourceName of requiredSources) {
            if (defaultSheetMap.has(sourceName)) {
                // This is a default asset, load it automatically from its URL.
                sourcesToLoadFromURL.push(defaultSheetMap.get(sourceName));
            } else {
                // This is a custom asset, ask the user to upload the file.
                sourcesToPromptFor.push(sourceName);
            }
        }
        
        // 1. Load the default assets automatically.
        if (sourcesToLoadFromURL.length > 0) {
            // The first load clears the palette (the default behavior).
            await loadAndDisplaySheets(sourcesToLoadFromURL);
        }

        // 2. Prompt the user for any custom assets.
        if (sourcesToPromptFor.length > 0) {
            const main = await import('../js/main.js');
            const sourceFileMap = await main.promptForMissingFiles(sourcesToPromptFor);

            if (sourceFileMap.size > 0) {
                const customSheetDefs = Array.from(sourceFileMap.entries()).map(([name, file]) => ({ name, file }));
                // The second load does NOT clear the palette, it appends to it.
                await loadAndDisplaySheets(customSheetDefs, false);
            }
        }
    }

    if (onReady) onReady();
    if (shouldSave) {
        historyManager.clear();
        saveState();
    }
}
// --- END KEY CHANGE ---

export function getFrames() {
  return rfAni ? rfAni.frames : [];
}

export function setFrameIndex(index) {
  if (rfAni) {
    rfAni.index = Math.max(0, Math.min(rfAni.frames.length - 1, index));
  }
}

// ... (removeFrame and moveFrame remain mostly the same, no core logic change) ...
export function removeFrame(index) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  if (index < 0 || index >= frames.length) return;
  
  frames.splice(index, 1);
  rfAni.setFrames(frames);
  frameSprites.delete(index);
  const newFrameSprites = new Map();
  for (const [frameIndex, sprites] of frameSprites.entries()) {
    if (frameIndex > index) {
      newFrameSprites.set(frameIndex - 1, sprites);
    } else {
      newFrameSprites.set(frameIndex, sprites);
    }
  }
  frameSprites.clear();
  for (const [frameIndex, sprites] of newFrameSprites.entries()) {
    frameSprites.set(frameIndex, sprites);
  }
  if (rfAni.index >= frames.length) rfAni.index = frames.length > 0 ? frames.length - 1 : 0;
  saveState();
}

export function moveFrame(oldIndex, newIndex) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  if (oldIndex < 0 || oldIndex >= frames.length || newIndex < 0 || newIndex >= frames.length) return;

  const [f] = frames.splice(oldIndex, 1);
  frames.splice(newIndex, 0, f);
  rfAni.setFrames(frames);
  rfAni.index = newIndex;
  const tempSpriteList = [];
  for (let i = 0; i < frames.length; i++) {
    tempSpriteList.push(frameSprites.get(i));
  }
  const [movedSprites] = tempSpriteList.splice(oldIndex, 1);
  tempSpriteList.splice(newIndex, 0, movedSprites);
  frameSprites.clear();
  tempSpriteList.forEach((sprites, i) => {
    if (sprites) {
      frameSprites.set(i, sprites);
    }
  });
  saveState();
}


// --- KEY CHANGE: FRAME PREVIEW ---
export function createFramePreview(index, scale = 2) {
    if (!rfAni) return null;
    const canvas = document.createElement('canvas');
    canvas.width = rfAni.frameWidth * scale;
    canvas.height = rfAni.frameHeight * scale;
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#111';
    c.fillRect(0, 0, canvas.width, canvas.height);

    const sprites = frameSprites.get(index) || [];
    c.save();
    c.translate(canvas.width / 2, canvas.height / 2);

    for (const s of sprites) {
        const sourceImage = spritesheetSources.get(s.sourceName);
        if (sourceImage) {
            c.save();
            const { sWidth, sHeight } = s.sourceRect;
            const centerX = s.x + sWidth / 2;
            const centerY = s.y + sHeight / 2;
            c.translate(centerX * scale, centerY * scale);
            c.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
            c.drawImage(sourceImage, s.sourceRect.sx, s.sourceRect.sy, sWidth, sHeight, (-sWidth / 2) * scale, (-sHeight / 2) * scale, sWidth * scale, sHeight * scale);
            c.restore();
        }
    }
    c.restore();
    return canvas;
}
// --- END KEY CHANGE ---

export function addFrame(frameData = null, initialSprites = null) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  frames.push([-1, -1]); // Add a "blank" base frame
  rfAni.setFrames(frames);
  const newFrameIndex = frames.length - 1;
  if (initialSprites && initialSprites.length > 0) {
    frameSprites.set(newFrameIndex, initialSprites);
  } else {
    if (!frameSprites.has(newFrameIndex)) {
      frameSprites.set(newFrameIndex, []);
    }
  }
  frameDurations.set(newFrameIndex, 100);
  saveState();
}

export function setSpeed(speed) {
  if (rfAni) rfAni.setSpeed(speed);
  saveState();
}

// --- KEY CHANGE: SAVING DATA ---
export function getAnimationData() {
  if (!rfAni) return null;
  const frameSpritesData = {};
  for (const [frameIndex, sprites] of frameSprites.entries()) {
    frameSpritesData[frameIndex] = sprites.map(sprite => ({
      sourceName: sprite.sourceName, // Save the name of the source image
      sourceRect: sprite.sourceRect,
      x: sprite.x,
      y: sprite.y,
      flipH: sprite.flipH,
      flipV: sprite.flipV
    }));
  }
  return {
    name: rfAni.name,
    // We no longer save a single image name, but a list of sources.
    sources: Array.from(spritesheetSources.keys()),
    frameWidth: rfAni.frameWidth,
    frameHeight: rfAni.frameHeight,
    frames: rfAni.frames.slice(),
    speed: rfAni.speed,
    frameSprites: frameSpritesData,
    frameDurations: Object.fromEntries(frameDurations)
  };
}
// --- END KEY CHANGE ---

// --- KEY CHANGE: ADDING A SPRITE ---
// It now accepts a sourceName to identify the spritesheet.
export function addCanvasSprite(sourceName, sourceRect, x = 0, y = 0) {
  if (!rfAni) return;
  const currentFrame = rfAni.index;
  if (!frameSprites.has(currentFrame)) {
    frameSprites.set(currentFrame, []);
  }
  frameSprites.get(currentFrame).push({ sourceName, sourceRect, x, y, flipH: false, flipV: false });
  saveState();
}
// --- END KEY CHANGE ---

export function screenToWorld(x, y) {
  const cx = canvasRef.width / 2;
  const cy = canvasRef.height / 2;
  return {
    x: (x - cx) / zoomLevel - offsetX,
    y: (y - cy) / zoomLevel - offsetY
  };
}

const hitCanvas = document.createElement('canvas');
const hitCtx = hitCanvas.getContext('2d');

// --- KEY CHANGE: PIXEL-PERFECT SELECTION ---
export function getSpriteAtPoint(x, y) {
    if (!rfAni) return null;
    const currentFrameSprites = frameSprites.get(rfAni.index) || [];
    for (let i = currentFrameSprites.length - 1; i >= 0; i--) {
        const s = currentFrameSprites[i];
        const sourceImage = spritesheetSources.get(s.sourceName);
        if (!sourceImage) continue; // Can't select a sprite whose source isn't loaded

        const { sWidth, sHeight } = s.sourceRect;
        if (x >= s.x && x <= s.x + sWidth && y >= s.y && y <= s.y + sHeight) {
            hitCanvas.width = sWidth;
            hitCanvas.height = sHeight;
            hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);
            hitCtx.save();
            if(s.flipH || s.flipV) {
                hitCtx.translate(sWidth / 2, sHeight / 2);
                hitCtx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
                hitCtx.drawImage(sourceImage, s.sourceRect.sx, s.sourceRect.sy, sWidth, sHeight, -sWidth / 2, -sHeight / 2, sWidth, sHeight);
            } else {
                hitCtx.drawImage(sourceImage, s.sourceRect.sx, s.sourceRect.sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            }
            hitCtx.restore();
            const localX = Math.floor(x - s.x);
            const localY = Math.floor(y - s.y);
            const pixelData = hitCtx.getImageData(localX, localY, 1, 1).data;
            if (pixelData[3] > 0) {
                return s;
            }
        }
    }
    return null;
}
// --- END KEY CHANGE ---


export function removeSpriteFromCurrentFrame(sprite) {
  if (!rfAni) return;
  const currentFrame = rfAni.index;
  const sprites = frameSprites.get(currentFrame) || [];
  const index = sprites.indexOf(sprite);
  if (index > -1) {
    sprites.splice(index, 1);
    saveState();
  }
}

export function getFrameSprites(frameIndex) {
    const sprites = frameSprites.get(frameIndex) || [];
    // Deep copy sprites to prevent mutation issues with copy/paste
    return sprites.map(s => ({
        ...s,
        sourceRect: { ...s.sourceRect }
    }));
}

export function setRfAni(instance) {
  rfAni = instance;
  if (rfAni && rfAni.frames.length === 0) {
    rfAni.setFrames([[-1, -1]]);
  }
  if (!frameSprites.has(0)) {
    frameSprites.set(0, []);
  }
}

// ... (Other functions like setFrameDuration, setFrameWidth, etc., remain the same) ...
export function setFrameDuration(index, duration) {
  frameDurations.set(index, duration);
  saveState();
}

export function getFrameDuration(index) {
  return frameDurations.get(index) ?? 100;
}

export function setFrameWidth(width) {
  if (rfAni && width > 0) {
    rfAni.frameWidth = width;
    saveState();
  }
}

export function setFrameHeight(height) {
  if (rfAni && height > 0) {
    rfAni.frameHeight = height;
    saveState();
  }
}

export function moveSpriteLayer(sprite, direction) {
  if (!rfAni || !sprite) return;
  const currentFrame = rfAni.index;
  const sprites = frameSprites.get(currentFrame) || [];
  const index = sprites.indexOf(sprite);
  if (index === -1) return;
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < sprites.length) {
    sprites.splice(index, 1);
    sprites.splice(newIndex, 0, sprite);
    saveState();
  }
}

export function undo() {
    const prevState = historyManager.undo();
    if (prevState) loadState(prevState);
}

export function redo() {
    const nextState = historyManager.redo();
    if (nextState) loadState(nextState);
}

export function getCurrentFrameIndex() {
    return rfAni ? rfAni.index : 0;
}
export function pasteFrameData(index, copiedData) {
    if (!rfAni || !copiedData || !copiedData.sprites) return;

    // Replace the sprites of the target frame with a deep copy of the copied sprites.
    frameSprites.set(index, structuredClone(copiedData.sprites));
    saveState(); // Save the new state for undo/redo
}
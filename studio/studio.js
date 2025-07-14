import { RfAni } from '../engine/rfani.js';
import { isPlaybackEnabled, isLoopingEnabled, pausePlayback } from '../js/tools.js';
import { UndoRedoManager } from './UndoRedoManager.js';

const historyManager = new UndoRedoManager();

let rfAni = null;
let ctx = null;
let lastTime = performance.now();
let zoomLevel = 2;
const minZoom = 0.5;
const maxZoom = 12;
let canvasRef = null;
const frameSprites = new Map();
const frameDurations = new Map();
export let selectedSprite = null;

let offsetX = 0;
let offsetY = 0;

export function saveState() {
    const currentState = getAnimationData();
    if (currentState) {
        historyManager.saveState(currentState);
    }
}

export async function loadState(stateData) {
    if (!stateData) return;
    const shouldSave = false;
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
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
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
      const boxWidth = rfAni.frameWidth;
      const boxHeight = rfAni.frameHeight;
      ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
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
    rfAni.draw(ctx, 0, 0, 1);
    const currentFrameSprites = frameSprites.get(rfAni.index) || [];
    for (const s of currentFrameSprites) {
      if (s.img.complete && s.img.naturalWidth > 0) {
        ctx.save();
        const drawX = s.x + s.img.width / 2;
        const drawY = s.y + s.img.height / 2;
        ctx.translate(drawX, drawY);
        ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
        ctx.drawImage(s.img, -s.img.width / 2, -s.img.height / 2);
        ctx.restore();
      }
    }
    if (selectedSprite && currentFrameSprites.includes(selectedSprite)) {
        ctx.save();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2 / zoomLevel;
        const s = selectedSprite;
        const centerX = s.x + s.img.width / 2;
        const centerY = s.y + s.img.height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
        ctx.strokeRect(-s.img.width / 2, -s.img.height / 2, s.img.width, s.img.height);
        ctx.restore();
    }
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

export function loadAnimation(data, onReady, shouldSave = true) {
    frameSprites.clear();
    frameDurations.clear();
    const spritePromises = [];

    if (data.frameSprites) {
        for (const [frameIndex, sprites] of Object.entries(data.frameSprites)) {
            const framePromises = sprites.map(spriteData => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = spriteData.src;
                    img.onload = () => resolve({ ...spriteData, img, flipH: spriteData.flipH || false, flipV: spriteData.flipV || false });
                    img.onerror = () => resolve(null);
                });
            });
            const p = Promise.all(framePromises).then(loadedSprites => {
                frameSprites.set(parseInt(frameIndex), loadedSprites.filter(s => s));
            });
            spritePromises.push(p);
        }
    }

    if(data.frameDurations) {
        for (const [frameIndex, duration] of Object.entries(data.frameDurations)) {
            frameDurations.set(parseInt(frameIndex), duration);
        }
    }
    
    Promise.all(spritePromises).then(() => {
        const image = new Image();
        if (data.image) {
            image.src = 'assets/' + data.image;
        }
        image.onload = () => {
            rfAni = new RfAni(image, data.frameWidth, data.frameHeight, data.frames, data.speed, data.name || 'Unnamed', data.image);
            if (onReady) onReady();
            if (shouldSave) {
                historyManager.clear();
                saveState();
            }
        };
        if (!data.image) {
            image.onload();
        }
    });
}

export function getFrames() {
  return rfAni ? rfAni.frames : [];
}


export function setFrameIndex(index) {
  if (rfAni) {
    const max = rfAni.frames.length - 1;
    rfAni.index = Math.max(0, Math.min(index, max));
  }
}

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

export function createFramePreview(index, scale = 2) {
    if (!rfAni) return null;
    const frame = rfAni.frames[index];
    if (!frame) return null;

    const canvas = document.createElement('canvas');
    canvas.width = rfAni.frameWidth * scale;
    canvas.height = rfAni.frameHeight * scale;
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;

    if (rfAni.image && rfAni.image.complete && frame[0] >= 0 && frame[1] >= 0) {
        const sx = frame[0] * rfAni.frameWidth;
        const sy = frame[1] * rfAni.frameHeight;
        c.drawImage(rfAni.image, sx, sy, rfAni.frameWidth, rfAni.frameHeight, 0, 0, canvas.width, canvas.height);
    } else {
        c.fillStyle = '#111';
        c.fillRect(0, 0, canvas.width, canvas.height);
    }

    const sprites = frameSprites.get(index) || [];

    c.save();
    c.translate(canvas.width / 2, canvas.height / 2);

    for (const s of sprites) {
        if (s.img.complete && s.img.naturalWidth > 0) {
            c.save();
            const centerX = s.x + s.img.width / 2;
            const centerY = s.y + s.img.height / 2;
            c.translate(centerX * scale, centerY * scale);
            c.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
            c.drawImage(
                s.img,
                (-s.img.width / 2) * scale,
                (-s.img.height / 2) * scale,
                s.img.width * scale,
                s.img.height * scale
            );
            c.restore();
        }
    }
    c.restore();
    return canvas;
}

export function addFrame(frame = null, initialSprites = null) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  if (!frame || !Array.isArray(frame) || frame.length !== 2) {
    frames.push([-1, -1]);
  } else {
    frames.push(frame);
  }
  rfAni.setFrames(frames);
  const newFrameIndex = frames.length - 1;

  if (initialSprites && initialSprites.length > 0) {
    const spritePromises = initialSprites.map(spriteData => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = spriteData.src;
        img.onload = () => resolve({ img, x: spriteData.x, y: spriteData.y, flipH: spriteData.flipH || false, flipV: spriteData.flipV || false });
        img.onerror = () => resolve(null);
      });
    });
    Promise.all(spritePromises).then(loadedSprites => {
      frameSprites.set(newFrameIndex, loadedSprites.filter(s => s !== null));
      saveState();
    });
  } else {
    if (!frameSprites.has(newFrameIndex)) {
      frameSprites.set(newFrameIndex, []);
    }
    saveState();
  }
  frameDurations.set(newFrameIndex, 100);
}

export function setSpeed(speed) {
  if (rfAni) rfAni.setSpeed(speed);
  saveState();
}

export function getAnimationData() {
  if (!rfAni) return null;
  const frameSpritesData = {};
  for (const [frameIndex, sprites] of frameSprites.entries()) {
    frameSpritesData[frameIndex] = sprites.map(sprite => ({
      src: sprite.img.src,
      x: sprite.x,
      y: sprite.y,
      flipH: sprite.flipH,
      flipV: sprite.flipV
    }));
  }
  return {
    name: rfAni.name,
    image: rfAni.imageName,
    frameWidth: rfAni.frameWidth,
    frameHeight: rfAni.frameHeight,
    frames: rfAni.frames.slice(),
    speed: rfAni.speed,
    frameSprites: frameSpritesData,
    frameDurations: Object.fromEntries(frameDurations)
  };
}

export function addCanvasSprite(img, x = 0, y = 0) {
  if (!rfAni) return;
  if (!img.complete || img.naturalWidth === 0) return;
  const currentFrame = rfAni.index;
  if (!frameSprites.has(currentFrame)) {
    frameSprites.set(currentFrame, []);
  }
  frameSprites.get(currentFrame).push({ img, x, y, flipH: false, flipV: false });
  saveState();
}

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

export function getSpriteAtPoint(x, y) {
    if (!rfAni) return null;
    const currentFrameSprites = frameSprites.get(rfAni.index) || [];

    for (let i = currentFrameSprites.length - 1; i >= 0; i--) {
        const s = currentFrameSprites[i];
        
        // Broad phase check
        if (x >= s.x && x <= s.x + s.img.width && y >= s.y && y <= s.y + s.img.height) {
            
            // Narrow phase check (pixel perfect)
            hitCanvas.width = s.img.width;
            hitCanvas.height = s.img.height;
            
            hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);
            hitCtx.save();
            if(s.flipH || s.flipV) {
                hitCtx.translate(s.img.width / 2, s.img.height / 2);
                hitCtx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
                hitCtx.drawImage(s.img, -s.img.width / 2, -s.img.height / 2);
            } else {
                hitCtx.drawImage(s.img, 0, 0);
            }
            hitCtx.restore();

            // Calculate the position of the click relative to the sprite's image data
            let localX = Math.floor(x - s.x);
            let localY = Math.floor(y - s.y);

            // Get the pixel data from the temporary canvas
            const pixelData = hitCtx.getImageData(localX, localY, 1, 1).data;

            // Check the alpha channel (the 4th value)
            if (pixelData[3] > 0) {
                return s; // Clicked on a non-transparent pixel
            }
        }
    }
    return null;
}

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

export function copySpritesToFrame(fromFrame, toFrame) {
  if (!rfAni) return;
  const sourceSprites = frameSprites.get(fromFrame) || [];
  const copiedSprites = sourceSprites.map(sprite => ({ ...sprite }));
  frameSprites.set(toFrame, copiedSprites);
  saveState();
}

export function getFrameSprites(frameIndex) {
  return frameSprites.get(frameIndex) || [];
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
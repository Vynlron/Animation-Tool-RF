import { RfAni } from '../engine/rfani.js';

let rfAni = null;
let ctx = null;
let lastTime = performance.now();
let zoomLevel = 2;
const minZoom = 0.5;
const maxZoom = 6;
let canvasRef = null;
// Change: Store sprites per frame instead of globally
const frameSprites = new Map(); // frameIndex -> array of sprites
let layersEl = null;

let offsetX = 0;
let offsetY = 0;

function updateLayerTransform() {}

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
    if (window.isPlaybackEnabled ? window.isPlaybackEnabled() : true) {
      rfAni.update(dt);
    }

    rfAni.draw(ctx, 0, 0, 1);
  }

  // Change: Draw sprites for current frame only
  if (rfAni) {
    const currentFrameSprites = frameSprites.get(rfAni.index) || [];
    for (const s of currentFrameSprites) {
      // Only draw if image is fully loaded
      if (s.img.complete && s.img.naturalWidth > 0) {
        ctx.drawImage(s.img, s.x, s.y);
      }
    }
  }

  ctx.restore();

  requestAnimationFrame(loop);
}

export function loadAnimation(data, onReady) {
  const img = new Image();
  img.src = 'assets/' + data.image;
  img.onload = () => {
    rfAni = new RfAni(img, data.frameWidth, data.frameHeight, data.frames, data.speed, data.name || 'Unnamed', data.image);
    
    // Change: Load per-frame sprites if they exist in the data
    if (data.frameSprites) {
      frameSprites.clear();
      for (const [frameIndex, sprites] of Object.entries(data.frameSprites)) {
        const spritePromises = sprites.map(spriteData => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = spriteData.src;
            img.onload = () => resolve({
              img,
              x: spriteData.x,
              y: spriteData.y
            });
          });
        });
        
        Promise.all(spritePromises).then(loadedSprites => {
          frameSprites.set(parseInt(frameIndex), loadedSprites);
        });
      }
    }
    
    if (onReady) onReady();
  };
  img.onerror = () => alert("Failed to load image: " + data.image);
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
  
  // Change: Remove sprites for this frame and shift remaining frames
  frameSprites.delete(index);
  const newFrameSprites = new Map();
  for (const [frameIndex, sprites] of frameSprites) {
    if (frameIndex > index) {
      newFrameSprites.set(frameIndex - 1, sprites);
    } else {
      newFrameSprites.set(frameIndex, sprites);
    }
  }
  frameSprites.clear();
  for (const [frameIndex, sprites] of newFrameSprites) {
    frameSprites.set(frameIndex, sprites);
  }
  
  if (rfAni.index >= frames.length) rfAni.index = frames.length > 0 ? frames.length - 1 : 0;
}

export function moveFrame(oldIndex, newIndex) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  if (oldIndex < 0 || oldIndex >= frames.length) return;
  if (newIndex < 0 || newIndex >= frames.length) return;
  const [f] = frames.splice(oldIndex, 1);
  frames.splice(newIndex, 0, f);
  rfAni.setFrames(frames);
  rfAni.index = newIndex;
  
  // Change: Move sprites along with the frame
  const sprites = frameSprites.get(oldIndex);
  frameSprites.delete(oldIndex);
  if (sprites) {
    frameSprites.set(newIndex, sprites);
  }
}

export function createFramePreview(index, scale = 2) {
  if (!rfAni) return null;
  const frame = rfAni.frames[index];
  if (!frame) return null;

  const canvas = document.createElement('canvas');
  canvas.width = rfAni.frameWidth * scale;
  canvas.height = rfAni.frameHeight * scale;
  const c = canvas.getContext('2d');

  if (frame[0] < 0 || frame[1] < 0) {
    // Show empty frame preview
    c.fillStyle = '#222';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#aaa';
    c.font = '10px sans-serif';
    c.fillText('Empty', 4, 12);
    return canvas;
  }

  const sx = frame[0] * rfAni.frameWidth;
  const sy = frame[1] * rfAni.frameHeight;
  c.drawImage(rfAni.image, sx, sy, rfAni.frameWidth, rfAni.frameHeight, 0, 0, canvas.width, canvas.height);
  
  // Change: Also draw sprites for this frame in the preview
  const sprites = frameSprites.get(index) || [];
  for (const s of sprites) {
    const spriteScale = scale / 1; // Adjust sprite scale for preview
    c.drawImage(s.img, 
      (s.x + rfAni.frameWidth/2) * spriteScale, 
      (s.y + rfAni.frameHeight/2) * spriteScale,
      s.img.width * spriteScale,
      s.img.height * spriteScale
    );
  }
  
  return canvas;
}

export function addFrame(frame = null) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();

  if (!frame || !Array.isArray(frame) || frame.length !== 2) {
    frames.push([-1, -1]); // Placeholder for empty frame
  } else {
    frames.push(frame);
  }

  rfAni.setFrames(frames);
  
  // Change: Initialize empty sprite array for new frame
  const newFrameIndex = frames.length - 1;
  if (!frameSprites.has(newFrameIndex)) {
    frameSprites.set(newFrameIndex, []);
  }
}

export function setSpeed(speed) {
  if (rfAni) rfAni.setSpeed(speed);
}

export function setName(name) {
  if (rfAni) rfAni.setName(name);
}

export function getAnimationData() {
  if (!rfAni) return null;
  
  // Change: Include per-frame sprites in the data
  const frameSpritesData = {};
  for (const [frameIndex, sprites] of frameSprites) {
    frameSpritesData[frameIndex] = sprites.map(sprite => ({
      src: sprite.img.src,
      x: sprite.x,
      y: sprite.y
    }));
  }
  
  return {
    name: rfAni.name,
    image: rfAni.imageName,
    frameWidth: rfAni.frameWidth,
    frameHeight: rfAni.frameHeight,
    frames: rfAni.frames.slice(),
    speed: rfAni.speed,
    frameSprites: frameSpritesData
  };
}

// Change: Add sprite to current frame only
export function addCanvasSprite(img, x = 0, y = 0) {
  if (!rfAni) return;
  
  // Ensure image is loaded before adding
  if (!img.complete || img.naturalWidth === 0) {
    console.warn('Attempting to add sprite before image is loaded');
    return;
  }
  
  const currentFrame = rfAni.index;
  
  if (!frameSprites.has(currentFrame)) {
    frameSprites.set(currentFrame, []);
  }
  
  frameSprites.get(currentFrame).push({ img, x, y });
}

export function screenToWorld(x, y) {
  const cx = canvasRef.width / 2;
  const cy = canvasRef.height / 2;
  return {
    x: (x - cx) / zoomLevel - offsetX,
    y: (y - cy) / zoomLevel - offsetY
  };
}

export function getSpriteAtPoint(x, y) {
  if (!rfAni) return null;
  
  const currentFrameSprites = frameSprites.get(rfAni.index) || [];
  for (let i = currentFrameSprites.length - 1; i >= 0; i--) {
    const s = currentFrameSprites[i];
    if (
      x >= s.x &&
      x <= s.x + s.img.width &&
      y >= s.y &&
      y <= s.y + s.img.height
    ) {
      return s;
    }
  }
  return null;
}

// Change: New function to remove sprite from current frame
export function removeSpriteFromCurrentFrame(sprite) {
  if (!rfAni) return;
  const currentFrame = rfAni.index;
  const sprites = frameSprites.get(currentFrame) || [];
  const index = sprites.indexOf(sprite);
  if (index > -1) {
    sprites.splice(index, 1);
  }
}

// Change: New function to copy sprites from one frame to another
export function copySpritesToFrame(fromFrame, toFrame) {
  if (!rfAni) return;
  const sourceSprites = frameSprites.get(fromFrame) || [];
  const copiedSprites = sourceSprites.map(sprite => ({
    img: sprite.img,
    x: sprite.x,
    y: sprite.y
  }));
  frameSprites.set(toFrame, copiedSprites);
}

// Change: New function to get sprites for a specific frame
export function getFrameSprites(frameIndex) {
  return frameSprites.get(frameIndex) || [];
}

export function setRfAni(instance) {
  rfAni = instance;

  // Add frame 0 if animation has no frames yet
  if (rfAni.frames.length === 0) {
    rfAni.setFrames([[-1, -1]]);
  }

  // Initialize sprite array for frame 0 if not already
  if (!frameSprites.has(0)) {
    frameSprites.set(0, []);
  }
}

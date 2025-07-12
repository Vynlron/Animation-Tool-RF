import { RfAni } from '../engine/rfani.js';

let rfAni = null;
let ctx = null;
let lastTime = performance.now();
let zoomLevel = 2;
const minZoom = 0.5;
const maxZoom = 6;
let canvasRef = null;
// Array of sprites drawn on the canvas
const sprites = [];
let layersEl = null; // legacy element no longer used

// Infinite canvas state
let offsetX = 0;
let offsetY = 0;

function updateLayerTransform() {
  // kept for backward compatibility but no DOM transforms are applied
}

export function pan(dx, dy) {
  offsetX += dx / zoomLevel;
  offsetY += dy / zoomLevel;
}

/**
 * Initialize studio with a canvas element.
 */
export function initStudio(canvasElement) {
  canvasRef = canvasElement;
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
  ctx = canvasElement.getContext('2d');
  lastTime = performance.now();


  // Resize canvas on window change
  window.addEventListener('resize', () => {
    canvasRef.width = window.innerWidth;
    canvasRef.height = window.innerHeight;
  });

  // Mouse wheel zoom
  canvasElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    if (delta > 0) {
      zoomLevel = Math.max(minZoom, zoomLevel - 0.1);
    } else {
      zoomLevel = Math.min(maxZoom, zoomLevel + 0.1);
    }
    zoomLevel = Math.round(zoomLevel * 10) / 10;
  });

  // Pan interactions are handled by the tools module

  requestAnimationFrame(loop);
}

/**
 * Draws a scrolling background grid that moves with pan & zoom.
 */
function drawGrid(ctx, width, height, zoom) {
  const baseSize = 10; // world units
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

// Draws the red (horizontal) and blue (vertical) crosshair lines.
// The lines follow the panning/zooming of the grid so that the
// origin always lines up with the grid's center rather than the
// screen center.
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



/**
 * Main animation loop
 */
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

  for (const s of sprites) {
    ctx.drawImage(s.img, s.x, s.y);
  }

  ctx.restore();

  requestAnimationFrame(loop);
}

// Animation-related utility functions
export function loadAnimation(data, onReady) {
  const img = new Image();
  img.src = 'assets/' + data.image;
  img.onload = () => {
    rfAni = new RfAni(img, data.frameWidth, data.frameHeight, data.frames, data.speed, data.name || 'Unnamed', data.image);
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
}

export function createFramePreview(index, scale = 2) {
  if (!rfAni) return null;
  const frame = rfAni.frames[index];
  if (!frame) return null;
  const canvas = document.createElement('canvas');
  canvas.width = rfAni.frameWidth * scale;
  canvas.height = rfAni.frameHeight * scale;
  const c = canvas.getContext('2d');
  const sx = frame[0] * rfAni.frameWidth;
  const sy = frame[1] * rfAni.frameHeight;
  c.drawImage(rfAni.image, sx, sy, rfAni.frameWidth, rfAni.frameHeight, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function addFrame(frame) {
  if (!rfAni || !frame || frame.length !== 2) return; // Check for valid [x, y] frame tuple
  const frames = rfAni.frames.concat([frame]);
  rfAni.setFrames(frames);
}

export function setSpeed(speed) {
  if (rfAni) rfAni.setSpeed(speed);
}

export function setName(name) {
  if (rfAni) rfAni.setName(name);
}

export function getAnimationData() {
  if (!rfAni) return null;
  return {
    name: rfAni.name,
    image: rfAni.imageName,
    frameWidth: rfAni.frameWidth,
    frameHeight: rfAni.frameHeight,
    frames: rfAni.frames.slice(),
    speed: rfAni.speed
  };
}

export function addCanvasSprite(img, x = 0, y = 0) {
  sprites.push({ img, x, y });
}

export function screenToWorld(x, y) {
  const cx = canvasRef.width / 2;
  const cy = canvasRef.height / 2;
  return {
    x: (x - cx) / zoomLevel - offsetX,
    y: (y - cy) / zoomLevel - offsetY
  };
}

import { RfAni } from '../engine/rfani.js';

let rfAni = null;
let ctx = null;
let lastTime = performance.now();
let zoomLevel = 2;
const minZoom = 0.5;
const maxZoom = 6;
let canvasRef = null;

// Infinite canvas state
let offsetX = 0;
let offsetY = 0;

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
function drawGrid(ctx, width, height, offsetX, offsetY, zoom) {
  const baseSize = 10;
  const gridSize = baseSize * zoom;
  const majorLineEvery = 5;
  const centerX = width / 2 + offsetX * zoom;
  const centerY = height / 2 + offsetY * zoom;

  ctx.save();
  let index = 1;
  for (let x = centerX + gridSize; x <= width; x += gridSize, index++) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.strokeStyle = (index % majorLineEvery === 0) ? '#444' : '#2a2a2a';
    ctx.lineWidth = (index % majorLineEvery === 0) ? 1.3 : 0.5;
    ctx.stroke();
  }

  index = 1;
  for (let x = centerX - gridSize; x >= 0; x -= gridSize, index++) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.strokeStyle = (index % majorLineEvery === 0) ? '#444' : '#2a2a2a';
    ctx.lineWidth = (index % majorLineEvery === 0) ? 1.3 : 0.5;
    ctx.stroke();
  }

  index = 1;
  for (let y = centerY + gridSize; y <= height; y += gridSize, index++) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.strokeStyle = (index % majorLineEvery === 0) ? '#444' : '#2a2a2a';
    ctx.lineWidth = (index % majorLineEvery === 0) ? 1.3 : 0.5;
    ctx.stroke();
  }

  index = 1;
  for (let y = centerY - gridSize; y >= 0; y -= gridSize, index++) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.strokeStyle = (index % majorLineEvery === 0) ? '#444' : '#2a2a2a';
    ctx.lineWidth = (index % majorLineEvery === 0) ? 1.3 : 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

// Draws the red (horizontal) and blue (vertical) crosshair lines.
// The lines follow the panning/zooming of the grid so that the
// origin always lines up with the grid's center rather than the
// screen center.
function drawCrosshair(ctx, width, height, offsetX, offsetY, zoom) {
  const centerX = width / 2 + offsetX * zoom;
  const centerY = height / 2 + offsetY * zoom;

  ctx.save();
  ctx.strokeStyle = '#aa0000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  ctx.strokeStyle = '#0033cc';
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();
  ctx.restore();
}

function drawFrameBox(ctx, centerX, centerY, frameWidth, frameHeight, zoom) {
  const halfW = frameWidth * zoom / 2;
  const halfH = frameHeight * zoom / 2;

  ctx.save();
  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - halfW, centerY - halfH, frameWidth * zoom, frameHeight * zoom);
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

  drawGrid(ctx, canvasRef.width, canvasRef.height, offsetX, offsetY, zoomLevel);
  drawCrosshair(ctx, canvasRef.width, canvasRef.height, offsetX, offsetY, zoomLevel);

  if (rfAni) {
    if (window.isPlaybackEnabled ? window.isPlaybackEnabled() : true) {
      rfAni.update(dt);
    }

    // Keep the preview sprite anchored to the screen center so panning and
    // zooming only affect the grid/crosshair background.
    drawFrameBox(ctx, centerX, centerY, rfAni.frameWidth, rfAni.frameHeight, zoomLevel);

    rfAni.draw(ctx, centerX, centerY, zoomLevel);
  }

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
  if (rfAni.index >= frames.length) rfAni.index = frames.length - 1;
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
  if (!rfAni) return;
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

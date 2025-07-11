import { RfAni } from '../engine/rfani.js';

let rfAni = null;
let ctx = null;
let lastTime = performance.now();

/**
 * Initialize studio with a canvas element.
 * Starts the animation loop.
 */
export function initStudio(canvasElement) {
  ctx = canvasElement.getContext('2d');
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

/**
 * Load a new animation from data (.rfani structure)
 * @param {Object} data
 * @param {Function} onReady
 */
export function loadAnimation(data, onReady) {
  const img = new Image();
  img.src = 'assets/' + data.image;

  img.onload = () => {
    rfAni = new RfAni(img, data.frameWidth, data.frameHeight, data.frames, data.speed, data.name || 'Unnamed', data.image);
    if (onReady) onReady();
  };

  img.onerror = () => {
    alert("Failed to load image: " + data.image);
  };
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
  if (rfAni.index >= frames.length) {
    rfAni.index = frames.length - 1;
  }
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
  c.drawImage(
    rfAni.image,
    sx,
    sy,
    rfAni.frameWidth,
    rfAni.frameHeight,
    0,
    0,
    rfAni.frameWidth * scale,
    rfAni.frameHeight * scale
  );
  return canvas;
}

export function addFrame(frame) {
  if (!rfAni) return;
  const frames = rfAni.frames.concat([frame]);
  rfAni.setFrames(frames);
}

export function setSpeed(speed) {
  if (rfAni) {
    rfAni.setSpeed(speed);
  }
}

export function setName(name) {
  if (rfAni) {
    rfAni.setName(name);
  }
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

/**
 * Main animation loop
 */
function loop(time) {
  const dt = time - lastTime;
  lastTime = time;

  if (rfAni && ctx) {
    if (window.isPlaybackEnabled ? window.isPlaybackEnabled() : true) {
      rfAni.update(dt);
    }
    ctx.clearRect(0, 0, 160, 160);
    rfAni.draw(ctx, 40, 60, 2);
  }

  requestAnimationFrame(loop);
}

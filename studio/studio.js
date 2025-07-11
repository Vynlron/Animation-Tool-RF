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
    rfAni = new RfAni(img, data.frameWidth, data.frameHeight, data.frames, data.speed);
    if (onReady) onReady();
  };

  img.onerror = () => {
    alert("Failed to load image: " + data.image);
  };
}

export function addFrame(frame) {
  if (!rfAni) return;
  const frames = rfAni.frames.concat([frame]);
  rfAni.setFrames(frames);
}

export function removeFrame(index) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  frames.splice(index, 1);
  rfAni.setFrames(frames);
}

export function moveFrame(from, to) {
  if (!rfAni) return;
  const frames = rfAni.frames.slice();
  const item = frames.splice(from, 1)[0];
  frames.splice(to, 0, item);
  rfAni.setFrames(frames);
}

export function setSpeed(speed) {
  if (rfAni) rfAni.setSpeed(speed);
}

export function getAnimationData(name = '') {
  if (!rfAni) return null;
  return {
    name,
    image: rfAni.image.src.split('/').pop(),
    frameWidth: rfAni.frameWidth,
    frameHeight: rfAni.frameHeight,
    frames: rfAni.frames,
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

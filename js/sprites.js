import {
  screenToWorld,
  addCanvasSprite,
  addSpritesheet
} from '../studio/studio.js';

let isDraggingFromPalette = false;

// This function now creates its own modal, fixing the bug.
function promptForDimensions(filename) {
  return new Promise((resolve) => {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal';

    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    
    modalBox.innerHTML = `
      <h3>Sprite Dimensions</h3>
      <p style="margin-bottom: 15px;">Enter sprite dimensions for <strong>${filename}</strong>:</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <label>Width: <input type="number" id="sprite-w-input" value="20" style="width: 60px;"></label>
        <label>Height: <input type="number" id="sprite-h-input" value="20" style="width: 60px;"></label>
      </div>
      <div class="modal-buttons" style="margin-top: 20px;">
        <button id="dim-confirm-btn">OK</button>
        <button id="dim-cancel-btn">Cancel</button>
      </div>
    `;

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    const widthInput = modalBox.querySelector('#sprite-w-input');
    const heightInput = modalBox.querySelector('#sprite-h-input');
    const confirmBtn = modalBox.querySelector('#dim-confirm-btn');
    const cancelBtn = modalBox.querySelector('#dim-cancel-btn');

    const cleanup = () => {
      document.body.removeChild(modalOverlay);
    };

    confirmBtn.onclick = () => {
      const width = parseInt(widthInput.value, 10);
      const height = parseInt(heightInput.value, 10);
      if (width > 0 && height > 0) {
        cleanup();
        resolve({ width, height });
      } else {
        alert('Please enter valid dimensions greater than 0.');
      }
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null); // Resolve with null if cancelled
    };
  });
}

function createPaletteSprite(sourceName, sourceImage, sx, sy, sWidth, sHeight) {
  const itemWrapper = document.createElement('div');
  itemWrapper.className = 'palette-sprite-item';
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = sWidth;
  previewCanvas.height = sHeight;
  const ctx = previewCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceImage, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
  previewCanvas.draggable = true;
  previewCanvas.style.imageRendering = 'pixelated';
  const dragData = { sourceName, sourceRect: { sx, sy, sWidth, sHeight } };
  
  previewCanvas.addEventListener('dragstart', ev => {
    isDraggingFromPalette = true;
    ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  });

  itemWrapper.appendChild(previewCanvas);
  return itemWrapper;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Failed to load image from source."));
    
    if (source.file && source.file instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(source.file);
    } else if (typeof source.url === 'string') {
      img.crossOrigin = "anonymous";
      img.src = source.url;
    } else {
      reject(new Error("Invalid image source provided."));
    }
  });
}

export async function loadAndDisplaySheets(sheetDefs, clearPalette = true) {
  const panel = document.getElementById('sprite-selector-panel');
  if (clearPalette) panel.innerHTML = '';
  if (!sheetDefs || sheetDefs.length === 0) return;

  try {
    const imagePromises = sheetDefs.map(def => loadImage(def));
    const images = await Promise.all(imagePromises);

    images.forEach((image, index) => {
      const def = sheetDefs[index];
      const name = def.name;
      const spriteWidth = def.spriteWidth || 20;
      const spriteHeight = def.spriteHeight || 20;

      addSpritesheet(name, image);
      const column = document.createElement('div');
      column.className = 'spritesheet-column';
      const title = document.createElement('h3');
      title.textContent = def.displayName || name;
      const grid = document.createElement('div');
      grid.className = 'sprite-grid';
      column.appendChild(title);
      column.appendChild(grid);
      panel.appendChild(column);

      const cols = Math.floor(image.width / spriteWidth);
      const rows = Math.floor(image.height / spriteHeight);

      for (let i = 0; i < rows * cols; i++) {
        const frameX = i % cols;
        const frameY = Math.floor(i / cols);
        const sx = frameX * spriteWidth;
        const sy = frameY * spriteHeight;
        const spriteItem = createPaletteSprite(name, image, sx, sy, spriteWidth, spriteHeight);
        grid.appendChild(spriteItem);
      }
    });
  } catch (error) {
    console.error("Failed to load and process spritesheets:", error);
    alert("There was an error loading the images.");
  }
}

function insertSprite(sourceName, sourceRect, x, y) {
  addCanvasSprite(sourceName, sourceRect, x, y);
}

export function initMultiSpriteLoader() {
  const loaderInput = document.getElementById('spritesheet-loader-input');
  loaderInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    const sheetDefs = [];
    for (const file of files) {
      const dims = await promptForDimensions(file.name);
      if (!dims) continue;

      sheetDefs.push({
        file: file,
        name: file.name,
        spriteWidth: dims.width,
        spriteHeight: dims.height
      });
    }

    if (sheetDefs.length > 0) {
      await loadAndDisplaySheets(sheetDefs, false);
    }

    event.target.value = '';
  });
}

export function enableDrop(canvas) {
  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    if (!isDraggingFromPalette) return;
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const pos = screenToWorld(e.offsetX, e.offsetY);
    insertSprite(data.sourceName, data.sourceRect, pos.x, pos.y);
    isDraggingFromPalette = false;
  });
}
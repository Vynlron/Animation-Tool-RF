import { 
    screenToWorld, 
    addCanvasSprite,
    addSpritesheet,
    clearSpritesheets
} from '../studio/studio.js';
import { promptForDimensions } from './main.js'; // <-- Add this import at the top of the file

let isDraggingFromPalette = false;

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

// --- NEW: Reusable Image Loading Logic ---
// This can load an image from a File object or a URL.
function loadImage(source) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;

        // NEW: Check for our custom object with a file property
        if (source.file && source.file instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.onerror = reject;
            reader.readAsDataURL(source.file);
        } else if (source instanceof File) { // Keep old functionality
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.onerror = reject;
            reader.readAsDataURL(source);
        } else if (typeof source.url === 'string') { // Keep old functionality
            img.crossOrigin = "anonymous";
            img.src = source.url;
        } else {
            reject(new Error("Invalid image source provided."));
        }
    });
}

// --- NEW: A single, powerful function to handle all sheet loading ---

export async function loadAndDisplaySheets(sheetDefs, clearPalette = true) {
  const panel = document.getElementById('sprite-selector-panel');
  
  if (clearPalette) {
      panel.innerHTML = '';
  }

  if (!sheetDefs || sheetDefs.length === 0) return;

  try {
    const imagePromises = sheetDefs.map(def => def.file ? loadImage(def.file) : loadImage(def));
    const images = await Promise.all(imagePromises);

    images.forEach((image, index) => {
      const def = sheetDefs[index];
      const name = def.name;

      // --- THIS IS THE FIX ---
      // If dimensions are provided (from the file loader), use them.
      // Otherwise, fall back to our default tile size of 20 for the initial sheets.
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
// This function now uses our new central loader.
export function initMultiSpriteLoader() {
  const loaderInput = document.getElementById('spritesheet-loader-input');

  loaderInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    const sheetDefs = [];
    // Loop through each selected file and ask for its dimensions
    for (const file of files) {
      const { width, height } = await promptForDimensions(file.name);
      sheetDefs.push({
        file: file,
        name: file.name,
        spriteWidth: width,
        spriteHeight: height
      });
    }

    await loadAndDisplaySheets(sheetDefs, false);
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
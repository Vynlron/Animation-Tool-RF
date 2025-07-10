import { loadAnimation, initStudio } from './studio/studio.js';
import { showModal } from './ui/modal.js';

const canvas = document.getElementById('preview');
initStudio(canvas);

const mainMenu = document.getElementById('main-menu');
const studio = document.getElementById('studio');
const studioTitle = document.getElementById('studio-animation-name');

let isGridVisible = true;
let isPlaying = true;

// New Animation Modal
document.getElementById('new-animation').addEventListener('click', () => {
  showModal({
    title: 'Name your animation',
    defaultValue: '',
    onConfirm: (name) => {
      mainMenu.style.display = 'none';
      studio.style.display = 'block';
      studioTitle.textContent = name;

      const defaultData = {
        name,
        image: "PlayerBodyTemplate.png",
        frameWidth: 20,
        frameHeight: 20,
        frames: [[0, 0]],
        speed: 200
      };

      loadAnimation(defaultData, () => {});
    }
  });
});

// Load .rfani file
document.getElementById('rfani-loader').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      mainMenu.style.display = 'none';
      studio.style.display = 'block';
      studioTitle.textContent = data.name || "Unnamed";
      loadAnimation(data);
    } catch {
      alert('Invalid .rfani file!');
    }
  };
  reader.readAsText(file);
});

// TOOL FUNCTIONS
document.getElementById('tool-toggle-grid').addEventListener('click', () => {
  isGridVisible = !isGridVisible;
  document.querySelector('.canvas-wrapper').style.setProperty('--show-grid', isGridVisible ? '0.3' : '0');
});

document.getElementById('tool-toggle-play').addEventListener('click', () => {
  isPlaying = !isPlaying;
});

document.getElementById('tool-add-sprite').addEventListener('click', () => {
  document.getElementById('sprite-loader').click();
});

document.getElementById('sprite-loader').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = () => {
      const container = document.getElementById('sprite-panel');
      const el = document.createElement('img');
      el.src = img.src;
      container.appendChild(el);
    };
  };
  reader.readAsDataURL(file);
});

document.getElementById('tool-add-frame').addEventListener('click', () => {
  alert('Add Frame clicked (not yet implemented)');
});

document.getElementById('tool-pan').addEventListener('click', () => {
  alert('Pan tool activated (not implemented yet)');
});

// Provide shared control values
export function isPlaybackEnabled() {
  return isPlaying;
}

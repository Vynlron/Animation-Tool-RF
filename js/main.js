import { 
    initStudio, 
    loadAnimation, 
    setRfAni, 
    getEditorState,
    setFrameWidth,
    setFrameHeight,
} from '../studio/studio.js';
import { initTools } from './tools.js';
import { initTimeline, renderTimeline } from './timeline.js';
import { initMultiSpriteLoader, enableDrop, loadAndDisplaySheets } from './sprites.js';
import { RfAni } from '../engine/rfani.js';
import { initIOButtons } from './io.js';

export const defaultSheets = [
    { name: 'realmforge_head.png', displayName: 'Head', url: '../assets/realmforge_head.png' },
    { name: 'realmforge_body.png', displayName: 'Body', url: '../assets/realmforge_body.png' }
];

export function updateUIForLoadedAnimation(data) {
    const studioEl = document.getElementById('studio');
    const menuEl = document.getElementById('main-menu');
    const headerActions = document.querySelector('.header-actions'); 
    const headerRightControls = document.getElementById('header-right-controls');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const studioInfo = document.getElementById('studio-info');
    
    studioInfo.style.display = 'flex';
    headerActions.style.display = 'flex';
    headerRightControls.style.display = 'flex';
    backToMenuBtn.style.display = 'block';

    document.getElementById('studio-animation-name').textContent = data.name || 'Unnamed';
    document.getElementById('speed-slider').value = data.speed || 200;
    document.getElementById('frame-width-input').value = data.frameWidth || 20;
    document.getElementById('frame-height-input').value = data.frameHeight || 20;
    
    menuEl.style.display = 'none';
    studioEl.style.display = 'block';
    renderTimeline();
}

let modalConfirmCallback = null;

function handleModalConfirm() {
    const modalInput = document.getElementById('modal-input');
    const value = modalInput.value.trim();
    if (value) {
        document.getElementById('modal').classList.add('hidden');
        if (modalConfirmCallback) {
            modalConfirmCallback(value);
        }
    } else {
        alert("Please enter a value.");
    }
}

export function showModal({ title, confirmText = 'OK', defaultValue = '', onConfirm }) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalInput = document.getElementById('modal-input');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    
    modalTitle.textContent = title;
    modalInput.value = defaultValue;
    modalConfirmBtn.textContent = confirmText;
    
    modalConfirmCallback = onConfirm;

    modal.classList.remove('hidden');
    modalInput.focus();
}

export function showContentModal(title, contentElement) {
    const modal = document.getElementById('preview-modal');
    document.getElementById('preview-modal-title').textContent = title;
    const contentArea = document.getElementById('preview-modal-content');
    contentArea.innerHTML = '';
    contentArea.appendChild(contentElement);
    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async () => { 
    const studioEl = document.getElementById('studio');
    const menuEl = document.getElementById('main-menu');
    const canvas = document.getElementById('preview');
    
    const studioInfo = document.getElementById('studio-info');
    const headerActions = document.getElementById('header-actions'); 
    const headerRightControls = document.getElementById('header-right-controls');
    const backToMenuBtn = document.getElementById('back-to-menu');
    
    document.getElementById('modal-confirm-btn').addEventListener('click', handleModalConfirm);
    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
    });

    document.getElementById('preview-modal-close-btn').addEventListener('click', () => {
        document.getElementById('preview-modal').classList.add('hidden');
    });

    async function showStudio(data) {
        await loadAnimation(data, () => {
            updateUIForLoadedAnimation(data);
        });
    }

    function showMenu() {
        studioInfo.style.display = 'none';
        headerActions.style.display = 'none';
        headerRightControls.style.display = 'none';
        backToMenuBtn.style.display = 'none';
        
        studioEl.style.display = 'none';
        menuEl.style.display = 'block';
    }

    function onAnimationImport(data) {
        showStudio(data);
    }
    
    initStudio(canvas);
    initTools(canvas);
    initMultiSpriteLoader();
    enableDrop(canvas);
    initIOButtons(onAnimationImport, showModal, showContentModal);
    initTimeline();

    const widthInput = document.getElementById('frame-width-input');
    const heightInput = document.getElementById('frame-height-input');

    widthInput.addEventListener('change', () => {
        const newWidth = parseInt(widthInput.value, 10);
        if (!isNaN(newWidth)) {
            setFrameWidth(newWidth);
        }
    });

    heightInput.addEventListener('change', () => {
        const newHeight = parseInt(heightInput.value, 10);
        if (!isNaN(newHeight)) {
            setFrameHeight(newHeight);
        }
    });

    backToMenuBtn.addEventListener('click', showMenu);
    
    document.getElementById('new-animation').addEventListener('click', () => {
        showModal({
            title: 'Name Your Animation',
            onConfirm: async (name) => {
                const newAni = new RfAni(new Image(), 20, 20, [], 200, name, '');
                setRfAni(newAni);
                const data = getEditorState();
                showStudio(data);

                await loadAndDisplaySheets(defaultSheets);
            }
        });
    });

    document.getElementById('rfani-loader').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                showStudio(data);
            } catch (err) {
                alert('Error: Could not parse the .rfani file.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    });

    showMenu();
});


export function promptForMissingFiles(requiredFiles) {
    return new Promise((resolve) => {
        const modal = document.getElementById('preview-modal');
        document.getElementById('preview-modal-title').textContent = 'Missing Spritesheets';
        const contentArea = document.getElementById('preview-modal-content');
        
        contentArea.innerHTML = `
            <p>This animation requires the following image files. Please select one for each.</p>
            <div id="file-prompt-list" style="margin: 20px 0; display: grid; gap: 15px; max-width: 450px; margin-left: auto; margin-right: auto;">
                ${requiredFiles.map(name => `
                    <div class="file-prompt-item" style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="padding-right: 15px;">${name}</strong>
                        <div style="display: flex; align-items: center;">
                            <label for="file-input-${name}" class="modal-btn file-upload-label">Choose File</label>
                            <span id="file-name-${name}" class="file-name-display">No file chosen</span>
                        </div>
                        <input type="file" class="missing-file-input" id="file-input-${name}" data-name="${name}" accept="image/png, image/jpeg" style="display: none;">
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 25px;">
                <button id="missing-files-confirm" class="modal-btn">Load Selected Files</button>
            </div>
        `;
        
        modal.classList.remove('hidden');

        document.querySelectorAll('.missing-file-input').forEach(input => {
            input.addEventListener('change', (event) => {
                const fileName = event.target.files.length > 0 ? event.target.files[0].name : 'No file chosen';
                const name = event.target.dataset.name;
                const displayNameEl = document.getElementById(`file-name-${name}`);
                displayNameEl.textContent = fileName;
                displayNameEl.title = fileName; 
            });
        });

        const confirmBtn = document.getElementById('missing-files-confirm');

        const confirmAndClose = () => {
            const fileMap = new Map();
            const inputs = document.querySelectorAll('.missing-file-input');
            inputs.forEach(input => {
                const requiredName = input.dataset.name;
                const file = input.files[0];
                if (file) {
                    fileMap.set(requiredName, file);
                }
            });
            modal.classList.add('hidden');
            resolve(fileMap);
        };

        confirmBtn.addEventListener('click', confirmAndClose, { once: true });
        
        document.getElementById('preview-modal-close-btn').addEventListener('click', () => {
            resolve(new Map());
        }, { once: true });
    });
}

// In js/main.js, add this new function

export function promptForDimensions(filename) {
  return new Promise((resolve) => {
    const modal = document.getElementById('dimension-modal');
    document.getElementById('dimension-modal-filename').textContent = filename;
    
    const widthInput = document.getElementById('sprite-w-input');
    const heightInput = document.getElementById('sprite-h-input');
    const confirmBtn = document.getElementById('dimension-confirm-btn');

    // Reset to default values
    widthInput.value = 20;
    heightInput.value = 20;

    const onConfirm = () => {
      const width = parseInt(widthInput.value, 10);
      const height = parseInt(heightInput.value, 10);

      if (width > 0 && height > 0) {
        modal.classList.add('hidden');
        // Remove the event listener to prevent memory leaks
        confirmBtn.removeEventListener('click', onConfirm);
        resolve({ width, height });
      } else {
        alert('Please enter valid dimensions greater than 0.');
      }
    };
    
    confirmBtn.addEventListener('click', onConfirm);
    modal.classList.remove('hidden');
    widthInput.focus();
  });
}
import { 
    initStudio, 
    loadAnimation, 
    setRfAni, 
    getAnimationData,
    setFrameWidth,
    setFrameHeight
} from '../studio/studio.js';
import { initTools } from './tools.js';
import { initTimeline, renderTimeline } from './timeline.js';
import { initMultiSpriteLoader, enableDrop, loadAndDisplaySheets } from './sprites.js';
import { RfAni } from '../engine/rfani.js';
import { initIOButtons } from './io.js';

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


    function showStudio(data) {
        loadAnimation(data, () => {
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
    initMultiSpriteLoader(); // <-- This is our new generic function call
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
        onConfirm: async (name) => { // <-- Make this function async
            const newAni = new RfAni(new Image(), 20, 20, [], 200, name, '');
            setRfAni(newAni);
            const data = getAnimationData();
            showStudio(data);

            // --- KEY CHANGE: Load default assets after showing the studio ---
            const defaultSheets = [
                { name: 'Head', url: '../assets/realmforge_head.png' },
                { name: 'Body', url: '../assets/realmforge_body.png' }
            ];
            await loadAndDisplaySheets(defaultSheets);
            // --- END KEY CHANGE ---
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
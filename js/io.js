import { getAnimationData, createFramePreview, getFrameDuration, getFrames } from '../studio/studio.js';

let showAppModal = null;
let showContentModal = null;

function handleExport() {
    const data = getAnimationData();
    if (!data || !showAppModal) return;

    showAppModal({
        title: 'Export Animation',
        confirmText: 'Save',
        defaultValue: data.name || 'unnamed',
        onConfirm: (filename) => {
            data.name = filename;
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.rfani`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });
}

function handleImport(event, onLoaded) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            onLoaded(data);
        } catch (err) {
            alert('Error: Could not parse .rfani file. Is it valid?');
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}


function handleGifPreview() {
    const frames = getFrames();
    if (frames.length === 0) {
        alert("There are no frames to create a GIF from.");
        return;
    }
    
    if (!showContentModal) {
        alert("Preview function is not available.");
        return;
    }

    const loadingEl = document.createElement('p');
    loadingEl.textContent = 'Generating GIF... Please wait.';
    showContentModal('GIF Preview', loadingEl); // Use the new modal function

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'js/lib/gif.worker.js'
    });

    frames.forEach((frame, index) => {
        const frameCanvas = createFramePreview(index, 2);
        if (frameCanvas && frameCanvas.width > 0 && frameCanvas.height > 0) {
            const duration = getFrameDuration(index);
            gif.addFrame(frameCanvas, { delay: duration });
        }
    });

    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.imageRendering = 'pixelated';
        showContentModal('GIF Preview', img); // Use the new modal function
    });

    gif.render();
}

export function initIOButtons(onImport, formModalFn, contentModalFn) {
    showAppModal = formModalFn;
    showContentModal = contentModalFn; // Store the new modal function
    document.getElementById('export-rfani-btn').addEventListener('click', handleExport);
    document.getElementById('preview-gif-btn').addEventListener('click', handleGifPreview);
    document.getElementById('import-rfani-input').addEventListener('change', (e) => handleImport(e, onImport));
}


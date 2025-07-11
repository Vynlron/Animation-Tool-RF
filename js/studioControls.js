import { showModal } from '../ui/modal.js';
import { setSpeed, setName, getAnimationData } from '../studio/studio.js';

export const studioTitle = document.getElementById('studio-animation-name');
export const speedSlider = document.getElementById('speed-slider');

export function initStudioControls() {
  const renameBtn = document.getElementById('rename-animation-btn');
  const exportBtn = document.getElementById('export-btn');

  renameBtn.addEventListener('click', () => {
    showModal({
      title: 'Rename animation',
      defaultValue: studioTitle.textContent,
      onConfirm: (name) => {
        studioTitle.textContent = name;
        setName(name);
      }
    });
  });

  exportBtn.addEventListener('click', () => {
    const data = getAnimationData();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (data.name || 'animation') + '.rfani';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  speedSlider.addEventListener('input', (e) => {
    setSpeed(parseInt(e.target.value, 10));
  });
}

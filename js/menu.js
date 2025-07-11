export function initMenu({ mainMenu, studio, studioTitle, speedSlider, renderTimeline, loadAnimation, setSpeed, showModal }) {
  document.getElementById('back-to-menu').addEventListener('click', () => {
    studio.style.display = 'none';
    mainMenu.style.display = 'block';
  });

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

        loadAnimation(defaultData, renderTimeline);
        speedSlider.value = defaultData.speed;
        setSpeed(defaultData.speed);
      }
    });
  });

  document.getElementById('rfani-loader').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        mainMenu.style.display = 'none';
        studio.style.display = 'block';
        studioTitle.textContent = data.name || 'Unnamed';
        loadAnimation(data, renderTimeline);
        if (typeof data.speed === 'number') {
          speedSlider.value = data.speed;
          setSpeed(data.speed);
        }
      } catch {
        alert('Invalid .rfani file!');
      }
    };
    reader.readAsText(file);
  });
}

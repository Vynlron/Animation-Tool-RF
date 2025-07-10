// ui/modal.js
export function showModal({ title = '', defaultValue = '', onConfirm = () => {}, onCancel = () => {} }) {
  const modal = document.getElementById('modal');
  const input = document.getElementById('modal-input');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = title;
  input.value = defaultValue;
  modal.classList.remove('hidden');
  input.focus();

  function cleanup() {
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  }

  function handleConfirm() {
    const value = input.value.trim();
    if (!value) return alert("Please enter a name.");
    cleanup();
    modal.classList.add('hidden');
    onConfirm(value);
  }

  function handleCancel() {
    cleanup();
    modal.classList.add('hidden');
    onCancel();
  }

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

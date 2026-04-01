// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Cerrar modales al hacer click en overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });

  // Auto-dismiss flash messages a los 4 segundos
  document.querySelectorAll('.flash').forEach(f => {
    setTimeout(() => {
      f.style.transition = 'opacity .4s';
      f.style.opacity = '0';
      setTimeout(() => f.remove(), 400);
    }, 4000);
  });
});

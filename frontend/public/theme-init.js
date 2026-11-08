// Aplica el tema guardado (claro/oscuro) antes de pintar la página para evitar parpadeo.
try {
  var t = localStorage.getItem('acs-theme') || 'light';
  document.documentElement.dataset.theme = t;
} catch (e) {}

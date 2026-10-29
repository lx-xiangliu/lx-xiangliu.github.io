(() => {
  // Decode only after a deliberate click, keeping plain email and mailto links
  // out of the page source and initial DOM. This deters basic address harvesters.
  document.querySelectorAll('[data-email-action]').forEach(control => {
    control.addEventListener('click', () => {
      const address = atob('cGVyc2V2ZXJlbGl1QHN0dS54bXUuZWR1LmNu');
      window.location.href = ['mail', 'to', ':', address].join('');
    });
  });
  const button = document.getElementById('themeToggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark' : media.matches;
  function updateButton() {
    const dark = isDark();
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  }
  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (_) {}
    updateButton();
  });
  media.addEventListener('change', updateButton);
  updateButton();
})();

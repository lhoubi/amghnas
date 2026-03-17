// themeToggle.js
(function () {
  var htmlEl = document.documentElement;
  var btn = document.getElementById('themeToggle');

  function applyTheme(dark) {
    if (dark) {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }

  // Apply saved theme immediately on load
  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (!saved && prefersDark));

  // Wire up button click
  if (btn) {
    btn.addEventListener('click', function () {
      var isDark = !htmlEl.classList.contains('dark');
      applyTheme(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
})();

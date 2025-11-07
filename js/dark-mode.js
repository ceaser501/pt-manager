// Dark Mode Toggle Functionality
(function() {
  'use strict';

  // Get stored theme or default to light
  const getStoredTheme = () => localStorage.getItem('theme') || 'light';

  // Store theme preference
  const setStoredTheme = (theme) => localStorage.setItem('theme', theme);

  // Apply theme to document
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  // Initialize theme on page load
  const initTheme = () => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
  };

  // Toggle theme
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    applyTheme(newTheme);
    setStoredTheme(newTheme);
  };

  // Initialize theme immediately (before DOM loads)
  initTheme();

  // Set up toggle button when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('darkModeToggle');

    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
    }
  });

  // Export for use in other scripts if needed
  window.darkMode = {
    toggle: toggleTheme,
    get: () => document.documentElement.getAttribute('data-theme') || 'light',
    set: (theme) => {
      applyTheme(theme);
      setStoredTheme(theme);
    }
  };
})();

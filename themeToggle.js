// themeToggle.js

const themeToggle = document.getElementById('themeToggle');

if (themeToggle) { // Ensure the button exists on the page
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        // Save user preference
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Apply saved theme on load
    // This runs once when the page loads to check local storage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}
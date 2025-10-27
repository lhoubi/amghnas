// themeToggle.js

const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement; // Get the html element

// Function to update the SVG icons based on the current theme
function updateThemeIcons(isDarkMode) {
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const sunIcon = themeToggle.querySelector('.sun-icon');

    if (isDarkMode) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
}


if (themeToggle) { // Ensure the button exists on the page
    themeToggle.addEventListener('click', () => {
        // Toggle the 'dark' class on the html element
        htmlElement.classList.toggle('dark');

        // Save user preference
        const isDarkMode = htmlElement.classList.contains('dark');
        if (isDarkMode) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
        
        updateThemeIcons(isDarkMode);
    });

    // Apply saved theme on load
    // This runs once when the page loads to check local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        // If theme is explicitly 'dark' or no theme is saved and system prefers dark
        htmlElement.classList.add('dark');
        updateThemeIcons(true);
    } else {
        // Default to light, or if savedTheme is 'light'
        htmlElement.classList.remove('dark');
        updateThemeIcons(false);
    }
}

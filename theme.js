// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    }

    // Check system preference if no saved theme
    if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }

    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark');
            const currentTheme = body.classList.contains('dark') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }
}); 

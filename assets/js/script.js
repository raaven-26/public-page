// Minimal JS Boilerplate for GitHub Pages

document.addEventListener('DOMContentLoaded', function() {
    const helloBtn = document.getElementById('helloBtn');
    if (helloBtn) {
        helloBtn.addEventListener('click', function() {
            alert('Hello from your GitHub Pages site!');
        });
    }
});

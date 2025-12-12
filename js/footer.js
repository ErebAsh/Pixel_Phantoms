function renderFooter(basePath = '') {
    const footerHTML = `
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <h3 class="footer-title">Pixel Phantoms</h3>
                <p class="footer-description">Empowering the next generation of tech innovators through collaboration, learning, and creativity.</p>
                <div class="social-links">
                    <a href="https://github.com/sayeeg-11/Pixel_Phantoms" target="_blank" rel="noopener noreferrer" class="social-link github">
                        <i class="fab fa-github" aria-hidden="true"></i>
                        <span class="sr-only">Visit our GitHub repository</span>
                    </a>
                    <a class="social-link discord disabled" tabindex="-1">
                        <i class="fab fa-discord" aria-hidden="true"></i>
                        <span class="sr-only">Discord (Coming Soon)</span>
                    </a>
                    <a class="social-link linkedin disabled" tabindex="-1">
                        <i class="fab fa-linkedin" aria-hidden="true"></i>
                        <span class="sr-only">LinkedIn (Coming Soon)</span>
                    </a>
                    <a class="social-link email disabled" tabindex="-1">
                        <i class="fas fa-envelope" aria-hidden="true"></i>
                        <span class="sr-only">Email (Coming Soon)</span>
                    </a>
                </div>
            </div>
            <div class="footer-section">
                <h4 class="footer-subtitle">Quick Links</h4>
                <ul class="footer-links">
                    <li><a href="${basePath}about.html">About Us</a></li>
                    <li><a href="${basePath}events.html">Events</a></li>
                    <li><a href="${basePath}pages/contributors.html">Team</a></li>
                    <li><a href="${basePath}contact.html">Contact</a></li>
                    <li><a href="${basePath}pages/help.html">Help</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 class="footer-subtitle">Resources</h4>
                <ul class="footer-links">
                    <li><a href="${basePath}pages/projects.html">Projects</a></li>
                    <li><a href="${basePath}pages/leaderboard.html">Leaderboard</a></li>
                    <li><a href="${basePath}pages/community.html">Community</a></li>
                    <li><a href="${basePath}pages/terms.html">Terms of Service</a></li>
                    <li><a href="${basePath}pages/privacy.html">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 Pixel Phantoms. All rights reserved.</p>
        </div>
    </footer>
    `;

    document.getElementById('footer-placeholder').innerHTML = footerHTML;
}

// Export function for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderFooter };
}

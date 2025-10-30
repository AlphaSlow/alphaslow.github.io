// This script handles loading external HTML files (header and footer)
// and also manages the functionality for the two carousels on the index page.

const languageMap = {
    'other': { en: 'Other', ko: '기타' },
    'faq': { en: 'FAQ', ko: '자주 묻는 질문' },
    'contact': { en: 'Contact', ko: '문의', isAnchor: true },
    'index': { en: 'Home', ko: '홈' },
    'practice': { en: 'Practice', ko: '연습' },
    'movies1': { en: 'Movies 1', ko: '영화 1' },
    'movies2': { en: 'Movies 2', ko: '영화 2' }
};

// Function to fetch and insert HTML content
document.addEventListener('DOMContentLoaded', function() {
    // Fetch and insert the header
    fetch('/header.html')
        .then(response => response.text())
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                updateAllLinks(); // Call the updated function after header loads
            }
        })
        .catch(error => console.error('Error loading header:', error));

    // Fetch and insert the footer
    fetch('/footer.html')
        .then(response => response.text())
        .then(data => {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
                updateAllLinks(); // Call the updated function after footer loads
            }
        })
        .catch(error => console.error('Error loading footer:', error));

    // Initialize the carousels after the DOM is loaded
    initializeCarousels();

    // Call the function again just in case there are links outside of the header/footer.
    updateAllLinks();

    //Only used by FAQ page.
    initializeFaqAccordion()

});

/**
 * Updates all internal links on the page based on the current language.
 * It also handles the language switcher link logic.
 */
function updateAllLinks() {
    const isEnglishPage = window.location.pathname.includes('_en.html');
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        let href = link.getAttribute('href');
        if (!href) return;

        // Handle language switcher link separately
        if (link.closest('#language-switcher')) {
            let targetPage = window.location.pathname.split('/').pop();
            let newFlag, newText, newTitle;

            if (isEnglishPage) {
                targetPage = targetPage.replace('_en.html', '.html');
                newFlag = '/images/ko_flag.png';
                newText = '한국어';
                newTitle = '한국어 페이지로 이동';
            } else {
                const parts = targetPage.split('.html');
                targetPage = `${parts[0]}_en.html${parts[1] || ''}`;
                newFlag = '/images/en_flag.png';
                newText = 'English';
                newTitle = 'Switch to English';
            }

            link.href = targetPage;
            const flagImg = link.querySelector('.language-flag');
            const langText = link.querySelector('.language-text');
            if (flagImg) flagImg.src = newFlag;
            if (langText) langText.textContent = newText;
            link.title = newTitle;
            return;
        }

        // --- Core Fix ---
        // Separate URL modification from text modification

        // Only process internal HTML links
        if (!href.startsWith('http') && !href.startsWith('#') && href.includes('.html')) {
            let pageName = href.split('/').pop().split('.')[0].replace('_en', '');

            // First, modify the URL regardless of the text
            if (isEnglishPage) {
                if (!href.includes('_en.html')) {
                    link.href = href.replace('.html', '_en.html');
                }
            } else {
                if (href.includes('_en.html')) {
                    link.href = href.replace('_en.html', '.html');
                }
            }

            // Then, check if the link is a navigation link and has a mapping to change its text
            if (link.classList.contains('nav-link') || link.classList.contains('dropdown-link')) {
                // Use a specific key for the contact link, otherwise use the filename
                const translationKey = link.classList.contains('contact-link') ? 'contact' : pageName;
                if (languageMap[translationKey]) {
                    link.textContent = isEnglishPage ? languageMap[translationKey].en : languageMap[translationKey].ko;
                }
            }
        }
    });
}

// Function to toggle the mobile menu's active state
function toggleMenu() {
    const navList = document.getElementById('mobile-nav-list');
    navList.classList.toggle('active');
}

// ===========================================
// Carousel Functionality for both carousels
// ===========================================
function initializeCarousels() {
    // Course carousel logic
    const coursesCarousel = document.getElementById('coursesCarousel');
    const prevCourseBtn = document.getElementById('prev-course-btn');
    const nextCourseBtn = document.getElementById('next-course-btn');

    if (coursesCarousel && prevCourseBtn && nextCourseBtn) {
        const totalCourses = coursesCarousel.children.length;
        const visibleCourses = 3; // Number of courses visible at a time
        let currentCourseIndex = 0;

        // Function to update the course carousel position
        const updateCourseCarousel = () => {
            const courseWidthWithGap = coursesCarousel.children[0].offsetWidth + 20; // 20px gap
            const offset = -currentCourseIndex * courseWidthWithGap;
            coursesCarousel.style.transform = `translateX(${offset}px)`;
            updateCourseButtons();
        };

        // Function to handle course carousel button enabling/disabling
        const updateCourseButtons = () => {
            prevCourseBtn.disabled = (currentCourseIndex === 0);
            nextCourseBtn.disabled = (currentCourseIndex >= totalCourses - visibleCourses);
        };

        // Event listeners for course carousel buttons
        nextCourseBtn.addEventListener('click', () => {
            if (currentCourseIndex < totalCourses - visibleCourses) {
                currentCourseIndex++;
                updateCourseCarousel();
            }
        });

        prevCourseBtn.addEventListener('click', () => {
            if (currentCourseIndex > 0) {
                currentCourseIndex--;
                updateCourseCarousel();
            }
        });

        // Handle responsiveness for the course carousel
        window.addEventListener('resize', () => {
            updateCourseCarousel();
        });

        // Initial update
        updateCourseCarousel();
    }

    // Book carousel logic
    const bookCarousel = document.getElementById('bookCarousel');
    const prevBookBtn = document.getElementById('prev-book-btn');
    const nextBookBtn = document.getElementById('next-book-btn');

    if (bookCarousel && prevBookBtn && nextBookBtn) {
        const totalBookPages = bookCarousel.children.length;
        const visibleBookPages = 2; // Show 2 pages at a time
        let currentBookIndex = 0;

        // Function to update the book carousel position
        const updateBookCarousel = () => {
            const pageWidthWithGap = bookCarousel.children[0].offsetWidth;
            const offset = -currentBookIndex * pageWidthWithGap;
            bookCarousel.style.transform = `translateX(${offset}px)`;
            updateBookButtons();
        };

        // Function to handle book carousel button enabling/disabling
        const updateBookButtons = () => {
            prevBookBtn.disabled = (currentBookIndex === 0);
            nextBookBtn.disabled = (currentBookIndex >= totalBookPages - visibleBookPages);
        };

        // Event listeners for book carousel buttons
        nextBookBtn.addEventListener('click', () => {
            if (currentBookIndex < totalBookPages - visibleBookPages) {
                currentBookIndex += visibleBookPages; // Jump 2 pictures
                updateBookCarousel();
            }
        });

        prevBookBtn.addEventListener('click', () => {
            if (currentBookIndex > 0) {
                currentBookIndex -= visibleBookPages; // Jump back 2 pictures
                if (currentBookIndex < 0) {
                    currentBookIndex = 0;
                }
                updateBookCarousel();
            }
        });

        // Handle responsiveness for the book carousel
        window.addEventListener('resize', () => {
            updateBookCarousel();
        });

        // Initial update
        updateBookCarousel();
    }
}

// ===========================================
// FAQ Accordion Functionality
// ===========================================
function initializeFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            // Toggle the 'active' class on the clicked question
            question.classList.toggle('active');

            const answer = question.nextElementSibling;
            if (question.classList.contains('active')) {
                // Set max-height to the scrollHeight to show the answer
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                // Set max-height to 0 to hide the answer
                answer.style.maxHeight = '0';
            }
        });
    });
}

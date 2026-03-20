document.addEventListener('DOMContentLoaded', () => {
    /* --- Navbar Scroll Effect --- */
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* --- Mobile Navigation --- */
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const closeBtn  = document.querySelector('.mobile-nav-close');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileLinks = document.querySelectorAll('.mobile-nav a');

    mobileBtn.addEventListener('click', () => { mobileNav.classList.add('open'); });
    closeBtn.addEventListener('click',  () => { mobileNav.classList.remove('open'); });
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => { mobileNav.classList.remove('open'); });
    });

    /* --- Scroll Reveal Animations --- */
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint  = 100;
        revealElements.forEach(element => {
            if (element.getBoundingClientRect().top < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    };
    revealOnScroll();
    window.addEventListener('scroll', revealOnScroll);

    /* --- Active Navigation Link Update --- */
    const sections = document.querySelectorAll('section');
    const navLinks  = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (scrollY >= section.offsetTop - 200) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

});

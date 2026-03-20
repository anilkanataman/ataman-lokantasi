document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    const isHomePage = () => {
        return currentPath.endsWith('/') || currentPath.endsWith('/index.html') || currentPath === '/';
    };

    const getNavigationType = () => {
        const [navigationEntry] = window.performance.getEntriesByType('navigation');
        return navigationEntry ? navigationEntry.type : 'navigate';
    };

    const resetScrollPosition = ({ forceHome = false } = {}) => {
        if (!isHomePage()) {
            return;
        }

        if (forceHome && window.location.hash) {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }

        if (forceHome || !window.location.hash) {
            window.scrollTo(0, 0);
        }
    };

    const getHashTarget = () => {
        if (!isHomePage() || !window.location.hash) {
            return null;
        }

        const targetId = decodeURIComponent(window.location.hash.slice(1));
        return document.getElementById(targetId);
    };

    const alignHashTarget = ({ behavior = 'auto' } = {}) => {
        const target = getHashTarget();

        if (!target) {
            return;
        }

        const targetStyles = window.getComputedStyle(target);
        const scrollMarginTop = Number.parseFloat(targetStyles.scrollMarginTop) || 0;
        const targetTop = window.scrollY + target.getBoundingClientRect().top - scrollMarginTop;

        window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior
        });
    };

    const scheduleHashAlignment = () => {
        if (shouldForceHomeOnLoad || !window.location.hash) {
            return;
        }

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                alignHashTarget();
            });
        });
    };

    const navigationType = getNavigationType();
    const shouldForceHomeOnLoad = navigationType === 'reload';

    if (currentFile === 'hikayemiz.html' && navigationType === 'reload') {
        window.location.replace('index.html');
        return;
    }

    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
    window.addEventListener('load', () => {
        resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
        window.requestAnimationFrame(() => {
            resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
        });
        scheduleHashAlignment();
    });
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            return;
        }

        resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
        scheduleHashAlignment();
    });
    window.addEventListener('hashchange', () => {
        window.requestAnimationFrame(() => {
            alignHashTarget({ behavior: 'smooth' });
        });
    });

    /* --- Navbar Scroll Effect --- */
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        const updateNavbarOnScroll = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        updateNavbarOnScroll();
        window.addEventListener('scroll', updateNavbarOnScroll);
    }

    /* --- Mobile Navigation --- */
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const closeBtn  = document.querySelector('.mobile-nav-close');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileLinks = document.querySelectorAll('.mobile-nav a');

    const setMobileNavState = isOpen => {
        if (!mobileBtn || !mobileNav) {
            return;
        }

        mobileNav.classList.toggle('open', isOpen);
        mobileNav.setAttribute('aria-hidden', String(!isOpen));
        mobileBtn.setAttribute('aria-expanded', String(isOpen));
    };

    if (mobileBtn && closeBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => { setMobileNavState(true); });
        closeBtn.addEventListener('click', () => { setMobileNavState(false); });
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => { setMobileNavState(false); });
        });

        window.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                setMobileNavState(false);
            }
        });
    }

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
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navLinks = Array.from(document.querySelectorAll('.nav-links a'));

    if (sections.length && navLinks.length) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const normalizePath = path => {
            if (!path || path === '/') {
                return 'index.html';
            }

            return path.split('/').pop();
        };

        const getLinkTarget = link => {
            const href = link.getAttribute('href');

            if (!href || href === '#') {
                return null;
            }

            if (href.startsWith('#')) {
                return { path: currentPage, hash: href.slice(1) };
            }

            const [path, hash] = href.split('#');
            return { path: normalizePath(path), hash: hash || '' };
        };

        const updateActiveNav = () => {
            let currentSectionId = sections[0].id;

            sections.forEach(section => {
                if (window.scrollY >= section.offsetTop - 200) {
                    currentSectionId = section.id;
                }
            });

            navLinks.forEach(link => {
                const target = getLinkTarget(link);
                const isActive = target &&
                    target.path === currentPage &&
                    target.hash === currentSectionId;

                link.classList.toggle('active', Boolean(isActive));
            });
        };

        updateActiveNav();
        window.addEventListener('scroll', updateActiveNav);
    }

});

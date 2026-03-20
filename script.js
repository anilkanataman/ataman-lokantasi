document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    const pendingSectionStorageKey = 'ataman_pending_section';
    const sectionQueryParam = 'section';
    const rootElement = document.documentElement;
    const currentUrl = new URL(window.location.href);
    const navbar = document.querySelector('.navbar');
    const sectionEntryNavbarClass = 'section-entry-nav';
    let pendingSectionHandled = false;

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

    const getPendingSection = () => {
        return currentUrl.searchParams.get(sectionQueryParam) ||
            window.sessionStorage.getItem(pendingSectionStorageKey) ||
            (window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '');
    };

    const clearPendingSection = () => {
        window.sessionStorage.removeItem(pendingSectionStorageKey);
    };

    const getSectionTarget = () => {
        const pendingSection = getPendingSection();

        if (!isHomePage() || !pendingSection) {
            return null;
        }

        return document.getElementById(pendingSection);
    };

    const alignSectionTarget = ({ behavior = 'auto' } = {}) => {
        const target = getSectionTarget();

        if (!target) {
            return;
        }

        const navbarOffset = navbar ? Math.max(Math.round(navbar.getBoundingClientRect().height) - 2, 0) : 0;
        const targetTop = window.scrollY + target.getBoundingClientRect().top - navbarOffset;

        window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior
        });
    };

    const setScrollBehavior = behavior => {
        rootElement.style.scrollBehavior = behavior;
    };

    const getIndexHashFromHref = href => {
        try {
            const url = new URL(href, window.location.href);
            const targetFile = url.pathname.split('/').pop() || 'index.html';

            if (targetFile === 'index.html' && url.hash) {
                return {
                    path: `${url.pathname}${url.search}`,
                    sectionId: decodeURIComponent(url.hash.slice(1))
                };
            }
        } catch (_error) {
            return null;
        }

        return null;
    };

    const getSectionTargetFromLink = link => {
        const dataSection = link.dataset.section;

        if (dataSection) {
            return dataSection;
        }

        const targetIndexHash = getIndexHashFromHref(link.href);
        return targetIndexHash ? targetIndexHash.sectionId : '';
    };

    const persistPendingSection = sectionId => {
        if (sectionId) {
            window.sessionStorage.setItem(pendingSectionStorageKey, sectionId);
            return;
        }

        clearPendingSection();
    };

    const clearSectionQuery = () => {
        if (!currentUrl.searchParams.has(sectionQueryParam)) {
            return;
        }

        currentUrl.searchParams.delete(sectionQueryParam);
        const cleanedSearch = currentUrl.searchParams.toString();
        const cleanedUrl = `${currentUrl.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}${window.location.hash}`;
        window.history.replaceState(null, '', cleanedUrl);
    };

    const finalizeSectionAlignment = () => {
        if (pendingSectionHandled) {
            return;
        }

        pendingSectionHandled = true;
        clearPendingSection();
        clearSectionQuery();
        setScrollBehavior('');

        if (navbar) {
            navbar.classList.remove(sectionEntryNavbarClass);
        }
    };

    const primeNavbarForSectionEntry = () => {
        if (!navbar || !isHomePage() || shouldForceHomeOnLoad || !getPendingSection()) {
            return;
        }

        navbar.classList.add(sectionEntryNavbarClass);
        navbar.classList.add('scrolled');
    };

    const scheduleSectionAlignment = ({ smooth = false } = {}) => {
        const activeSection = getPendingSection();

        if (shouldForceHomeOnLoad || !activeSection) {
            return;
        }

        setScrollBehavior('auto');

        const runAlignment = delay => {
            window.setTimeout(() => {
                alignSectionTarget({ behavior: smooth && delay === 0 ? 'smooth' : 'auto' });
            }, delay);
        };

        [0, 80, 180].forEach(runAlignment);
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                alignSectionTarget({ behavior: 'auto' });
            });
        });

        window.setTimeout(finalizeSectionAlignment, 260);
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

    primeNavbarForSectionEntry();

    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', event => {
            const explicitSectionTarget = getSectionTargetFromLink(link);
            const isSectionEntryLink = Boolean(explicitSectionTarget);
            const targetIndexHash = getIndexHashFromHref(link.href);

            if (isSectionEntryLink) {
                persistPendingSection(explicitSectionTarget);

                if (!isHomePage()) {
                    event.preventDefault();
                    window.location.assign('index.html');
                    return;
                }
            } else {
                clearPendingSection();
            }

            if (!targetIndexHash) {
                return;
            }

            const isSamePageHashLink = link.getAttribute('href').startsWith('#');
            if (!isSamePageHashLink && isHomePage()) {
                event.preventDefault();
                window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${targetIndexHash.sectionId}`);
                scheduleSectionAlignment({ smooth: true });
            }
        });
    });

    resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
    window.addEventListener('load', () => {
        resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
        window.requestAnimationFrame(() => {
            resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
        });
        scheduleSectionAlignment();

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                scheduleSectionAlignment();
            });
        }
    });
    window.addEventListener('pageshow', event => {
        if (!event.persisted) {
            return;
        }

        resetScrollPosition({ forceHome: shouldForceHomeOnLoad });
        scheduleSectionAlignment();
    });
    window.addEventListener('hashchange', () => {
        window.requestAnimationFrame(() => {
            setScrollBehavior('');
            scheduleSectionAlignment({ smooth: true });
        });
    });

    /* --- Navbar Scroll Effect --- */
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
    const mapEmbed = document.querySelector('.map-embed');
    const mapWrapper = document.querySelector('.map-wrapper.reveal-right');
    const contactMapLink = document.querySelector('#contact a[href*="google.com/maps"]');
    const contactAddressItem = contactMapLink ? contactMapLink.closest('.info-item') : null;

    if (mapEmbed) {
        mapEmbed.setAttribute('loading', 'eager');
    }

    if (mapWrapper) {
        mapWrapper.classList.add('active');
    }

    if (contactMapLink && contactAddressItem) {
        contactMapLink.setAttribute('target', '_self');

        const openContactMap = () => {
            window.location.assign(contactMapLink.href);
        };

        contactAddressItem.classList.add('info-item-clickable');
        contactAddressItem.setAttribute('role', 'link');
        contactAddressItem.setAttribute('tabindex', '0');
        contactAddressItem.setAttribute('aria-label', 'Tarihi Ataman Lokantasi konumunu Google Haritalar\'da ac');

        contactAddressItem.addEventListener('click', event => {
            if (event.target.closest('a')) {
                return;
            }

            openContactMap();
        });

        contactAddressItem.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            openContactMap();
        });
    }

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

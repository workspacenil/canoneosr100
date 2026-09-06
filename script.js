/**
 * CANON EOS R100 - PRODUCT LANDING PAGE SCRIPTS
 * Incluye animación interactiva 3D al hacer scroll (Scrub estilo Apple)
 */

// Forzar que la página siempre empiece desde arriba del todo al recargarse o reiniciarse
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    initIntroPreloader();
    initHeaderScroll();
    initMobileMenu();
    initHeroRotatorScrubber();
    initScrollVideoScrubber();
    initSpecsTabs();
    initGalleryFilter();
    initLightbox();
    initFaqAccordion();
    initSmoothScrollActive();
    initDistributorsModal();
    initActionFanAnimation();
    initCustomCursorAndVideo();
    initGlobalScrollProgress();
    initAppleSatisfyingEffects();
});

/* --------------------------------------------------------------------------
   1. Header Sticky con Efecto Blur al hacer Scroll
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Menú Móvil Desplegable
   -------------------------------------------------------------------------- */
function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (!toggle || !navMenu) return;

    toggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
    });

    // Cerrar menú automáticamente al hacer clic en un enlace
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/* --------------------------------------------------------------------------
   2.5. Rotación 360° Interactiva al Hacer Scroll (Hero Rotator con Canvas)
   -------------------------------------------------------------------------- */
function initHeroRotatorScrubber() {
    const track = document.getElementById('rotatorTrack');
    const canvas = document.getElementById('heroRotatingCanvas');
    if (!track || !canvas) return;

    const ctx = canvas.getContext('2d');
    const TOTAL_FRAMES = 96;
    const frameImages = new Array(TOTAL_FRAMES);

    const progressFill = document.getElementById('rotatorProgressFill');
    const angleText = document.getElementById('rotatorAngleText');

    const badgeFront = document.getElementById('rotatorBadge1');
    const badgeSide = document.getElementById('rotatorBadge2');
    const badgeBack = document.getElementById('rotatorBadge3');
    const badgeTop = document.getElementById('rotatorBadge4');

    let currentFrame = 0;
    let targetFrame = 0;
    let isTicking = false;

    function getFrameSrc(index) {
        const num = String(index + 1).padStart(3, '0');
        return `assets/hero_frames/frame_${num}.webp`;
    }

    function drawFrame(index) {
        if (!ctx || !canvas) return;
        index = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));

        let img = frameImages[index];
        if (!img || !img.complete || img.naturalWidth === 0) {
            for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
                const prev = frameImages[index - offset];
                if (prev && prev.complete && prev.naturalWidth > 0) {
                    img = prev;
                    break;
                }
                const next = frameImages[index + offset];
                if (next && next.complete && next.naturalWidth > 0) {
                    img = next;
                    break;
                }
            }
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }

    function preloadFrames() {
        const first = new Image();
        first.src = getFrameSrc(0);
        first.onload = () => {
            frameImages[0] = first;
            drawFrame(0);

            for (let i = 1; i < TOTAL_FRAMES; i++) {
                const img = new Image();
                img.src = getFrameSrc(i);
                img.onload = () => {
                    frameImages[i] = img;
                    if (Math.round(currentFrame) === i) {
                        drawFrame(i);
                    }
                };
            }
        };
    }

    function updateBadgesAndAngle(progress) {
        const deg = Math.round(progress * 360);
        if (angleText) angleText.textContent = `${deg}°`;
        if (progressFill) progressFill.style.width = `${progress * 100}%`;

        if (badgeFront) badgeFront.classList.toggle('is-active', (deg >= 0 && deg < 60) || deg >= 320);
        if (badgeSide)  badgeSide.classList.toggle('is-active', deg >= 70 && deg < 150);
        if (badgeBack)  badgeBack.classList.toggle('is-active', deg >= 160 && deg < 240);
        if (badgeTop)   badgeTop.classList.toggle('is-active', deg >= 250 && deg < 315);
    }

    function calculateTargetFrame() {
        const rect = track.getBoundingClientRect();
        const maxScrollable = rect.height - window.innerHeight;
        if (maxScrollable <= 0) return 0;

        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / maxScrollable));

        updateBadgesAndAngle(progress);
        return progress * (TOTAL_FRAMES - 1);
    }

    function smoothRenderLoop() {
        targetFrame = calculateTargetFrame();
        currentFrame += (targetFrame - currentFrame) * 0.11;

        drawFrame(Math.round(currentFrame));

        if (Math.abs(targetFrame - currentFrame) > 0.01) {
            requestAnimationFrame(smoothRenderLoop);
            isTicking = true;
        } else {
            isTicking = false;
        }
    }

    // Detección de parada brusca súper satisfactoria tras scroll rápido
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let brakeTimer = null;
    let peakVelocity = 0;
    const stage = document.querySelector('.rotator-stage');

    function triggerSpringBrake() {
        if (!stage) return;
        stage.classList.remove('hard-brake');
        void stage.offsetWidth; // Forzar reflujo para reiniciar animación
        stage.classList.add('hard-brake');
        setTimeout(() => {
            stage.classList.remove('hard-brake');
        }, 750);
    }

    function onScroll() {
        const now = performance.now();
        const currentY = window.scrollY;
        const dt = Math.max(1, now - lastScrollTime);
        const dy = Math.abs(currentY - lastScrollY);
        const velocity = dy / dt;

        if (velocity > peakVelocity) {
            peakVelocity = velocity;
        }

        lastScrollY = currentY;
        lastScrollTime = now;

        clearTimeout(brakeTimer);
        brakeTimer = setTimeout(() => {
            // Si venía bajando con velocidad alta (> 1.4 px/ms) y se detiene de golpe
            if (peakVelocity > 1.3) {
                triggerSpringBrake();
            }
            peakVelocity = 0;
        }, 60);

        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(smoothRenderLoop);
        }
    }

    // Clics interactivos en los badges para girar automáticamente al ángulo
    function scrollToAngle(targetProgress) {
        const rect = track.getBoundingClientRect();
        const maxScrollable = rect.height - window.innerHeight;
        const targetScroll = track.offsetTop + (maxScrollable * targetProgress);
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    if (badgeFront) badgeFront.addEventListener('click', () => scrollToAngle(0.0));
    if (badgeSide)  badgeSide.addEventListener('click', () => scrollToAngle(0.28));
    if (badgeBack)  badgeBack.addEventListener('click', () => scrollToAngle(0.55));
    if (badgeTop)   badgeTop.addEventListener('click', () => scrollToAngle(0.80));

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        targetFrame = calculateTargetFrame();
        currentFrame = targetFrame;
        drawFrame(Math.round(currentFrame));
    });

    preloadFrames();
}

/* --------------------------------------------------------------------------
   3. Animación 3D por Fotogramas al Hacer Scroll (Scrub Estilo Apple con Canvas)
   -------------------------------------------------------------------------- */
function initScrollVideoScrubber() {
    const canvas = document.getElementById('scrollScrubCanvas');
    const track = document.getElementById('scrollTrack');
    const storyCards = document.querySelectorAll('.floating-story-card');
    const phaseBtns = document.querySelectorAll('.phase-btn');
    const hudProgressFill = document.getElementById('hudProgressFill');
    const btnAutoPlay = document.getElementById('btnAutoPlayToggle');
    const autoPlayText = document.getElementById('autoPlayText');
    const hudTimeDisplay = document.getElementById('hudTimeDisplay');
    const fallbackVideo = document.getElementById('scrollScrubVideo');

    if (!track || (!canvas && !fallbackVideo)) return;

    const TOTAL_FRAMES = 96;
    const FPS = 24.0;
    const DURATION = TOTAL_FRAMES / FPS; // 4.0 segundos
    const frameImages = new Array(TOTAL_FRAMES);

    let targetFrame = 0;
    let currentFrame = 0;
    let lastDrawnIndex = -1;
    let isAutoPlaying = false;
    let autoPlayStartTime = 0;
    let autoPlayStartFrame = 0;

    const playIcon = btnAutoPlay?.querySelector('.icon-play');
    const pauseIcon = btnAutoPlay?.querySelector('.icon-pause');
    const ctx = canvas ? canvas.getContext('2d') : null;

    function getFrameSrc(index) {
        const num = String(index + 1).padStart(3, '0');
        return `assets/frames/frame_${num}.webp`;
    }

    function drawFrame(index) {
        if (!ctx || !canvas) return;
        index = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));

        let img = frameImages[index];
        // Si el fotograma exacto no ha cargado aún, buscar el fotograma cargado más cercano
        if (!img || !img.complete || img.naturalWidth === 0) {
            for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
                const prev = frameImages[index - offset];
                if (prev && prev.complete && prev.naturalWidth > 0) {
                    img = prev;
                    break;
                }
                const next = frameImages[index + offset];
                if (next && next.complete && next.naturalWidth > 0) {
                    img = next;
                    break;
                }
            }
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            lastDrawnIndex = index;
        }
    }

    function preloadFrames() {
        // 1. Carga inmediata del primer fotograma para renderizado instantáneo
        const firstImg = new Image();
        firstImg.src = getFrameSrc(0);
        firstImg.onload = () => {
            frameImages[0] = firstImg;
            drawFrame(0);
            updateHUD(0);

            // 2. Precarga asíncrona de los 95 fotogramas restantes en memoria
            for (let i = 1; i < TOTAL_FRAMES; i++) {
                const img = new Image();
                img.src = getFrameSrc(i);
                img.onload = () => {
                    frameImages[i] = img;
                    if (Math.round(currentFrame) === i) {
                        drawFrame(i);
                    }
                };
            }
        };
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    }

    function updateHUD(progress) {
        if (hudProgressFill) {
            hudProgressFill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
        }

        if (hudTimeDisplay) {
            const currentTime = Math.min(DURATION, Math.max(0, progress * DURATION));
            hudTimeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(DURATION)}`;
        }

        // Tarjetas de información según su rango
        storyCards.forEach(card => {
            const rangeStr = card.getAttribute('data-range');
            if (!rangeStr) return;
            const [min, max] = rangeStr.split(',').map(parseFloat);
            if (progress >= min && progress <= max) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Indicador activo en los botones de fase
        let activeIdx = 0;
        if (progress > 0.8) activeIdx = 3;
        else if (progress > 0.55) activeIdx = 2;
        else if (progress > 0.25) activeIdx = 1;

        phaseBtns.forEach((btn, idx) => {
            if (idx === activeIdx) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Listener de scroll de alta precisión
    function onScroll() {
        if (isAutoPlaying) {
            stopAutoPlay();
        }

        const rect = track.getBoundingClientRect();
        const maxScroll = track.offsetHeight - window.innerHeight;
        if (maxScroll <= 0) return;

        const rawProgress = -rect.top / maxScroll;
        const progress = Math.max(0, Math.min(1, rawProgress));

        // Solo actualizar si el contenedor está en la vista
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
            targetFrame = progress * (TOTAL_FRAMES - 1);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Loop de renderizado suave a 60 FPS (Linear Interpolation)
    function renderLoop(timestamp) {
        if (isAutoPlaying) {
            const elapsed = (timestamp - autoPlayStartTime) / 1000;
            const currentSecond = (autoPlayStartFrame / FPS) + elapsed;
            if (currentSecond >= DURATION) {
                stopAutoPlay();
                currentFrame = TOTAL_FRAMES - 1;
                targetFrame = TOTAL_FRAMES - 1;
            } else {
                currentFrame = (currentSecond / DURATION) * (TOTAL_FRAMES - 1);
                targetFrame = currentFrame;
            }
        } else {
            // Suavizado cinematográfico continuo
            const diff = targetFrame - currentFrame;
            if (Math.abs(diff) > 0.005) {
                currentFrame += diff * 0.12;
            } else {
                currentFrame = targetFrame;
            }
        }

        const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrame)));
        if (frameIndex !== lastDrawnIndex) {
            drawFrame(frameIndex);
        }

        const progress = currentFrame / (TOTAL_FRAMES - 1);
        updateHUD(progress);

        requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    // Salto suave al hacer clic en los botones de fase
    phaseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAutoPlaying) stopAutoPlay();
            const phaseVal = parseFloat(btn.getAttribute('data-phase'));
            const maxScroll = track.offsetHeight - window.innerHeight;
            const targetY = track.offsetTop + (phaseVal * maxScroll);

            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
        });
    });

    // Control de Reproducción Automática (Auto Play)
    function startAutoPlay() {
        isAutoPlaying = true;
        autoPlayStartTime = performance.now();
        if (currentFrame >= TOTAL_FRAMES - 1) {
            currentFrame = 0;
            targetFrame = 0;
        }
        autoPlayStartFrame = currentFrame;
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
        if (autoPlayText) autoPlayText.textContent = 'Pausar';
    }

    function stopAutoPlay() {
        isAutoPlaying = false;
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (autoPlayText) autoPlayText.textContent = 'Auto Play';
    }

    if (btnAutoPlay) {
        btnAutoPlay.addEventListener('click', () => {
            if (isAutoPlaying) {
                stopAutoPlay();
            } else {
                startAutoPlay();
            }
        });
    }

    // Iniciar precarga de los fotogramas
    preloadFrames();
}

/* --------------------------------------------------------------------------
   4. Pestañas de Especificaciones Técnicas
   -------------------------------------------------------------------------- */
function initSpecsTabs() {
    const tabButtons = document.querySelectorAll('.spec-tab-btn');
    const tabPanels = document.querySelectorAll('.spec-tab-panel');

    if (!tabButtons.length) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(`tab-${target}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

/* --------------------------------------------------------------------------
   5. Filtros de la Galería de Fotos
   -------------------------------------------------------------------------- */
function initGalleryFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const photoCards = document.querySelectorAll('.photo-card');

    if (!filterButtons.length) return;

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            photoCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

/* --------------------------------------------------------------------------
   6. Lightbox de Fotos de Muestra
   -------------------------------------------------------------------------- */
function initLightbox() {
    const modal = document.getElementById('lightboxModal');
    const backdrop = document.getElementById('lightboxBackdrop');
    const closeBtn = document.getElementById('lightboxClose');
    const imgElement = document.getElementById('lightboxImg');
    const captionElement = document.getElementById('lightboxCaption');
    const photoCards = document.querySelectorAll('.photo-card');

    if (!modal) return;

    function openLightbox(src, title, exif) {
        imgElement.src = src;
        imgElement.alt = title;
        captionElement.innerHTML = `<strong>${title}</strong> — <small>${exif}</small>`;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        imgElement.src = '';
        document.body.style.overflow = '';
    }

    photoCards.forEach(card => {
        card.addEventListener('click', () => {
            const img = card.querySelector('img');
            const title = card.querySelector('h4')?.textContent || '';
            const exif = card.querySelector('.photo-exif')?.textContent || '';
            if (img) openLightbox(img.src, title, exif);
        });
    });

    closeBtn?.addEventListener('click', closeLightbox);
    backdrop?.addEventListener('click', closeLightbox);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeLightbox();
        }
    });
}

/* --------------------------------------------------------------------------
   7. Acordeón de FAQ
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Cerrar otros acordeones abiertos
            faqItems.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
            });

            if (!isActive) {
                item.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/* --------------------------------------------------------------------------
   8. Navegación Activa por Scroll
   -------------------------------------------------------------------------- */
function initSmoothScrollActive() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   9. Modal / Alerta de Distribuidores Locales
   -------------------------------------------------------------------------- */
function initDistributorsModal() {
    const btnDistribuidores = document.getElementById('btnDistribuidores');
    if (!btnDistribuidores) return;

    btnDistribuidores.addEventListener('click', () => {
        alert("Encuentra la Canon EOS R100 en distribuidores oficiales autorizados: El Corte Inglés, FNAC, MediaMarkt, Casanova Foto, Fotocasión y tiendas de fotografía especializadas.");
    });
}

/* --------------------------------------------------------------------------
   10. Animación de la Galería en Abanico (Action Fan)
   -------------------------------------------------------------------------- */
function initActionFanAnimation() {
    const fanSection = document.getElementById('action-fan');
    if (!fanSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                fanSection.classList.add('is-visible');
                // observer.unobserve(fanSection); // Opcional: descomentar si quieres que solo se anime la primera vez
            } else {
                fanSection.classList.remove('is-visible'); // Se reinicia cuando sale de la pantalla
            }
        });
    }, {
        threshold: 0.3 // Dispara la animación cuando el 30% de la sección es visible
    });

    observer.observe(fanSection);
}

/* --------------------------------------------------------------------------
   11. Animación y Custom Cursor para Nuevo Video Interactivo
   -------------------------------------------------------------------------- */
function initCustomCursorAndVideo() {
    const section = document.getElementById('new-animation');
    const cursorDot = document.getElementById('customCursorDot');
    const cursorRing = document.getElementById('customCursorRing');
    const liquidVideo = document.getElementById('liquidGlassVideo');
    
    if (!section || !cursorDot || !cursorRing) return;

    // Fade-in on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                section.classList.add('is-visible');
            }
        });
    }, { threshold: 0.2 });
    observer.observe(section);

    // Cuando el video termina, espera 10 segundos exactos para volver a reproducirse
    if (liquidVideo) {
        liquidVideo.addEventListener('ended', () => {
            setTimeout(() => {
                liquidVideo.currentTime = 0;
                liquidVideo.play().catch(e => {
                    console.log("Reanudando video tras pausa de 10s:", e);
                });
            }, 10000); // Pausa de 10 segundos
        });
    }

    // Custom Cursor Logic with LERP for smooth delay
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let isHovering = false;

    section.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Immediate position for the dot
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    section.addEventListener('mouseenter', () => {
        isHovering = true;
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
        section.classList.add('cursor-active');
    });

    section.addEventListener('mouseleave', () => {
        isHovering = false;
        cursorDot.style.opacity = '0';
        cursorRing.style.opacity = '0';
        section.classList.remove('cursor-active');
    });

    // RequestAnimationFrame for smooth ring follow
    function renderCursor() {
        if (isHovering) {
            // LERP for smooth follow effect
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
        }
        requestAnimationFrame(renderCursor);
    }
    renderCursor();
}

/* --------------------------------------------------------------------------
   12. Pantalla de Carga (Intro Video)
   -------------------------------------------------------------------------- */
function initIntroPreloader() {
    const introPreloader = document.getElementById('introPreloader');
    const introVideo = document.getElementById('introVideo');

    if (!introPreloader || !introVideo) return;

    // Bloqueamos el scroll mientras se reproduce la intro
    document.body.classList.add('no-scroll');

    const hidePreloader = () => {
        introPreloader.classList.add('is-hidden');
        document.body.classList.remove('no-scroll');
    };

    // Cuando el video acaba
    introVideo.addEventListener('ended', hidePreloader);
    
    // Si hay un error al cargar el video
    introVideo.addEventListener('error', hidePreloader);

    // Intentamos reproducir el video (los navegadores pueden bloquear el autoplay a veces)
    const playPromise = introVideo.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Autoplay fue prevenido o hubo un error
            console.log("El autoplay del video intro fue bloqueado.");
            hidePreloader();
        });
    }

    // Mecanismo de seguridad: si por alguna razón el evento 'ended' falla, ocultar la pantalla después de 3.2 segundos
    setTimeout(hidePreloader, 3200);
}

/* --------------------------------------------------------------------------
   13. Barra de Lectura Global estilo Apple Keynote
   -------------------------------------------------------------------------- */
function initGlobalScrollProgress() {
    const bar = document.getElementById('globalScrollProgress');
    if (!bar) return;

    window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        bar.style.width = `${progress}%`;
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   14. Micro-Interacciones Satisfactorias estilo Apple (Botones Magnéticos)
   -------------------------------------------------------------------------- */
function initAppleSatisfyingEffects() {
    // Efecto magnético sutil en los botones de llamada a la acción
    const magneticBtns = document.querySelectorAll('.btn-canon-primary, .btn-canon-secondary');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - btnCenterX) * 0.22;
            const deltaY = (e.clientY - btnCenterY) * 0.22;

            btn.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0px, 0px)';
        });
    });
}


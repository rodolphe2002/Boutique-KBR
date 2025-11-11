(function(){
  if (typeof window === 'undefined') return;
  function init() {
    if (!window.Lenis) return;
    const isMobile = (typeof window !== 'undefined') && (
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
      ('ontouchstart' in window && !(window.matchMedia && window.matchMedia('(pointer: fine)').matches))
    );
    const baseDuration = isMobile ? 10.0 : 7.0;
    const lenis = new window.Lenis({
      duration: baseDuration,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 1.2,
      normalizeWheel: true,
      syncTouch: true
    });
    window.lenis = lenis;

    function raf(time){
      lenis.raf(time);
      if (window.ScrollTrigger) window.ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.ScrollTrigger && typeof lenis.on === 'function') {
      try { lenis.on('scroll', () => window.ScrollTrigger.update()); } catch {}
    }

    try {
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const href = a.getAttribute('href');
          if (!href || href === '#') return;
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const isMob = (typeof window !== 'undefined') && (
              (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
              ('ontouchstart' in window && !(window.matchMedia && window.matchMedia('(pointer: fine)').matches))
            );
            const dur = isMob ? 10.0 : 7.0;
            lenis.scrollTo(target, { offset: -12, duration: dur, easing: (t) => 1 - Math.pow(1 - t, 3) });
          }
        });
      });
    } catch {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

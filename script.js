/* ============================================
   INKBLOOD STUDIO — script.js
   Animations, Interactions, Data Loading
   ============================================ */

'use strict';

/* ── 1. CUSTOM CURSOR ── */
(function initCursor() {
  const cursor      = document.getElementById('cursor');
  const cursorTrail = document.getElementById('cursorTrail');
  if (!cursor || !cursorTrail) return;

  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  function animateTrail() {
    trailX += (mouseX - trailX) * 0.1;
    trailY += (mouseY - trailY) * 0.1;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    raf = requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // Hide on mobile
  if ('ontouchstart' in window) {
    cursor.style.display = 'none';
    cursorTrail.style.display = 'none';
  }
})();


/* ── 2. NAV SCROLL BEHAVIOUR ── */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastY = y;
  }, { passive: true });
})();


/* ── 3. MOBILE MENU ── */
(function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  let open = false;

  toggle.addEventListener('click', () => {
    open = !open;
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    const spans = toggle.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      open = false;
      menu.classList.remove('open');
      document.body.style.overflow = '';
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
})();


/* ── 4. SCROLL REVEAL ── */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => observer.observe(el));
})();


/* ── 5. COUNTER ANIMATION ── */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const dur    = 1800;
      const start  = performance.now();

      function update(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / dur, 1);
        // ease out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        el.textContent = Math.floor(eased * target).toLocaleString('de-DE');
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target.toLocaleString('de-DE') + (target >= 1000 ? '+' : '');
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();


/* ── 6. LOAD ARTISTS FROM data.json ── */
(function loadArtists() {
  const grid = document.getElementById('artistsGrid');
  if (!grid) return;

  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      const artists = data.artists || [];
      const avatarColors = [
        '#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2a1a1a', '#1a2a1a'
      ];

      artists.forEach((artist, i) => {
        const card = document.createElement('div');
        card.className = 'artist-card reveal-up';
        card.style.transitionDelay = (i * 0.08) + 's';

        const tagsHTML = (artist.styles || [])
          .map(s => `<span class="artist-tag">${s}</span>`)
          .join('');

        // SVG avatar with initials
        const initials = artist.initials || artist.name.substring(0, 2).toUpperCase();
        const svgAvatar = `
          <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="28" fill="${avatarColors[i % avatarColors.length]}" stroke="rgba(196,145,42,0.4)" stroke-width="1"/>
            <text x="30" y="36" text-anchor="middle" font-family="'Cinzel Decorative', serif" font-size="14" font-weight="700" fill="#c4912a">${initials}</text>
          </svg>`;

        card.innerHTML = `
          <div class="artist-avatar">${svgAvatar}</div>
          <div class="artist-name">${artist.name}</div>
          <div class="artist-spec">${artist.specialization}</div>
          <p class="artist-bio">${artist.bio}</p>
          <div class="artist-tags">${tagsHTML}</div>
        `;

        grid.appendChild(card);
      });

      // Re-observe new elements
      const newEls = grid.querySelectorAll('.reveal-up');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      newEls.forEach(el => observer.observe(el));
    })
    .catch(() => {
      // Fallback if no server — show placeholder cards
      grid.innerHTML = `
        <div class="artist-card">
          <div class="artist-name">Artists werden geladen…</div>
          <p class="artist-bio">Bitte öffne die Website über einen lokalen Server (z.B. Live Server in VS Code).</p>
        </div>`;
    });
})();


/* ── 7. CONTACT FORM ── */
(function initForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('name');
    const email   = document.getElementById('email');
    const message = document.getElementById('message');
    let valid = true;

    // Simple validation
    [name, email, message].forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = '#8b1a1a';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) return;

    // Simulate send
    const btn = form.querySelector('.btn');
    const btnText = btn.querySelector('.btn-text');
    btnText.textContent = 'Wird gesendet…';
    btn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('show');
    }, 1200);
  });

  // Real-time field feedback
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (field.value.trim()) field.style.borderColor = '';
    });
  });
})();


/* ── 8. SMOOTH PARALLAX ON HERO ── */
(function initParallax() {
  const heroContent = document.querySelector('.hero-content');
  const heroDecos   = document.querySelectorAll('.hero-deco');
  if (!heroContent) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;

    heroContent.style.transform = `translateY(${y * 0.25}px)`;
    heroContent.style.opacity   = 1 - (y / (window.innerHeight * 0.7));

    heroDecos.forEach((d, i) => {
      d.style.transform = `translateY(calc(-50% + ${y * (0.1 + i * 0.05)}px))`;
    });
  }, { passive: true });
})();


/* ── 9. GALLERY ITEM TILT ── */
(function initGalleryTilt() {
  const items = document.querySelectorAll('.gallery-item');

  items.forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect   = item.getBoundingClientRect();
      const x      = (e.clientX - rect.left) / rect.width  - 0.5;
      const y      = (e.clientY - rect.top)  / rect.height - 0.5;
      const tiltX  = y * 8;
      const tiltY  = x * -8;
      item.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
      item.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { item.style.transition = ''; }, 600);
    });
  });
})();


/* ── 10. NAV LINK ACTIVE STATE ── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    let current = '';

    sections.forEach(section => {
      if (scrollY >= section.offsetTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.style.color = '';
      if (link.getAttribute('href') === '#' + current) {
        link.style.color = 'var(--gold)';
      }
    });
  }, { passive: true });
})();


/* ── 11. MARQUEE PAUSE ON HOVER ── */
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
})();


/* ── 12. INK DRIP CLICK EFFECT ── */
(function initInkClick() {
  document.addEventListener('click', (e) => {
    const drop = document.createElement('div');
    Object.assign(drop.style, {
      position:     'fixed',
      left:         e.clientX + 'px',
      top:          e.clientY + 'px',
      width:        '6px',
      height:       '6px',
      background:   '#c4912a',
      borderRadius: '50%',
      pointerEvents:'none',
      zIndex:       '9998',
      transform:    'translate(-50%, -50%)',
      animation:    'inkRipple 0.6s ease-out forwards',
    });

    document.body.appendChild(drop);

    // Inject animation if not already present
    if (!document.getElementById('inkRippleStyle')) {
      const style = document.createElement('style');
      style.id = 'inkRippleStyle';
      style.textContent = `
        @keyframes inkRipple {
          0%   { width: 6px; height: 6px; opacity: 1; }
          100% { width: 60px; height: 60px; opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => drop.remove(), 700);
  });
})();


/* ── 13. PAGE LOAD ANIMATION ── */
(function initPageLoad() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.6s ease';

  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });
})();


/* ── 14. TYPEWRITER FOR HERO EYEBROW ── */
(function initTypewriter() {
  const eyebrow = document.querySelector('.hero-eyebrow span:not(.eyebrow-line)');
  if (!eyebrow) return;

  const text   = eyebrow.textContent;
  const delay  = 600; // start after page loads
  eyebrow.textContent = '';

  setTimeout(() => {
    let i = 0;
    const interval = setInterval(() => {
      eyebrow.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 55);
  }, delay);
})();

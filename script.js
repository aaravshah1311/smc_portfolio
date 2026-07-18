/* ===================================================================
   Astha Desai — Portfolio interactions
=================================================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Footer year ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Theme toggle (persisted) ---------- */
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    const savedTheme = localStorage.getItem('theme') || 'dark';

    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        }
    };
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const next = isLight ? 'dark' : 'light';
            applyTheme(next);
            localStorage.setItem('theme', next);
        });
    }

    /* ---------- Mobile nav ---------- */
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const closeMenu = () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
    };
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            hamburger.classList.toggle('open');
        });
        navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    }

    /* ---------- Navbar shadow + scroll progress ---------- */
    const navbar = document.getElementById('navbar');
    const progress = document.getElementById('scrollProgress');
    const backToTop = document.getElementById('backToTop');

    const onScroll = () => {
        const y = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', y > 20);

        const docH = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = docH > 0 ? `${(y / docH) * 100}%` : '0%';

        if (backToTop) backToTop.classList.toggle('show', y > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Typing effect ---------- */
    const typedEl = document.getElementById('typed');
    if (typedEl) {
        const phrases = [
            'Cloud Engineer',
            'Cybersecurity Enthusiast',
            'AI Integrator',
            'AWS Certified Practitioner',
            'NCC Sergeant & Leader'
        ];
        let pi = 0, ci = 0, deleting = false;

        const tick = () => {
            const current = phrases[pi];
            typedEl.textContent = deleting
                ? current.substring(0, ci--)
                : current.substring(0, ci++);

            let delay = deleting ? 45 : 95;

            if (!deleting && ci === current.length + 1) {
                delay = 1600;
                deleting = true;
            } else if (deleting && ci === 0) {
                deleting = false;
                pi = (pi + 1) % phrases.length;
                delay = 350;
            }
            setTimeout(tick, delay);
        };
        tick();
    }

    /* ---------- Scroll reveal + counters + skill bars ---------- */
    const revealEls = document.querySelectorAll('.reveal');

    const animateCounter = (el) => {
        const target = parseFloat(el.dataset.target);
        const decimals = parseInt(el.dataset.decimal || '0', 10);
        const duration = 1400;
        const start = performance.now();

        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            const val = target * eased;
            el.textContent = decimals ? val.toFixed(decimals) : Math.floor(val).toString();
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = decimals ? target.toFixed(decimals) : target.toString();
        };
        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('visible');

            // stat counters
            el.querySelectorAll('.stat-num').forEach(animateCounter);
            if (el.classList.contains('stat')) {
                const num = el.querySelector('.stat-num');
                if (num) animateCounter(num);
            }

            // skill bars
            el.querySelectorAll('.bar').forEach(bar => {
                const fill = bar.querySelector('.bar-fill');
                if (fill) fill.style.width = `${bar.dataset.level}%`;
            });

            observer.unobserve(el);
        });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));

    /* ---------- Active nav link on scroll (scrollspy) ---------- */
    const sections = document.querySelectorAll('section[id], header[id]');
    const navAnchors = document.querySelectorAll('.nav-links a');

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navAnchors.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(s => spy.observe(s));

    /* ---------- Smooth anchor scrolling ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    /* ================================================================
       THREE.JS  —  two scenes
       1. Fullscreen animated particle network (#three-bg)
       2. Rotating wireframe icosahedron in the hero (#hero-3d)
       Guarded so the page still works if the CDN fails or the user
       prefers reduced motion.
    ================================================================ */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof THREE !== 'undefined' && !reduceMotion) {
        initParticleBg();
        initHero3D();
    }

    /* ---------- Scene 1: particle network background ---------- */
    function initParticleBg() {
        const canvas = document.getElementById('three-bg');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 340;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Particle field
        const COUNT = window.innerWidth < 768 ? 90 : 170;
        const positions = new Float32Array(COUNT * 3);
        const velocities = [];
        const SPREAD = 700;

        for (let i = 0; i < COUNT; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
            positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
            positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4
            ));
        }

        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({
            color: 0x8aa2ff, size: 3.2, transparent: true, opacity: 0.9,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const points = new THREE.Points(pGeo, pMat);
        scene.add(points);

        // Connecting lines
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x6c8cff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending
        });
        const lineGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(COUNT * COUNT * 3);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(lines);

        const LINK_DIST = 110;

        // Parallax on pointer
        const mouse = { x: 0, y: 0 };
        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth - 0.5);
            mouse.y = (e.clientY / window.innerHeight - 0.5);
        }, { passive: true });

        function animate() {
            requestAnimationFrame(animate);
            const pos = pGeo.attributes.position.array;

            for (let i = 0; i < COUNT; i++) {
                pos[i * 3]     += velocities[i].x;
                pos[i * 3 + 1] += velocities[i].y;
                pos[i * 3 + 2] += velocities[i].z;
                for (let a = 0; a < 3; a++) {
                    const idx = i * 3 + a;
                    if (pos[idx] > SPREAD / 2 || pos[idx] < -SPREAD / 2) {
                        velocities[i].setComponent(a, -velocities[i].getComponent(a));
                    }
                }
            }
            pGeo.attributes.position.needsUpdate = true;

            // Rebuild links between near particles
            let v = 0;
            for (let i = 0; i < COUNT; i++) {
                for (let j = i + 1; j < COUNT; j++) {
                    const dx = pos[i * 3] - pos[j * 3];
                    const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                    const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                    if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST) {
                        linePositions[v++] = pos[i * 3];
                        linePositions[v++] = pos[i * 3 + 1];
                        linePositions[v++] = pos[i * 3 + 2];
                        linePositions[v++] = pos[j * 3];
                        linePositions[v++] = pos[j * 3 + 1];
                        linePositions[v++] = pos[j * 3 + 2];
                    }
                }
            }
            lineGeo.setDrawRange(0, v / 3);
            lineGeo.attributes.position.needsUpdate = true;

            points.rotation.y += 0.0006;
            lines.rotation.y = points.rotation.y;

            camera.position.x += (mouse.x * 60 - camera.position.x) * 0.04;
            camera.position.y += (-mouse.y * 60 - camera.position.y) * 0.04;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, { passive: true });
    }

    /* ---------- Scene 2: hero wireframe icosahedron ---------- */
    function initHero3D() {
        const canvas = document.getElementById('hero-3d');
        if (!canvas) return;

        const parent = canvas.parentElement;
        const size = () => ({ w: parent.clientWidth || 400, h: parent.clientHeight || 400 });
        let { w, h } = size();

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
        camera.position.z = 4.2;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);

        const geo = new THREE.IcosahedronGeometry(1.5, 1);

        // Glowing wireframe
        const wire = new THREE.LineSegments(
            new THREE.WireframeGeometry(geo),
            new THREE.LineBasicMaterial({ color: 0x9d7bff, transparent: true, opacity: 0.85 })
        );
        scene.add(wire);

        // Soft inner solid
        const solid = new THREE.Mesh(
            geo,
            new THREE.MeshBasicMaterial({ color: 0x6c8cff, transparent: true, opacity: 0.08 })
        );
        scene.add(solid);

        // Vertex points
        const dots = new THREE.Points(
            geo,
            new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.09, transparent: true, opacity: 0.95 })
        );
        scene.add(dots);

        const mouse = { x: 0, y: 0 };
        parent.addEventListener('mousemove', (e) => {
            const r = parent.getBoundingClientRect();
            mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
            mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        }, { passive: true });

        function animate() {
            requestAnimationFrame(animate);
            wire.rotation.y += 0.004;
            wire.rotation.x += 0.0016;
            solid.rotation.copy(wire.rotation);
            dots.rotation.copy(wire.rotation);

            const targetY = mouse.x * 0.5;
            const targetX = mouse.y * 0.5;
            scene.rotation.y += (targetY - scene.rotation.y) * 0.05;
            scene.rotation.x += (targetX - scene.rotation.x) * 0.05;

            const s = 1 + Math.sin(Date.now() * 0.0016) * 0.04;
            wire.scale.setScalar(s);
            solid.scale.setScalar(s);
            dots.scale.setScalar(s);

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            ({ w, h } = size());
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }, { passive: true });
    }
});

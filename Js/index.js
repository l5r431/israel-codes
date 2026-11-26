// ===== EDIT YOUR CONTACT DETAILS HERE (same block as in the about page's script.js) =====
const CONTACT = {
    email: 'contact@fridaycore.win',
    whatsapp: '256747006987', // country code + number, digits only (no + or spaces)
    phone: '+256747006987'
};

(() => {
    'use strict';
    const body = document.body;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;

    /* ---------- footer contact icons ---------- */
    const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hi Israel, I found your website.')}`;
    document.querySelectorAll('[data-contact]').forEach((a) => {
        const k = a.dataset.contact;
        a.href = k === 'call' ? `tel:${CONTACT.phone}` : k === 'whatsapp' ? wa : `mailto:${CONTACT.email}`;
    });

    /* ---------- theme toggle ----------
       Uses the same storage rules as the about page's script.js so both pages stay in sync:
       the word saved is the OPPOSITE of the mode (dark mode saves 'light'). */
    document.getElementById('theme').addEventListener('click', () => {
        const dark = body.classList.toggle('dark-mode');
        try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (e) {}
    });

    /* ---------- mobile menu ---------- */
    const burger = document.getElementById('burger');
    const links = document.getElementById('links');
    const setMenu = (open) => {
        links.classList.toggle('open', open);
        burger.classList.toggle('x', open);
        burger.setAttribute('aria-expanded', open);
    };
    burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.fnav')) setMenu(false);
    });

    /* ---------- rotating word ---------- */
    const rot = document.getElementById('rot');
    const words = ['fast', 'responsive', 'beautiful', 'accessible', 'yours'];
    let wi = 0;
    if (rot && !reduce) {
        setInterval(() => {
            rot.classList.add('out');
            setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 350);
        }, 2400);
    }

    /* ---------- hint ---------- */
    const hint = document.getElementById('hint');
    if (coarse && hint) hint.textContent = 'Touch and drag through the dots. Press and hold to pull them in.';
    const hideHint = () => hint && hint.classList.add('gone');
    setTimeout(hideHint, 9000);

    /* ---------- interactive particle network (kept light: batched drawing, capped density, idle throttle) ---------- */
    const cv = document.getElementById('net');
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, L = 120, pts = [], target = 0, last = performance.now();
    const ptr = { x: -9999, y: -9999, on: false, down: false };
    let col = { dot: '232,228,218', acc: '224,101,53' };
    const readTheme = () => {
        col = body.classList.contains('dark-mode')
            ? { dot: '232,228,218', acc: '224,101,53' }
            : { dot: '26,24,20', acc: '212,82,26' };
    };
    new MutationObserver(readTheme).observe(body, { attributes: true, attributeFilter: ['class'] });
    readTheme();

    const rand = (a, b) => a + Math.random() * (b - a);
    const make = (x, y, burst) => {
        const a = Math.random() * 6.283, s = reduce ? 0 : rand(0.15, 0.5);
        const p = { x, y, bx: Math.cos(a) * s, by: Math.sin(a) * s, r: rand(1, 2.6), extra: !!burst, n: false, d2: 1e9 };
        p.vx = p.bx; p.vy = p.by;
        if (burst) { const k = rand(2, 5); p.vx = Math.cos(a) * k; p.vy = Math.sin(a) * k; }
        return p;
    };

    function resize() {
        W = innerWidth; H = innerHeight;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);          // retina at 1.5x is plenty for thin lines
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        target = Math.max(35, Math.min(W < 700 ? 50 : 110, Math.round(W * H / 14000)));
        L = Math.max(100, Math.min(150, Math.sqrt(W * H / target) * 1.15));   // link distance keeps the web evenly dense
        const base = pts.filter((p) => !p.extra), ex = pts.filter((p) => p.extra);
        while (base.length < target) base.push(make(rand(0, W), rand(0, H)));
        base.length = Math.min(base.length, target);
        pts = base.concat(ex);
    }
    let rz;
    addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(resize); });
    resize();

    /* mouse, finger and pen all arrive as pointer events */
    const setP = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; };
    addEventListener('pointermove', setP, { passive: true });
    addEventListener('pointerdown', (e) => {
        setP(e); ptr.down = true; hideHint();
        if (reduce || e.target.closest('a, button')) return;
        for (let i = 0; i < 6; i++) pts.push(make(e.clientX, e.clientY, true));
        let n = pts.filter((p) => p.extra).length;
        while (n-- > 30) pts.splice(pts.findIndex((p) => p.extra), 1);
    }, { passive: true });
    addEventListener('pointerup', (e) => { ptr.down = false; if (e.pointerType !== 'mouse') ptr.on = false; }, { passive: true });
    addEventListener('pointercancel', () => { ptr.down = false; ptr.on = false; });
    document.documentElement.addEventListener('mouseleave', () => { ptr.on = false; ptr.down = false; });
    addEventListener('blur', () => { ptr.on = false; ptr.down = false; });

    const LA = [0.07, 0.15, 0.23, 0.31];   // network line opacity buckets  -> 4 stroke calls per frame
    const PA = [0.25, 0.5, 0.8];           // pointer line opacity buckets   -> 3 stroke calls per frame
    const seg = [[], [], [], []], pseg = [[], [], []];

    function frame(t) {
        requestAnimationFrame(frame);
        if (!ptr.on && t - last < 30) return;          // idle: ~30 fps, while you interact: full speed
        const dt = Math.min(3, (t - last) / 16.67); last = t;
        ctx.clearRect(0, 0, W, H);
        const R = ptr.down ? (coarse ? 170 : 210) : (coarse ? 110 : 140), PL = R + 40, L2 = L * L;

        for (const p of pts) {
            p.n = false;
            if (ptr.on) {
                const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
                p.d2 = d2; p.n = d2 < PL * PL;
                if (d2 < R * R && d2 > 576) {
                    const d = Math.sqrt(d2), f = (1 - d / R) * (ptr.down ? -0.35 : 0.9) * dt;  // press = pull in, otherwise push away
                    p.vx += dx / d * f; p.vy += dy / d * f;
                }
            }
            p.vx += (p.bx - p.vx) * 0.03 * dt; p.vy += (p.by - p.vy) * 0.03 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
            if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
        }

        // network lines, grouped by opacity so each group is one path and one stroke
        for (let k = 0; k < 4; k++) seg[k].length = 0;
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            for (let j = i + 1; j < pts.length; j++) {
                const b = pts[j], dx = a.x - b.x;
                if (dx > L || dx < -L) continue;
                const dy = a.y - b.y;
                if (dy > L || dy < -L) continue;
                const d2 = dx * dx + dy * dy;
                if (d2 < L2) seg[Math.min(3, ((1 - Math.sqrt(d2) / L) * 4) | 0)].push(a.x, a.y, b.x, b.y);
            }
        }
        ctx.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
            const s = seg[k];
            if (!s.length) continue;
            ctx.strokeStyle = `rgba(${col.dot},${LA[k]})`;
            ctx.beginPath();
            for (let m = 0; m < s.length; m += 4) { ctx.moveTo(s[m], s[m + 1]); ctx.lineTo(s[m + 2], s[m + 3]); }
            ctx.stroke();
        }

        if (ptr.on) {   // the cursor / finger becomes a node in the network
            for (let k = 0; k < 3; k++) pseg[k].length = 0;
            for (const p of pts) if (p.n) pseg[Math.min(2, ((1 - Math.sqrt(p.d2) / PL) * 3) | 0)].push(p.x, p.y);
            ctx.lineWidth = 1.4;
            for (let k = 0; k < 3; k++) {
                const s = pseg[k];
                if (!s.length) continue;
                ctx.strokeStyle = `rgba(${col.acc},${PA[k]})`;
                ctx.beginPath();
                for (let m = 0; m < s.length; m += 2) { ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(s[m], s[m + 1]); }
                ctx.stroke();
            }
            ctx.fillStyle = `rgba(${col.acc},0.9)`;
            ctx.beginPath(); ctx.arc(ptr.x, ptr.y, ptr.down ? 5 : 3.2, 0, 6.283); ctx.fill();
        }

        // dots: one fill for the normal ones, one for those near the pointer
        ctx.fillStyle = `rgba(${col.dot},0.7)`;
        ctx.beginPath();
        for (const p of pts) if (!p.n) { ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, 6.283); }
        ctx.fill();
        if (ptr.on) {
            ctx.fillStyle = `rgba(${col.acc},0.95)`;
            ctx.beginPath();
            for (const p of pts) if (p.n) { ctx.moveTo(p.x + p.r + 0.8, p.y); ctx.arc(p.x, p.y, p.r + 0.8, 0, 6.283); }
            ctx.fill();
        }
    }
    requestAnimationFrame(frame);
})();

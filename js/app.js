(function () {
	'use strict';
	const music = document.getElementById('bg-music');
	const fabMusic = document.getElementById('fab-music');
	const fabMute = document.getElementById('fab-mute');
	const startBtn = document.getElementById('start-music-btn');
	const welcome = document.getElementById('welcome-overlay');
	const countdownEls = { d: document.getElementById('d'), h: document.getElementById('h'), m: document.getElementById('m'), s: document.getElementById('s') };
	const rsvpLink = document.getElementById('fab-rsvp');
	const rsvpTextLink = document.getElementById('link-rsvp');
	const rsvpModal = document.getElementById('rsvp-modal');
	const rsvpClose = document.querySelector('.rsvp-close');
	const rsvpForm = document.getElementById('rsvp-form');
	const lightbox = document.getElementById('lightbox');
	const lightboxClose = document.querySelector('.lightbox-close');
	const lightboxImg = document.querySelector('.lightbox-img');
	const gallery = document.getElementById('gallery');

	// Ensure music source is safe (encode URI)
	try {
		if (music && music.querySelector('source')) {
			const src = music.querySelector('source').getAttribute('src');
			music.querySelector('source').setAttribute('src', encodeURI(src));
		}
	} catch (e) { console.warn(e) }

	// Welcome button: play music, hide overlay and ensure first screen is visible
	startBtn?.addEventListener('click', () => {
		music?.play().catch(() => { });
		music?.play().catch(() => {
			// si falla, intenta desmutear y reiniciar el tiempo (iOS a veces lo pide)
			try { music.muted = false; music.currentTime = 0; music.play().catch(() => { }); } catch (e) { }
		});
		if (welcome) welcome.style.display = 'none';
		// ensure hero is visible and background applied
		try {
			const hero = document.querySelector('.story.s1');
			const bg = hero?.querySelector('.bg');
			const src = hero?.getAttribute('data-bg');
			if (bg && src && !bg.style.backgroundImage) {
				bg.style.backgroundImage = `url('${src}')`;
			}
			hero?.classList.add('hero-loaded');
			hero?.focus();
			// trigger word animations for mobile users who just revealed the hero
			// immediate animations: words, title class, rings and card reveal
			animateWords('.subtitle');
			animateWords('.names');
			animateWords('#date-text');
			// animate the invitation lines word-by-word (invite-note after invite-text completes)
			const inviteTextEl = document.querySelector('.invite-text');
			if (inviteTextEl) {
				// Start invite-text animation
				const textWordCount = animateWords('.invite-text', 400);
				const totalTextTime = textWordCount * 400 + 400; // Total time for text animation
				
				// Wait for invite-text to finish before starting invite-note
				setTimeout(() => {
					// animate invite-note after invite-text finishes
					animateWords('.invite-note', 400); // Use same timing as invite-text
					const noteEl = document.querySelector('.invite-note'); 
					if (noteEl) {
						setTimeout(() => noteEl.classList.add('invite-animated'), 500);
					}
				}, totalTextTime + 500); // Add small delay between texts
			}
			const title = hero.querySelector('.names'); title?.classList.add('animated');
			try { spawnRings(); } catch (e) { }
			const card = hero.querySelector('.card'); if (card) { card.classList.add('fade-up'); setTimeout(() => card.classList.add('is-visible'), 80); }
			// Also trigger the staged reveal sequence to ensure the .body-init temporary
			// hiding class is removed and the per-word reveal runs on user interaction.
			try { if (typeof stagedReveal === 'function') stagedReveal(); } catch (e) { console.warn(e) }

			// Quick-fix: immediately remove the temporary hiding state and reveal key items
			// so the text (words) becomes visible right after the user interaction.
			try {
				document.body.classList.remove('body-init');
				['.subtitle', '.names', '.countdown', '.link-rsvp', '.card', '.wedding-rings'].forEach(sel => {
					const el = document.querySelector(sel); if (el) el.classList.add('reveal');
				});
			} catch (e) { console.warn(e) }

			// start per-item card animation immediately for the user-click path (slower)
			try { animateCardItems('.story.s1 .card', 2400, 700); } catch (e) { }
		} catch (e) { console.warn(e) }
	});

	fabMusic?.addEventListener('click', () => {
		if (music.paused) music.play(); else music.pause();
		fabMusic.classList.toggle('is-playing', !music.paused);
	});
	fabMute?.addEventListener('click', () => {
		music.muted = !music.muted;
		fabMute.setAttribute('aria-pressed', String(music.muted));
	});

	// RSVP modal open/close
	function openRsvpModal(e) {
		if (e && typeof e.preventDefault === 'function') e.preventDefault();
		// If clicked element is the RSVP button (link-rsvp), open WhatsApp with a quick message
		try {
			if (e && e.currentTarget && e.currentTarget.id === 'link-rsvp') {
				const phone = e.currentTarget.getAttribute('data-phone') || '';
				const msg = encodeURIComponent('Te confirmo mi asistencia');
				if (phone) {
					const wa = `https://wa.me/${phone}?text=${msg}`;
					window.open(wa, '_blank');
					return;
				}
			}
		} catch (err) { console.warn(err) }
		if (rsvpModal) rsvpModal.setAttribute('aria-hidden', 'false');
		const firstInput = rsvpModal?.querySelector('input[name=name]');
		firstInput?.focus();
	}
	[rsvpLink, rsvpTextLink].forEach(el => el?.addEventListener('click', openRsvpModal));
	rsvpClose?.addEventListener('click', () => rsvpModal?.setAttribute('aria-hidden', 'true'));
	document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { rsvpModal?.setAttribute('aria-hidden', 'true'); lightbox?.setAttribute('aria-hidden', 'true'); } });

	// Simple RSVP form save to localStorage
	rsvpForm?.addEventListener('submit', (e) => {
		e.preventDefault();
		const fd = new FormData(rsvpForm);
		const entry = Object.fromEntries(fd.entries());
		const list = JSON.parse(localStorage.getItem('rsvp-list') || '[]');
		list.push(Object.assign({ ts: Date.now() }, entry));
		localStorage.setItem('rsvp-list', JSON.stringify(list));
		alert('Gracias — tu respuesta se ha guardado localmente.');
		rsvpModal?.setAttribute('aria-hidden', 'true');
	});
	document.getElementById('rsvp-export')?.addEventListener('click', () => {
		const list = JSON.parse(localStorage.getItem('rsvp-list') || '[]');
		if (!list.length) { alert('No hay confirmaciones aún.'); return; }
		const rows = [Object.keys(list[0]).join(',')].concat(list.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')));
		const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = 'rsvp.csv'; a.click(); URL.revokeObjectURL(url);
	});

	// Countdown
	// === Countdown mejorado con progreso por anillo ===
	(function () {
		const root = document.getElementById('countdown');
		const elD = document.getElementById('d');
		const elH = document.getElementById('h');
		const elM = document.getElementById('m');
		const elS = document.getElementById('s');

		// ¡Ajusta AQUÍ la fecha/hora del evento! (con zona horaria de Bogotá)
		const TARGET = new Date('2025-11-08T16:00:00-05:00');
		let TOTAL_MS = null;  // se fija en el primer tick
		let timerId;

		function setVal(el, val) {
			const prev = el.dataset.prev;
			if (prev != val) {
				el.textContent = val;
				el.dataset.prev = val;
				el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
			}
		}
		function setP(unit, p) {
			const box = root?.querySelector(`.dd[data-unit="${unit}"]`);
			if (box) box.style.setProperty('--p', Math.max(0, Math.min(100, p)).toFixed(1));
		}

		function update() {
			const now = new Date();
			let diff = TARGET - now;
			if (diff < 0) diff = 0;
			if (TOTAL_MS === null) TOTAL_MS = Math.max(diff, 1); // base para el anillo de "días"

			// valores “restantes”
			const d = Math.floor(diff / 86400000);
			const h = Math.floor(diff / 3600000) % 24;
			const m = Math.floor(diff / 60000) % 60;
			const s = Math.floor(diff / 1000) % 60;

			setVal(elD, d);
			setVal(elH, h.toString().padStart(2, '0'));
			setVal(elM, m.toString().padStart(2, '0'));
			setVal(elS, s.toString().padStart(2, '0'));

			// progreso de cada anillo:
			// días = progreso total hacia el evento (desde que abriste la página)
			setP('d', (1 - (diff / TOTAL_MS)) * 100);

			// horas/min/seg = progreso dentro de su unidad (mod)
			const msToHour = diff % 3600000;
			const msToMinute = diff % 60000;
			const msToSecond = diff % 1000;

			setP('h', ((3600000 - msToHour) / 3600000) * 100);
			setP('m', ((60000 - msToMinute) / 60000) * 100);
			setP('s', ((1000 - msToSecond) / 1000) * 100);

			if (diff === 0 && timerId) {
				clearInterval(timerId);
				// Opcional: podrías mostrar un mensaje aquí de “¡Llegó el gran día!”
			}
		}

		update();
		// 250ms para que el anillo de segundos se vea fluido sin gastar CPU
		timerId = setInterval(update, 250);
	})();

	// Gallery lightbox
	gallery?.addEventListener('click', (e) => {
		const item = e.target.closest('.gallery-item');
		if (!item) return;
		const img = item.querySelector('img');
		lightboxImg.src = img.src; lightboxImg.alt = img.alt || '';
		lightbox.querySelector('.lightbox-caption').textContent = item.querySelector('.caption')?.textContent || '';
		lightbox.setAttribute('aria-hidden', 'false');
	});
	lightboxClose?.addEventListener('click', () => lightbox.setAttribute('aria-hidden', 'true'));

	// Lightbox click outside to close
	lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.setAttribute('aria-hidden', 'true'); });

	// File input for sunflower decoration (persist as data URL)
	const sunflowerInput = document.getElementById('sunflower-input');
	const decor = document.querySelector('.decor-sunflower');
	if (sunflowerInput && decor) {
		sunflowerInput.addEventListener('change', async (e) => {
			const f = e.target.files && e.target.files[0]; if (!f) return;
			const reader = new FileReader();
			reader.onload = function (ev) {
				const dataUrl = ev.target.result;
				decor.style.backgroundImage = `url('${dataUrl}')`;
				try { localStorage.setItem('sunflower', dataUrl); } catch (e) { }
			};
			reader.readAsDataURL(f);
		});
		// restore
		try { const sf = localStorage.getItem('sunflower'); if (sf) decor.style.backgroundImage = `url('${sf}')`; } catch (e) { }
	}
})();

// When the whole details section (.story.s2) becomes visible, stagger reveal its diary entries
(function () {
	try {
		const details = document.querySelector('.story.s2');
		if (!details) return;
		const entries = Array.from(details.querySelectorAll('.diary-entry'));
		if (!entries.length) return;
		const staggerReveal = () => {
			entries.forEach((el, i) => {
				if (!el.classList.contains('is-visible')) {
					setTimeout(() => el.classList.add('is-visible'), i * 180 + 120);
				}
			});
		};
		if ('IntersectionObserver' in window) {
			const s2io = new IntersectionObserver((items) => {
				items.forEach(it => {
					if (it.isIntersecting) { staggerReveal(); s2io.unobserve(it.target); }
				});
			}, { root: null, rootMargin: '0px 0px -16% 0px', threshold: 0.12 });
			s2io.observe(details);
		} else {
			// fallback: reveal after small delay
			setTimeout(staggerReveal, 600);
		}
	} catch (e) { console.warn(e) }
})();

// Petal animation generator (non-blocking, tasteful)
(function () {
	const container = document.getElementById('petals');
	if (!container) return;
	let running = true;
	const MAX = 18;
	function spawnPetal() {
		if (!running) return;
		// create an SVG flower element
		const left = Math.random() * 100; // vw
		const size = 18 + Math.random() * 36; // px
		const duration = 7 + Math.random() * 10; // seconds
		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('class', 'flower');
		svg.setAttribute('width', size);
		svg.setAttribute('height', size);
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.style.position = 'absolute';
		svg.style.left = left + 'vw';
		svg.style.opacity = (0.7 + Math.random() * 0.3).toFixed(2);
		svg.style.animationDuration = duration + 's';
		svg.style.animationDelay = (Math.random() * 2) + 's';
		// simple sunflower: center + multiple yellow petals
		svg.innerHTML = `
					<g transform="translate(12,12)">
						<g id="petals">
							${[...Array(10)].map((_, i) => {
			const angle = (i * 36);
			return `<ellipse rx="3.6" ry="1.6" transform="rotate(${angle}) translate(7,0)" fill="var(--sunflower)" />`;
		}).join('')}
						</g>
						<circle r="3.2" fill="var(--sunflower-center)" />
					</g>
				`;
		container.appendChild(svg);
		// cleanup after animation
		setTimeout(() => { try { svg.remove(); } catch (e) { } }, (duration + 4) * 1000);
	}
	// initial burst
	for (let i = 0; i < 10; i++) setTimeout(spawnPetal, i * 300);
	// continuous spawn, but limit total in DOM
	const interval = setInterval(() => {
		if (container.children.length < MAX) spawnPetal();
	}, 900);
	// stop on page unload
	window.addEventListener('beforeunload', () => { running = false; clearInterval(interval); });
})();

// Lazy-load hero background and add fade-in
document.addEventListener('DOMContentLoaded', () => {
	try {
		const hero = document.querySelector('.story.s1');
		const bg = hero?.querySelector('.bg');
		const src = hero?.getAttribute('data-bg');
		// If page provides a global INVITE.backgrounds array (like index2 pattern), apply to bg1/bg2/bg3
		try {
			if (window.INVITE && Array.isArray(window.INVITE.backgrounds)) {
				const bgs = window.INVITE.backgrounds;
				if (bgs[0]) { const el = document.getElementById('bg1'); if (el) el.style.backgroundImage = `url('${bgs[0]}')`; }
				if (bgs[1]) { const el = document.getElementById('bg2'); if (el) el.style.backgroundImage = `url('${bgs[1]}')`; }
				if (bgs[2]) { const el = document.getElementById('bg3'); if (el) el.style.backgroundImage = `url('${bgs[2]}')`; }
				if (bgs[3]) { const el = document.getElementById('bg4'); if (el) el.style.backgroundImage = `url('${bgs[3]}')`; }
			}
		} catch (e) {/* ignore */ }
		if (bg && src) {
			const img = new Image(); img.src = src;
			img.onload = () => {
				bg.style.backgroundImage = `url('${src}')`;
				hero.classList.add('hero-loaded');
				// reveal card with fade-up
				const card = hero.querySelector('.card'); card?.classList.add('fade-up');
				setTimeout(() => card?.classList.add('is-visible'), 80);
				// staged reveal if welcome overlay is not blocking
				if (!isWelcomeVisible()) stagedReveal();
				// animate card items per element with a gentle stagger (slower)
				try { animateCardItems('.story.s1 .card', 3000, 800); } catch (e) { }
			};
		}
	} catch (e) { console.warn(e) }
});

function isWelcomeVisible() {
	const w = document.getElementById('welcome-overlay');
	// visible mientras no tenga display='none'
	return !!(w && getComputedStyle(w).display !== 'none');
}

// Reveal elements in a small staged sequence for a pleasant entrance
function stagedReveal() {
	try {
		if (isWelcomeVisible()) return;

		const hero = document.querySelector('.story.s1');
		if (!hero) return;
		// prepare: add body-init to hide everything for a moment
		document.body.classList.add('body-init');
		// ensure words are wrapped
		animateWords('.subtitle'); animateWords('.names'); animateWords('#date-text');
		// invite lines (slower for readability) with cascade; invite-note gets a slightly faster cadence
		const inviteTextEl = document.querySelector('.invite-text');
		if (inviteTextEl) {
			// Start invite-text animation
			animateWords('.invite-text', 400);
			
			// Wait for invite-text to finish before starting invite-note
			inviteTextEl.addEventListener('words:done', () => {
				setTimeout(() => {
					// animate invite-note after invite-text finishes
					animateWords('.invite-note', 400); // Use same timing as invite-text
					const noteEl = document.querySelector('.invite-note'); 
					if (noteEl) {
						setTimeout(() => noteEl.classList.add('invite-animated'), 500);
					}
				}, 500); // Small delay between texts
			});
		}
		// sequence timings
		// sequence timings (much slower for visibility)
		const delays = [3200, 6200, 9200, 12200, 15200];
		// rings
		setTimeout(() => { spawnRings(); const el = document.querySelector('.wedding-rings'); el?.classList.add('reveal'); }, delays[0]);
		// subtitle
		setTimeout(() => { const s = document.querySelector('.subtitle'); s?.classList.add('reveal'); }, delays[1]);
		// title
		setTimeout(() => { const t = document.querySelector('.names'); t?.classList.add('reveal'); t?.classList.add('animated'); }, delays[2]);
		// countdown
		setTimeout(() => { const c = document.querySelector('.countdown'); c?.classList.add('reveal'); }, delays[3]);
		// rsvp and card
		setTimeout(() => { const r = document.querySelector('.link-rsvp'); r?.classList.add('reveal'); const card = document.querySelector('.card'); card?.classList.add('reveal'); document.body.classList.remove('body-init'); }, delays[4]);
	} catch (e) { console.warn(e) }
}

// Stagger children of a .card to create micro-animations per item
function animateCardItems(containerSelector = '.card', baseDelay = 900, step = 300) {
	try {
		const container = document.querySelector(containerSelector);
		if (!container) return;
		// pick visible direct children that are relevant
		const children = Array.from(container.children).filter(el => el.offsetParent !== null);
		children.forEach((ch, i) => {
			ch.classList.add('card-item');
			// staggered add of 'animate'
			setTimeout(() => ch.classList.add('animate'), baseDelay + (i * step));
		});
	} catch (e) { console.warn(e) }
}

// Split text into words and animate them with staggered delays
// animateWords optionally accepts perWordDelay in milliseconds
function animateWords(selector, perWordDelay = 400) {
	try {
		const el = document.querySelector(selector);
		if (!el) return;
		// Avoid re-wrapping
		if (el.dataset.animated) return;
		// preserve original text for aria-label (avoid trimming quotes that may be intentional)
		const raw = el.textContent || '';
		const normalized = raw.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
		const words = normalized.trim().split(/\s+/).filter(Boolean);
		// set accessible label with original punctuation
		el.setAttribute('aria-label', raw.trim());
		el.textContent = '';
		words.forEach((w, i) => {
			const span = document.createElement('span');
			span.className = 'word';
			span.textContent = w + (i < words.length - 1 ? ' ' : '');
			span.style.animation = `invite-word-pop 400ms cubic-bezier(.2,.9,.2,1) both`;
			span.style.animationDelay = (i * perWordDelay) + 'ms';
			// if this is the last word, listen for animationend to emit a custom event
			if (i === words.length - 1) {
				span.addEventListener('animationend', () => {
					try { el.dispatchEvent(new CustomEvent('words:done', { bubbles: true })); } catch (e) { }
				});
			}
			el.appendChild(span);
		});
		el.dataset.animated = '1';
		el.classList.add('ready');
		return words.length;
	} catch (e) { console.warn(e) }
	return 0;

}
// Create animated wedding rings inside .ring-photo (fallback to #petals if not present)
function spawnRings() {
	try {
		const container = document.querySelector('.ring-photo') || document.getElementById('petals');
		if (!container) return;
		// create SVG wrapper
		const svgNS = 'http://www.w3.org/2000/svg';
		const wrapper = document.createElement('div'); wrapper.className = 'rings-wrapper';
		wrapper.style.position = 'relative'; wrapper.style.width = '100%'; wrapper.style.height = '100%';

		const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 120 120'); svg.setAttribute('class', 'ring-svg');
		// golden ring
		const ring1 = document.createElementNS(svgNS, 'circle'); ring1.setAttribute('cx', '60'); ring1.setAttribute('cy', '60'); ring1.setAttribute('r', '28'); ring1.setAttribute('fill', 'none'); ring1.setAttribute('stroke', 'var(--sunflower)'); ring1.setAttribute('stroke-width', '6'); ring1.setAttribute('class', 'ring');
		// silver ring slightly offset
		const ring2 = document.createElementNS(svgNS, 'circle'); ring2.setAttribute('cx', '72'); ring2.setAttribute('cy', '68'); ring2.setAttribute('r', '20'); ring2.setAttribute('fill', 'none'); ring2.setAttribute('stroke', '#f3efe8'); ring2.setAttribute('stroke-width', '4'); ring2.setAttribute('class', 'ring small');
		svg.appendChild(ring1); svg.appendChild(ring2);
		wrapper.appendChild(svg);
		// append and remove after animation loop to avoid DOM bloat
		container.appendChild(wrapper);
		setTimeout(() => { try { wrapper.remove(); } catch (e) { } }, 12000);
	} catch (e) { console.warn(e) }
}

// Reveal diary entries as they scroll into view
(function () {
	try {
		const entries = document.querySelectorAll('.diary-entry');
		if (!entries || entries.length === 0) return;
		const reveal = (el) => el.classList.add('is-visible');
		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver((items) => {
				items.forEach(i => {
					if (i.isIntersecting) { reveal(i.target); io.unobserve(i.target); }
				});
			}, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
			entries.forEach(e => { e.classList.add('fade-up'); io.observe(e); });
		} else {
			// fallback: reveal all after small timeout
			entries.forEach((e, i) => setTimeout(() => reveal(e), 200 + (i * 120)));
		}
	} catch (e) { console.warn(e); }
})();

// Generate Instagram Story PNG (canvas) and download
function generateStoryPNG() {
	const width = 1080, height = 1920; // story size
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const ctx = canvas.getContext('2d');
	// background soft gradient
	const g = ctx.createLinearGradient(0, 0, 0, height);
	g.addColorStop(0, '#f7fff9'); g.addColorStop(1, '#eaffef');
	ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
	// optional background photo: try load hero image
	const hero = document.querySelector('.story.s1');
	const bgSrc = hero?.getAttribute('data-bg');
	return new Promise((resolve) => {
		if (bgSrc) {
			const img = new Image(); img.crossOrigin = 'anonymous'; img.src = bgSrc;
			img.onload = () => {
				// draw blurred background scaled
				const ratio = Math.max(width / img.width, height / img.height);
				const iw = img.width * ratio, ih = img.height * ratio;
				ctx.globalAlpha = 0.22; ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih); ctx.globalAlpha = 1;
				drawTextAndLogo();
			};
			img.onerror = () => drawTextAndLogo();
		} else drawTextAndLogo();

		function drawTextAndLogo() {
			// title (Great Vibes style)
			ctx.fillStyle = 'rgba(20,60,30,0.95)';
			ctx.font = '84px Great Vibes, cursive'; ctx.textAlign = 'center';
			ctx.fillText('Daniel  &  Ana', width / 2, height * 0.42);
			// date
			ctx.font = '36px Montserrat, sans-serif'; ctx.fillText('20 de diciembre de 2025 — 4:00 p.m.', width / 2, height * 0.48);
			// small caption
			ctx.font = '28px Montserrat, sans-serif'; ctx.fillStyle = 'rgba(20,60,30,0.85)'; ctx.fillText('¡Nos casamos! Comparte nuestra historia', width / 2, height * 0.56);
			// sunflower mark bottom-right
			ctx.fillStyle = 'var(--sunflower)'; ctx.beginPath(); ctx.arc(width * 0.85, height * 0.78, 80, 0, Math.PI * 2); ctx.fill();
			ctx.fillStyle = 'var(--sunflower-center)'; ctx.beginPath(); ctx.arc(width * 0.85, height * 0.78, 36, 0, Math.PI * 2); ctx.fill();
			// finalize
			canvas.toBlob((blob) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a'); a.href = url; a.download = 'story-daniel-ana.png'; a.click(); URL.revokeObjectURL(url);
				resolve(true);
			}, 'image/png');
		}
	});
}

// === Auto-fit ESTABLE: mide con "888/88" y no reescala al cambiar los números ===
(function () {
	const cd = document.querySelector('.countdown.cd-flat');
	if (!cd) return;

	const labelsFull = ["DÍAS", "HORAS", "MINUTOS", "SEGUNDOS"];
	const labelsShort = ["DÍAS", "HORAS", "MIN", "SEG"];
	const labelsMini = ["DÍAS", "HORAS", "MIN", "SEG"];

	function setLabels(arr) {
		const spans = cd.querySelectorAll('.unit span');
		if (spans.length >= 4) for (let i = 0; i < 4; i++) spans[i].textContent = arr[i];
	}

	// Mide el ancho “peor caso” sin afectar el layout
	function measureNeededWidth(labelSet) {
		// clonar el bloque con escala 1
		const clone = cd.cloneNode(true);
		clone.style.position = 'absolute';
		clone.style.visibility = 'hidden';
		clone.style.left = '-9999px';
		clone.style.top = '0';
		clone.style.transform = 'none';
		clone.style.setProperty('--cd-scale', '1');

		// números “anchos” (8 suele ser el dígito más ancho)
		const nums = clone.querySelectorAll('.unit strong');
		nums.forEach((el, i) => { el.textContent = (i === 0 ? '888' : '88'); });

		// aplicar conjunto de etiquetas
		const spans = clone.querySelectorAll('.unit span');
		spans.forEach((el, i) => { el.textContent = labelSet[i]; });

		document.body.appendChild(clone);
		const needed = clone.scrollWidth;
		document.body.removeChild(clone);
		return needed;
	}

	function fitOnce() {
		// probar primero con etiquetas completas
		const available = Math.max(0, cd.clientWidth - 2);
		let needed = measureNeededWidth(labelsFull);

		// decidir etiquetas y escala
		let labels = labelsFull;
		if (needed > available) {
			// probar versión corta
			needed = measureNeededWidth(labelsShort);
			labels = labelsShort;
			if (needed > available) {
				// ultra compacto
				needed = measureNeededWidth(labelsMini);
				labels = labelsMini;
			}
		}

		// escala final (no recalcula por segundo)
		const scale = Math.max(0.50, Math.min(1, available / Math.max(1, needed)));
		cd.style.setProperty('--cd-scale', scale.toFixed(3));
		cd.style.setProperty('--cd-sep-opacity', (scale < 0.85 ? 0.18 : 0.28));
		setLabels(labels);
	}

	// Ejecutar en momentos estables
	function runFit() {
		// espera a que carguen las fuentes para evitar “saltos”
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(fitOnce);
		} else {
			fitOnce();
		}
	}

	window.addEventListener('load', runFit);
	window.addEventListener('resize', runFit);
	window.addEventListener('orientationchange', runFit);

	// doble chequeo por si estilos/imagenes cambian luego
	setTimeout(runFit, 120);
	setTimeout(runFit, 700);
})();


/* === Línea de tiempo (aislada) === */
(function () {
	const sec = document.getElementById('timeline');
	if (!sec) return;

const data = {
  couple: 'Daniel & Ana',
  date: '8 de noviembre de 2025',
  place: 'Iglesia Inmaculada Concepción de Suba, Bogotá',
  bgFallback: 'https://images.unsplash.com/photo-1497302347632-904729bc24aa?q=80&w=1600&auto=format&fit=crop',
  events: [
	{ time: '17:00', title: 'Ceremonia', note: 'Llegar 15 minutos antes para ubicarte con calma.', img: 'img/ceremonia.png' },
	{ time: '19:00', title: 'Recepción',   meta: 'Salon Ventury Shows',                              note: 'Brindis, fotos y música en vivo.',               img: 'img/coctel.png' },
	{ time: '—',    title: 'Baile y celebración',     meta: 'Salón principal',                       note: 'A continuación del cóctel. ¡Prepárate para bailar!', img: 'img/baile.png' },
	{ time: '00:00', title: '¡Despedida de los novios!', meta: 'Salida especial',                    note: 'Luces, abrazos y buenos deseos.',               img: 'img/despedida.png' }
  ]
};


	const container = document.getElementById('timeline-container');
	const bgEl = document.getElementById('timeline-bg');
	const bgUrl = (window.INVITE && Array.isArray(window.INVITE.backgrounds) && window.INVITE.backgrounds[2]) || data.bgFallback;
	if (bgEl) bgEl.style.backgroundImage = `url('${bgUrl}')`;

	// Cabecera
	const nameEl = container.querySelector('.names');
	const dateEl = container.querySelector('.date');
	const placeEl = container.querySelector('.place');
	if (nameEl) nameEl.textContent = data.couple;
	if (dateEl) dateEl.textContent = data.date;
	if (placeEl) placeEl.textContent = data.place;

	// Elementos del path
	const wrap = container.querySelector('#timeline-pathWrap');
	const path = container.querySelector('#timeline-tl-path');
	const shimmer = container.querySelector('#timeline-tl-shimmer');
	const glint = container.querySelector('#timeline-glint');
	const nodes = container.querySelector('#timeline-nodes');


// NUEVA FUNCIÓN: Solo controla la línea animada (la que pasa por los corazones)
function makeAnimatedLine(width, height) {
  const x = Math.round(width / 2); // Centro horizontal
  
  // CONTROLES ÚNICOS para la línea animada
  const lineStartY = 300;           // ← INICIO de la línea animada
  const lineEndY = height + 250;    // ← FIN de la línea animada

  // Crear línea simple desde inicio hasta fin
  return `M ${x} ${lineStartY} L ${x} ${lineEndY}`;
}

function makePath(width, height){
  const startY = 20;        // ← Posición Y de inicio para eventos
  const endY = height - 20; // ← Posición Y de fin para eventos
  const x = Math.round(width / 2); // Centro horizontal
  
  const N = data.events.length || 1;
  let pathCommands = [];
  
  // Crear línea para posicionar eventos (separada de la línea animada)
  pathCommands.push(`M ${x} ${startY}`);  // Mover al inicio de eventos
  pathCommands.push(`L ${x} ${endY}`);    // Línea hasta el final de eventos
  
  return pathCommands.join(' ');
}

function iconFor(title=''){
  const t = String(title).toLowerCase();
  if (t.includes('ceremonia')) return '💍';
  if (t.includes('cóctel') || t.includes('coctel')) return '🥂';
  if (t.includes('baile')) return '🎶';
  if (t.includes('despedida') || t.includes('salida')) return '✨';
  return '📌';
}

function layout(pass = 0){
  if(!wrap || !path || !nodes) return;

  // 1) Alto base aproximado según nº de eventos (1ª pasada)
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const perEvent = Math.max(140, Math.min(240, Math.round(vh * 0.28)));
  let H = Math.max(560, Math.round(200 + (data.events.length - 1) * perEvent));
  wrap.style.height = H + 'px';

  // Trazo para la línea animada (path y shimmer)
  const animatedLineD = makeAnimatedLine(wrap.clientWidth, H);
  path.setAttribute('d', animatedLineD);
  shimmer?.setAttribute('d', animatedLineD);
  
  // Trazo para posicionar eventos (invisible, solo para cálculos)
  const eventsLineD = makePath(wrap.clientWidth, H);
  const eventsPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  eventsPath.setAttribute('d', eventsLineD);

  const L = path.getTotalLength();
  path.style.setProperty('--dash', L);
  path.setAttribute('data-length', L);
  
  // Longitud para posicionar eventos
  const eventsL = eventsPath.getTotalLength();

  // Limpiar y pintar nodos
  wrap.querySelectorAll('.bead').forEach(b => b.remove());
  nodes.innerHTML = '';

  const N = data.events.length || 1;
  const margin = 0.08; // un poco más de resguardo arriba/abajo

  for (let i = 0; i < N; i++){
    const ev = data.events[i];
    const t  = margin + (i / (N - 1 || 1)) * (1 - margin * 2);
    const pt = eventsPath.getPointAtLength(eventsL * t);  // Usar el path de eventos

    const li = document.createElement('li');
    li.className = 'node reveal';
    li.style.top = pt.y + 'px';
    li.style.setProperty('--x', pt.x + 'px');
    li.setAttribute('tabindex', '0');

    const side = (i % 2 === 0) ? 'L' : 'R';
    li.setAttribute('data-side', side);

    const badgeIcon = (typeof iconFor === 'function') ? iconFor(ev.title) : '📌';

    const smallClass = (ev.title === 'Cóctel de bienvenida') ? ' small-panel' : '';

    const textHTML = `
      <div class="panel panel--text-only${smallClass}">
        <div class="when"><span class="dot" aria-hidden="true"></span><span>${ev.time}${ev.time && ev.time !== '—' ? ' h' : ''}</span></div>
        <h3 class="title">${ev.title || ''}</h3>
        ${ev.meta ? `<div class="meta">${ev.meta}</div>` : ``}
        ${ev.note ? `<p class="note">${ev.note}</p>` : ``}
        ${ev.title === 'Ceremonia' ? `<button class="btn-waze" onclick="window.open('https://waze.com/ul?q=Iglesia%20Inmaculada%20Concepción%20de%20Suba%20Bogotá', '_blank')">📍 Cómo llegar</button>` : ''}
        ${ev.title === 'Recepción' ? `<button class="btn-waze" onclick="window.open('https://maps.google.com/maps?q=Calle+146c+%2392-10,+Bogotá,+Colombia', '_blank')">📍 Cómo llegar</button>` : ''}
      </div>`;

    const mediaSrc = ev.img || ev.media;
const smallMediaClass = (ev.title.includes('Cóctel') || ev.title.includes('Baile')) ? ' small-media' : '';
const coctelClass = (ev.meta && ev.meta.includes('Cóctel')) || (ev.img && ev.img.includes('coctel')) ? ' coctel-media' : '';
const mediaHTML = mediaSrc
  ? `<figure class="panel panel--media${smallMediaClass}${coctelClass}">
       <div class="ph">
         <img src="${mediaSrc}" alt="${ev.mediaAlt || ev.title || 'Foto'}" loading="lazy">
       </div>
     </figure>`
  : ``;



    li.innerHTML = (side === 'L') ? (textHTML + mediaHTML) : (mediaHTML + textHTML);
    nodes.appendChild(li);

    const bead = document.createElement('span');
    bead.className = 'bead';
    bead.style.left = pt.x + 'px';
    bead.style.top  = pt.y + 'px';
    wrap.appendChild(bead);
  }

  // Aparición suave
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('show'); });
    }, {root:null, rootMargin:'0px 0px -12% 0px', threshold:.12});
    nodes.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }else{
    nodes.querySelectorAll('.reveal').forEach(el=>el.classList.add('show'));
  }

  // Luz que recorre la línea
  if (glint){
    let t0 = null;
    const loop = ts => {
      if(!document.body.contains(path)) return;
      if(!t0) t0 = ts;
      const k = ((ts - t0) % 6000) / 6000;
      const p = path.getPointAtLength(L * k);
      glint.setAttribute('cx', p.x);
      glint.setAttribute('cy', p.y);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // 2) MEDIR y encoger el alto a lo justo (quita el hueco de abajo)
  //    Luego re-trazar con el nuevo alto (solo una 2ª pasada)
  requestAnimationFrame(() => {
    const wrapRect = wrap.getBoundingClientRect();
    let maxBottom = 0;
    nodes.querySelectorAll('.panel').forEach(p => {
      const r = p.getBoundingClientRect();
      maxBottom = Math.max(maxBottom, r.bottom - wrapRect.top);
    });
    const needed = Math.ceil(maxBottom + 24);  // 24px de colchón
    const slack = H - needed;

    if (slack > 80 && pass < 1) {
      wrap.style.height = needed + 'px';
      // Recalcular trayecto y posiciones con el alto final
      layout(pass + 1);
    }
  });
  // === Mejora de imágenes: orientación & lightbox ===
nodes.querySelectorAll('.panel.panel--media img').forEach(img => {
  const enhance = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    const ar = w / h;
    const fig = img.closest('.panel--media');
    if (!fig) return;

    // asignar clase de orientación para ajustar el aspect-ratio del contenedor
    if (ar <= 0.95)       fig.classList.add('portrait');
    else if (ar <= 1.1)   fig.classList.add('square');
    else if (ar <= 1.7)   fig.classList.add('wide');
    else                  fig.classList.add('ultra');

    // si es extremadamente vertical u horizontal, usa contain para evitar cualquier corte
    if (ar <= 0.70 || ar >= 2.4) fig.classList.add('contain');

    // cursor y lightbox (reusa el de la galería)
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      const lb  = document.getElementById('lightbox');
      const lbi = document.querySelector('.lightbox-img');
      const cap = document.querySelector('.lightbox-caption');
      if (!lb || !lbi) return;
      lbi.src = img.currentSrc || img.src;
      lbi.alt = img.alt || '';
      if (cap) cap.textContent = img.alt || '';
      lb.setAttribute('aria-hidden','false');
    }, { once:false });
  };

  if (img.complete) enhance();
  else img.addEventListener('load', enhance, { once:true });
});

}







	// Luciérnagas
	const flies = document.getElementById('timeline-fireflies');
	function spawnFireflies(n = 14) {
		if (!flies) return;
		flies.innerHTML = '';
		for (let i = 0; i < n; i++) {
			const s = document.createElement('span');
			s.className = 'firefly';
			s.style.left = Math.random() * 100 + 'vw';
			s.style.top = Math.random() * 100 + 'vh';
			const dx = (Math.random() * 40 - 20) + 'vw'; s.style.setProperty('--dx', dx);
			const dy = (20 + Math.random() * 40) + 'vh'; s.style.setProperty('--dy', dy);
			s.style.setProperty('--dur', (12 + Math.random() * 10).toFixed(2) + 's');
			s.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
			flies.appendChild(s);
		}
	}

	function init() {
		layout();
		spawnFireflies();
	}

	// Ejecuta cuando ya existe el DOM
	if (document.readyState === 'complete' || document.readyState === 'interactive') { init(); }
	else document.addEventListener('DOMContentLoaded', init);

	window.addEventListener('resize', () => { layout(); spawnFireflies(); });
})();




/* Tema Sunset Rosé: reescribe el gradiente usado por la línea y conectores */
(function applySunsetTheme(){
  const svg = document.getElementById('timeline-tl-svg');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  let defs = svg.querySelector('defs');
  if (!defs){ defs = document.createElementNS(NS,'defs'); svg.prepend(defs); }
  let grad = svg.querySelector('#brandGoldGrad');
  if (!grad){
    grad = document.createElementNS(NS,'linearGradient');
    grad.setAttribute('id','brandGoldGrad');
    grad.setAttribute('x1','0'); grad.setAttribute('y1','0');
    grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
    defs.appendChild(grad);
  }
  grad.innerHTML = '';
  [['0%','#ff6ea1'],['55%','#ff8a3d'],['100%','#ffd36e']].forEach(([o,c])=>{
    const stop = document.createElementNS(NS,'stop');
    stop.setAttribute('offset',o);
    stop.setAttribute('stop-color',c);
    grad.appendChild(stop);
  });
})();


	(function(){
	'use strict';
	const music = document.getElementById('bg-music');
	const fabMusic = document.getElementById('fab-music');
	const fabMute = document.getElementById('fab-mute');
	const startBtn = document.getElementById('start-music-btn');
	const welcome = document.getElementById('welcome-overlay');
	const countdownEls = {d:document.getElementById('d'),h:document.getElementById('h'),m:document.getElementById('m'),s:document.getElementById('s')};
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
	try{ if(music && music.querySelector('source')){
		const src = music.querySelector('source').getAttribute('src');
		music.querySelector('source').setAttribute('src', encodeURI(src));
	}}catch(e){console.warn(e)}

	// Welcome button: play music, hide overlay and ensure first screen is visible
	startBtn?.addEventListener('click', ()=>{
		music?.play().catch(()=>{});
	 	if(welcome) welcome.style.display='none';
	 	// ensure hero is visible and background applied
	 	try{
	 		const hero = document.querySelector('.story.s1');
	 		const bg = hero?.querySelector('.bg');
	 		const src = hero?.getAttribute('data-bg');
	 		if(bg && src && !bg.style.backgroundImage){
	 			bg.style.backgroundImage = `url('${src}')`;
	 		}
	 		hero?.classList.add('hero-loaded');
	 		hero?.focus();
		// trigger word animations for mobile users who just revealed the hero
		// immediate animations: words, title class, rings and card reveal
		animateWords('.subtitle');
		animateWords('.names');
		animateWords('#date-text');
		// animate the invitation lines word-by-word
		// animate the invitation lines word-by-word in cascade (invite-note after invite-text completes)
		const inviteCount = animateWords('.invite-text', 600) || 0;
		setTimeout(()=> animateWords('.invite-note', 600), (inviteCount * 600) + 300);
		const title = hero.querySelector('.names'); title?.classList.add('animated');
		try{ spawnRings(); }catch(e){}
		const card = hero.querySelector('.card'); if(card){ card.classList.add('fade-up'); setTimeout(()=>card.classList.add('is-visible'),80); }
		// Also trigger the staged reveal sequence to ensure the .body-init temporary
		// hiding class is removed and the per-word reveal runs on user interaction.
		try{ if(typeof stagedReveal === 'function') stagedReveal(); }catch(e){console.warn(e)}

		// Quick-fix: immediately remove the temporary hiding state and reveal key items
		// so the text (words) becomes visible right after the user interaction.
		try{
			document.body.classList.remove('body-init');
			['.subtitle', '.names', '.countdown', '.link-rsvp', '.card', '.wedding-rings'].forEach(sel=>{
				const el = document.querySelector(sel); if(el) el.classList.add('reveal');
			});
		}catch(e){console.warn(e)}

	// start per-item card animation immediately for the user-click path (slower)
	try{ animateCardItems('.story.s1 .card', 2400, 700); }catch(e){}
	 	}catch(e){console.warn(e)}
	});

	fabMusic?.addEventListener('click', ()=>{
		if(music.paused) music.play(); else music.pause();
		fabMusic.classList.toggle('is-playing', !music.paused);
	});
	fabMute?.addEventListener('click', ()=>{
		music.muted = !music.muted;
		fabMute.setAttribute('aria-pressed', String(music.muted));
	});

	// RSVP modal open/close
	function openRsvpModal(e){
		if(e && typeof e.preventDefault === 'function') e.preventDefault();
		// If clicked element is the RSVP button (link-rsvp), open WhatsApp with a quick message
		try{
			if(e && e.currentTarget && e.currentTarget.id === 'link-rsvp'){
				const phone = e.currentTarget.getAttribute('data-phone') || '';
				const msg = encodeURIComponent('Te confirmo mi asistencia');
				if(phone){
					const wa = `https://wa.me/${phone}?text=${msg}`;
					window.open(wa,'_blank');
					return;
				}
			}
		}catch(err){console.warn(err)}
		if(rsvpModal) rsvpModal.setAttribute('aria-hidden','false');
		const firstInput = rsvpModal?.querySelector('input[name=name]');
		firstInput?.focus();
	}
	[rsvpLink, rsvpTextLink].forEach(el=> el?.addEventListener('click', openRsvpModal));
	rsvpClose?.addEventListener('click', ()=> rsvpModal?.setAttribute('aria-hidden','true'));
	document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ rsvpModal?.setAttribute('aria-hidden','true'); lightbox?.setAttribute('aria-hidden','true'); }});

	// Simple RSVP form save to localStorage
	rsvpForm?.addEventListener('submit', (e)=>{
		e.preventDefault();
		const fd = new FormData(rsvpForm);
		const entry = Object.fromEntries(fd.entries());
		const list = JSON.parse(localStorage.getItem('rsvp-list')||'[]');
		list.push(Object.assign({ts:Date.now()}, entry));
		localStorage.setItem('rsvp-list', JSON.stringify(list));
		alert('Gracias — tu respuesta se ha guardado localmente.');
		rsvpModal?.setAttribute('aria-hidden','true');
	});
	document.getElementById('rsvp-export')?.addEventListener('click', ()=>{
		const list = JSON.parse(localStorage.getItem('rsvp-list')||'[]');
		if(!list.length){ alert('No hay confirmaciones aún.'); return; }
		const rows = [Object.keys(list[0]).join(',')].concat(list.map(r=>Object.values(r).map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')));
		const blob = new Blob([rows.join('\n')],{type:'text/csv'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href=url; a.download='rsvp.csv'; a.click(); URL.revokeObjectURL(url);
	});

	// Countdown
	function updateCountdown(){
		let target;
		try{
			// fallback to fixed date if parsing fails (08 Nov 2025 at 16:00)
			target = new Date('2025-11-08T16:00:00');
		}catch(e){ target = new Date('2025-12-20T16:00:00'); }
		const now = new Date();
		const diff = Math.max(0, target - now);
		const s = Math.floor(diff/1000)%60;
		const m = Math.floor(diff/60000)%60;
		const h = Math.floor(diff/3600000)%24;
		const d = Math.floor(diff/86400000);
		countdownEls.d.textContent = d; countdownEls.h.textContent = h; countdownEls.m.textContent = m; countdownEls.s.textContent = s;
	}
	updateCountdown(); setInterval(updateCountdown,1000);

	// Gallery lightbox
	gallery?.addEventListener('click', (e)=>{
		const item = e.target.closest('.gallery-item');
		if(!item) return;
		const img = item.querySelector('img');
		lightboxImg.src = img.src; lightboxImg.alt = img.alt || '';
		lightbox.querySelector('.lightbox-caption').textContent = item.querySelector('.caption')?.textContent||'';
		lightbox.setAttribute('aria-hidden','false');
	});
	lightboxClose?.addEventListener('click', ()=> lightbox.setAttribute('aria-hidden','true'));

	// Lightbox click outside to close
	lightbox?.addEventListener('click', (e)=>{ if(e.target===lightbox) lightbox.setAttribute('aria-hidden','true'); });

	// File input for sunflower decoration (persist as data URL)
	const sunflowerInput = document.getElementById('sunflower-input');
	const decor = document.querySelector('.decor-sunflower');
	if(sunflowerInput && decor){
		sunflowerInput.addEventListener('change', async (e)=>{
			const f = e.target.files && e.target.files[0]; if(!f) return;
			const reader = new FileReader();
			reader.onload = function(ev){
				const dataUrl = ev.target.result;
				decor.style.backgroundImage = `url('${dataUrl}')`;
				try{ localStorage.setItem('sunflower', dataUrl); }catch(e){}
			};
			reader.readAsDataURL(f);
		});
		// restore
		try{ const sf = localStorage.getItem('sunflower'); if(sf) decor.style.backgroundImage = `url('${sf}')`; }catch(e){}
	}
})();

// Petal animation generator (non-blocking, tasteful)
(function(){
	const container = document.getElementById('petals');
	if(!container) return;
	let running = true;
	const MAX = 18;
	function spawnPetal(){
		if(!running) return;
			// create an SVG flower element
			const left = Math.random()*100; // vw
			const size = 18 + Math.random()*36; // px
			const duration = 7 + Math.random()*10; // seconds
			const svgNS = 'http://www.w3.org/2000/svg';
			const svg = document.createElementNS(svgNS, 'svg');
			svg.setAttribute('class','flower');
			svg.setAttribute('width', size);
			svg.setAttribute('height', size);
			svg.setAttribute('viewBox','0 0 24 24');
			svg.style.position = 'absolute';
			svg.style.left = left + 'vw';
			svg.style.opacity = (0.7 + Math.random()*0.3).toFixed(2);
			svg.style.animationDuration = duration + 's';
			svg.style.animationDelay = (Math.random()*2) + 's';
				// simple sunflower: center + multiple yellow petals
				svg.innerHTML = `
					<g transform="translate(12,12)">
						<g id="petals">
							${[...Array(10)].map((_,i)=>{
								const angle = (i*36);
								return `<ellipse rx="3.6" ry="1.6" transform="rotate(${angle}) translate(7,0)" fill="var(--sunflower)" />`;
							}).join('')}
						</g>
						<circle r="3.2" fill="var(--sunflower-center)" />
					</g>
				`;
			container.appendChild(svg);
		// cleanup after animation
		setTimeout(()=>{ try{ svg.remove(); }catch(e){} }, (duration+4)*1000);
	}
	// initial burst
	for(let i=0;i<10;i++) setTimeout(spawnPetal, i*300);
	// continuous spawn, but limit total in DOM
	const interval = setInterval(()=>{
		if(container.children.length < MAX) spawnPetal();
	}, 900);
	// stop on page unload
	window.addEventListener('beforeunload', ()=>{ running=false; clearInterval(interval); });
})();

// Lazy-load hero background and add fade-in
document.addEventListener('DOMContentLoaded', ()=>{
	try{
		const hero = document.querySelector('.story.s1');
		const bg = hero?.querySelector('.bg');
		const src = hero?.getAttribute('data-bg');
		if(bg && src){
			const img = new Image(); img.src = src;
			img.onload = ()=>{
				bg.style.backgroundImage = `url('${src}')`;
				hero.classList.add('hero-loaded');
				// reveal card with fade-up
				const card = hero.querySelector('.card'); card?.classList.add('fade-up');
				setTimeout(()=> card?.classList.add('is-visible'), 80);
				// staged reveal if welcome overlay is not blocking
				stagedReveal();
				// animate card items per element with a gentle stagger (slower)
				try{ animateCardItems('.story.s1 .card', 3000, 800); }catch(e){}
			};
		}
	}catch(e){console.warn(e)}
});

// Reveal elements in a small staged sequence for a pleasant entrance
function stagedReveal(){
	try{
		const hero = document.querySelector('.story.s1');
		if(!hero) return;
		// prepare: add body-init to hide everything for a moment
		document.body.classList.add('body-init');
		// ensure words are wrapped
		animateWords('.subtitle'); animateWords('.names'); animateWords('#date-text');
		// invite lines (slower for readability)
		// invite lines (slower for readability) with cascade
		const ic = animateWords('.invite-text', 600) || 0;
		setTimeout(()=> animateWords('.invite-note', 600), (ic * 600) + 300);
		// sequence timings
	// sequence timings (much slower for visibility)
const delays = [3200, 6200, 9200, 12200, 15200];
		// rings
		setTimeout(()=>{ spawnRings(); const el = document.querySelector('.wedding-rings'); el?.classList.add('reveal'); }, delays[0]);
		// subtitle
		setTimeout(()=>{ const s = document.querySelector('.subtitle'); s?.classList.add('reveal'); }, delays[1]);
		// title
		setTimeout(()=>{ const t = document.querySelector('.names'); t?.classList.add('reveal'); t?.classList.add('animated'); }, delays[2]);
		// countdown
		setTimeout(()=>{ const c = document.querySelector('.countdown'); c?.classList.add('reveal'); }, delays[3]);
		// rsvp and card
		setTimeout(()=>{ const r = document.querySelector('.link-rsvp'); r?.classList.add('reveal'); const card = document.querySelector('.card'); card?.classList.add('reveal'); document.body.classList.remove('body-init'); }, delays[4]);
	}catch(e){console.warn(e)}
}

// Stagger children of a .card to create micro-animations per item
function animateCardItems(containerSelector = '.card', baseDelay = 900, step = 300){
	try{
		const container = document.querySelector(containerSelector);
		if(!container) return;
		// pick visible direct children that are relevant
		const children = Array.from(container.children).filter(el=> el.offsetParent !== null);
		children.forEach((ch, i)=>{
			ch.classList.add('card-item');
			// staggered add of 'animate'
			setTimeout(()=> ch.classList.add('animate'), baseDelay + (i * step));
		});
	}catch(e){console.warn(e)}
}

// Split text into words and animate them with staggered delays
// animateWords optionally accepts perWordDelay in milliseconds
function animateWords(selector, perWordDelay = 400){
	try{
		const el = document.querySelector(selector);
		if(!el) return;
		// Avoid re-wrapping
		if(el.dataset.animated) return;
	// normalize spaces (collapse multiple spaces and non-breaking spaces) so words separate correctly
	const raw = el.textContent || '';
	const text = raw.replace(/\u00A0/g, ' ').trim().replace(/\s+/g, ' ');
	const words = text.split(/\s+/).filter(Boolean);
		el.textContent = '';
		words.forEach((w,i)=>{
			const span = document.createElement('span');
			span.className = 'word';
			span.textContent = w + (i<words.length-1? ' ':'');
			span.style.animationDelay = (i * perWordDelay) + 'ms';
			el.appendChild(span);
		});
		el.dataset.animated = '1';
		return words.length;
	}catch(e){console.warn(e)}
	return 0;

}
// Create animated wedding rings inside .ring-photo (fallback to #petals if not present)
function spawnRings(){
	try{
		const container = document.querySelector('.ring-photo') || document.getElementById('petals');
		if(!container) return;
		// create SVG wrapper
		const svgNS = 'http://www.w3.org/2000/svg';
		const wrapper = document.createElement('div'); wrapper.className = 'rings-wrapper';
		wrapper.style.position = 'relative'; wrapper.style.width = '100%'; wrapper.style.height = '100%';

		const svg = document.createElementNS(svgNS,'svg'); svg.setAttribute('viewBox','0 0 120 120'); svg.setAttribute('class','ring-svg');
		// golden ring
		const ring1 = document.createElementNS(svgNS,'circle'); ring1.setAttribute('cx','60'); ring1.setAttribute('cy','60'); ring1.setAttribute('r','28'); ring1.setAttribute('fill','none'); ring1.setAttribute('stroke','var(--sunflower)'); ring1.setAttribute('stroke-width','6'); ring1.setAttribute('class','ring');
		// silver ring slightly offset
		const ring2 = document.createElementNS(svgNS,'circle'); ring2.setAttribute('cx','72'); ring2.setAttribute('cy','68'); ring2.setAttribute('r','20'); ring2.setAttribute('fill','none'); ring2.setAttribute('stroke','#f3efe8'); ring2.setAttribute('stroke-width','4'); ring2.setAttribute('class','ring small');
		svg.appendChild(ring1); svg.appendChild(ring2);
		wrapper.appendChild(svg);
		// append and remove after animation loop to avoid DOM bloat
		container.appendChild(wrapper);
		setTimeout(()=>{ try{ wrapper.remove(); }catch(e){} }, 12000);
	}catch(e){console.warn(e)}
}

// Generate Instagram Story PNG (canvas) and download
function generateStoryPNG(){
	const width = 1080, height = 1920; // story size
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const ctx = canvas.getContext('2d');
	// background soft gradient
	const g = ctx.createLinearGradient(0,0,0,height);
	g.addColorStop(0, '#f7fff9'); g.addColorStop(1, '#eaffef');
	ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
	// optional background photo: try load hero image
	const hero = document.querySelector('.story.s1');
	const bgSrc = hero?.getAttribute('data-bg');
	return new Promise((resolve)=>{
		if(bgSrc){
			const img = new Image(); img.crossOrigin='anonymous'; img.src = bgSrc;
			img.onload = ()=>{
				// draw blurred background scaled
				const ratio = Math.max(width/img.width, height/img.height);
				const iw = img.width*ratio, ih = img.height*ratio;
				ctx.globalAlpha = 0.22; ctx.drawImage(img, (width-iw)/2, (height-ih)/2, iw, ih); ctx.globalAlpha = 1;
				drawTextAndLogo();
			};
			img.onerror = ()=> drawTextAndLogo();
		}else drawTextAndLogo();

		function drawTextAndLogo(){
			// title (Great Vibes style)
			ctx.fillStyle = 'rgba(20,60,30,0.95)';
			ctx.font = '84px Great Vibes, cursive'; ctx.textAlign = 'center';
			ctx.fillText('Daniel  &  Ana', width/2, height*0.42);
			// date
			ctx.font = '36px Montserrat, sans-serif'; ctx.fillText('20 de diciembre de 2025 — 4:00 p.m.', width/2, height*0.48);
			// small caption
			ctx.font = '28px Montserrat, sans-serif'; ctx.fillStyle = 'rgba(20,60,30,0.85)'; ctx.fillText('¡Nos casamos! Comparte nuestra historia', width/2, height*0.56);
			// sunflower mark bottom-right
			ctx.fillStyle = 'var(--sunflower)'; ctx.beginPath(); ctx.arc(width*0.85, height*0.78, 80, 0, Math.PI*2); ctx.fill();
			ctx.fillStyle = 'var(--sunflower-center)'; ctx.beginPath(); ctx.arc(width*0.85, height*0.78, 36, 0, Math.PI*2); ctx.fill();
			// finalize
			canvas.toBlob((blob)=>{
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a'); a.href = url; a.download = 'story-daniel-ana.png'; a.click(); URL.revokeObjectURL(url);
				resolve(true);
			}, 'image/png');
		}
	});
}


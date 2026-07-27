/* ================================================================
   Java Streams Deep-Dive — Animated Factory Engine
   ================================================================ */

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. PARTICLE SYSTEM (Horizontal Stream Liquid Bubbles)
  // ----------------------------------------------------------------
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class LiquidBubble {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 0.6 + 0.2; // Move horizontally right like a stream
      this.speedY = (Math.random() - 0.5) * 0.2;
      this.opacity = Math.random() * 0.6 + 0.2;
      // Cyan (185), Lime (150), Amber (40), Pink (330)
      const hues = [185, 150, 40, 330];
      this.hue = hues[Math.floor(Math.random() * hues.length)];
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += 0.03;
      if (this.x > canvas.width + 10) this.x = -10;
      if (this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      const glow = Math.sin(this.pulse) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${this.opacity * glow})`;
      ctx.fill();

      if (this.size > 2) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 95%, 65%, ${this.opacity * glow * 0.15})`;
        ctx.fill();
      }
    }
  }

  const BUBBLE_COUNT = Math.min(120, Math.floor(window.innerWidth * 0.09));
  const bubbles = Array.from({ length: BUBBLE_COUNT }, () => new LiquidBubble());

  function animateBubbles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stream lines connecting nearby bubbles horizontally
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const dx = bubbles[i].x - bubbles[j].x;
        const dy = bubbles[i].y - bubbles[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < 6000) {
          ctx.beginPath();
          ctx.moveTo(bubbles[i].x, bubbles[i].y);
          ctx.lineTo(bubbles[j].x, bubbles[j].y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.04 * (1 - dist / 6000)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    bubbles.forEach(b => { b.update(); b.draw(); });
    requestAnimationFrame(animateBubbles);
  }
  animateBubbles();

  // ----------------------------------------------------------------
  // 2. SECTIONS & INTERSECTION OBSERVER
  // ----------------------------------------------------------------
  const sections = document.querySelectorAll('.section');
  const navDots = document.querySelectorAll('.nav-dot');
  const progressBar = document.getElementById('progress-bar');
  let currentSection = 0;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -20% 0px',
    threshold: 0.3,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Array.from(sections).indexOf(entry.target);
        if (idx !== -1) activateSection(idx);
      }
    });
  }, observerOptions);

  sections.forEach(s => sectionObserver.observe(s));

  function activateSection(idx) {
    if (idx === currentSection && sections[idx].classList.contains('active')) return;
    currentSection = idx;

    sections.forEach((s, i) => {
      if (i === idx) {
        s.classList.add('active');
      } else {
        if (i > idx) s.classList.remove('active');
      }
    });

    navDots.forEach((d, i) => d.classList.toggle('active', i === idx));
    const progress = ((idx + 1) / sections.length) * 100;
    progressBar.style.width = progress + '%';
  }

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.section);
      sections[idx].scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ----------------------------------------------------------------
  // 3. INTERACTIVE FACTORY PIPELINE SIMULATORS
  // ----------------------------------------------------------------

  // Sim 1: General Fruit -> Juice Stream
  window.runStreamSim1 = function () {
    const track = document.getElementById('track-sim1');
    if (!track) return;

    // Remove existing animated bubbles
    track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());

    const items = [
      { emoji: '🍎', isFruit: true, juice: '🧃' },
      { emoji: '🍕', isFruit: false, juice: '❌' },
      { emoji: '🍌', isFruit: true, juice: '🍹' },
      { emoji: '🥦', isFruit: false, juice: '❌' }
    ];

    items.forEach((item, index) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'data-packet-bubble';
        bubble.textContent = item.emoji;
        bubble.style.left = '5%';
        bubble.style.top = '25%';
        track.appendChild(bubble);

        // Step 1: Move to Filter Node
        setTimeout(() => {
          bubble.style.left = '32%';
          if (!item.isFruit) {
            // Rejected at filter!
            bubble.classList.add('rejected');
            bubble.textContent = '❌';
            setTimeout(() => bubble.remove(), 1200);
          } else {
            // Passed filter -> Move to Map Node
            bubble.classList.add('passed');
            setTimeout(() => {
              bubble.style.left = '60%';
              // Morph at map station!
              bubble.textContent = item.juice;
              bubble.style.borderColor = 'var(--pink)';
              bubble.style.boxShadow = '0 0 16px var(--pink)';

              // Move to Terminal Collect
              setTimeout(() => {
                bubble.style.left = '88%';
                bubble.style.borderColor = 'var(--lime)';
                bubble.style.boxShadow = '0 0 16px var(--lime)';
                setTimeout(() => bubble.remove(), 1500);
              }, 900);
            }, 900);
          }
        }, 800);
      }, index * 1200);
    });
  };

  // Sim 2: Filter Numbers > 5
  window.runFilterSim = function () {
    const track = document.getElementById('track-filter');
    if (!track) return;

    track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());

    const numbers = [2, 8, 3, 9, 1];

    numbers.forEach((num, index) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'data-packet-bubble';
        bubble.textContent = num;
        bubble.style.left = '10%';
        bubble.style.top = '25%';
        track.appendChild(bubble);

        setTimeout(() => {
          bubble.style.left = '45%';
          if (num <= 5) {
            // Rejected
            bubble.classList.add('rejected');
            setTimeout(() => bubble.remove(), 1000);
          } else {
            // Passed!
            bubble.classList.add('passed');
            setTimeout(() => {
              bubble.style.left = '82%';
              setTimeout(() => bubble.remove(), 1200);
            }, 800);
          }
        }, 800);
      }, index * 1000);
    });
  };

  // Sim 3: Map Words to Word Length
  window.runMapSim = function () {
    const track = document.getElementById('track-map');
    if (!track) return;

    track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());

    const words = [
      { text: 'Cat', len: 3 },
      { text: 'Dragon', len: 6 }
    ];

    words.forEach((item, index) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'data-packet-bubble';
        bubble.style.width = 'auto';
        bubble.style.borderRadius = '2rem';
        bubble.style.padding = '0.4rem 0.8rem';
        bubble.textContent = `"${item.text}"`;
        bubble.style.left = '8%';
        bubble.style.top = '25%';
        track.appendChild(bubble);

        setTimeout(() => {
          bubble.style.left = '45%';
          bubble.textContent = `len: ${item.len}`;
          bubble.style.borderColor = 'var(--pink)';
          bubble.style.boxShadow = '0 0 16px var(--pink)';

          setTimeout(() => {
            bubble.style.left = '80%';
            bubble.textContent = item.len;
            bubble.style.borderColor = 'var(--lime)';
            bubble.style.boxShadow = '0 0 16px var(--lime)';
            setTimeout(() => bubble.remove(), 1200);
          }, 900);
        }, 900);
      }, index * 1500);
    });
  };

  // Sim 4: Lazy Valve Toggle
  let valveOpen = false;
  window.toggleLazyValve = function () {
    valveOpen = !valveOpen;
    const btnStatus = document.getElementById('valve-status');
    const track = document.getElementById('track-lazy');
    if (!btnStatus || !track) return;

    if (valveOpen) {
      btnStatus.textContent = 'OPEN! (Flowing!)';
      btnStatus.style.color = 'var(--lime)';

      // Instantly launch flowing data bubbles
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const bubble = document.createElement('div');
          bubble.className = 'data-packet-bubble passed';
          bubble.textContent = '⚡';
          bubble.style.left = '10%';
          bubble.style.top = '25%';
          track.appendChild(bubble);

          setTimeout(() => {
            bubble.style.left = '40%';
            setTimeout(() => {
              bubble.style.left = '68%';
              setTimeout(() => {
                bubble.style.left = '88%';
                setTimeout(() => bubble.remove(), 800);
              }, 500);
            }, 500);
          }, 500);
        }, i * 600);
      }
    } else {
      btnStatus.textContent = 'CLOSED (Lazy)';
      btnStatus.style.color = 'var(--pink)';
      track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());
    }
  };

  // ----------------------------------------------------------------
  // 4. AUTO-PLAY MODE
  // ----------------------------------------------------------------
  let autoplayInterval = null;
  let isAutoplay = false;
  const btnAutoplay = document.getElementById('btn-autoplay');

  btnAutoplay.addEventListener('click', () => {
    isAutoplay = !isAutoplay;
    btnAutoplay.classList.toggle('active', isAutoplay);
    btnAutoplay.textContent = isAutoplay ? '⏸ Pause' : '▶ Auto-Play';

    if (isAutoplay) {
      autoplayInterval = setInterval(() => {
        if (currentSection < sections.length - 1) {
          sections[currentSection + 1].scrollIntoView({ behavior: 'smooth' });
        } else {
          clearInterval(autoplayInterval);
          isAutoplay = false;
          btnAutoplay.classList.remove('active');
          btnAutoplay.textContent = '▶ Auto-Play';
        }
      }, 8000);
    } else {
      clearInterval(autoplayInterval);
    }
  });

  // ----------------------------------------------------------------
  // 5. AMBIENT AUDIO (Web Audio API — Cheerful Pentatonic Factory Pad)
  // ----------------------------------------------------------------
  let audioCtx = null;
  let audioPlaying = false;
  let masterGain = null;
  let oscillators = [];
  const btnAudio = document.getElementById('btn-audio');

  function createAmbientAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    // Cheerful C Major Pentatonic: C3 (130.81), G3 (196.0), C4 (261.63), E4 (329.63)
    const frequencies = [130.81, 196.0, 261.63, 329.63];
    frequencies.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = Math.random() * 6 - 3;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      oscillators.push(osc);
    });
  }

  btnAudio.addEventListener('click', () => {
    if (!audioCtx) createAmbientAudio();

    audioPlaying = !audioPlaying;
    btnAudio.classList.toggle('active', audioPlaying);
    btnAudio.textContent = audioPlaying ? '🔊 Audio' : '🔇 Audio';

    const now = audioCtx.currentTime;
    if (audioPlaying) {
      audioCtx.resume();
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0.4, now + 2);
    } else {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 1);
    }
  });

  // ----------------------------------------------------------------
  // 6. KEYBOARD NAVIGATION & INITIALIZATION
  // ----------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      if (currentSection < sections.length - 1) {
        sections[currentSection + 1].scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentSection > 0) {
        sections[currentSection - 1].scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      sections[0].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      sections[sections.length - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  activateSection(0);

  console.log(
    '%c🚀 Java Streams Factory loaded! Scroll or press ↓ to explore.',
    'color: #06b6d4; font-size: 14px; font-family: sans-serif;'
  );

})();

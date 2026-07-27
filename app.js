/* ================================================================
   Java Streams Deep-Dive — Voice-Synchronized Auto-Play Engine
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
      this.speedX = Math.random() * 0.5 + 0.2;
      this.speedY = (Math.random() - 0.5) * 0.2;
      this.opacity = Math.random() * 0.5 + 0.2;
      const hues = [185, 150, 40, 330];
      this.hue = hues[Math.floor(Math.random() * hues.length)];
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += 0.025;
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

  const BUBBLE_COUNT = Math.min(100, Math.floor(window.innerWidth * 0.08));
  const bubbles = Array.from({ length: BUBBLE_COUNT }, () => new LiquidBubble());

  function animateBubbles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
  // 2. STATE & TEACHER VOICE ENGINE (Web Speech API)
  // ----------------------------------------------------------------
  let isVoiceEnabled = false;
  let isAutoplay = false;
  let autoplayTimer = null;
  const synth = window.speechSynthesis;

  const btnVoice = document.getElementById('btn-voice');
  const btnAutoplay = document.getElementById('btn-autoplay');
  const sections = document.querySelectorAll('.section');
  const navDots = document.querySelectorAll('.nav-dot');
  const progressBar = document.getElementById('progress-bar');
  let currentSection = 0;

  const teacherScripts = [
    // 0. Hook
    "Hello there! Imagine standing inside a giant candy factory. You have a long conveyor belt. On one end, fruits roll in. As they move, different machines wash them, cut them, and package them into boxes. In Java, a Stream is just like that conveyor belt! It doesn't store things; it carries your data step by step.",

    // 1. Stream vs Collection
    "Let's learn the difference between a List and a Stream! Imagine a bucket filled with water. The bucket holds all the water at once. That is a List! Now, imagine a garden hose. Water doesn't sit inside the hose; it flows through when you turn on the tap! That is a Stream! Streams let data flow on demand.",

    // 2. The 3 Stages
    "Every Java Stream has three simple steps, like baking a cake! Step 1: Gather your raw ingredients from the Source. Step 2: Mix, chop, and filter your ingredients in the Intermediate operations. Step 3: Bake and put the finished cake into a box with the Terminal operation!",

    // 3. Source Station
    "Stage one is the Source! Think of it like turning on the supply faucet. Data can start flowing out of a List of toys, an array of numbers, a text file on your computer, or even an infinite random number generator!",

    // 4. filter()
    "Look at the Filter Gate! Imagine you have a basket of apples, bananas, and a slice of pizza. You tell the worker at the gate: Only let red apples pass through! So the worker looks at an apple. Is it red? Yes! It goes down the belt. Then the worker looks at the pizza. Is it a red apple? No! So the worker tosses the pizza into the trash. That is how filter works in Java code!",

    // 5. map()
    "Now look at the Map machine! Map is a magic transformation box. An apple enters the box. Inside, squish! It turns into a bottle of apple juice! Next, an orange enters. Inside, squish! It turns into orange juice! The number of items stays the same, but map changes every item into something new!",

    // 6. flatMap()
    "What if you have three wrapped gift boxes? If you use regular map, you just get three boxes. But flatMap opens every gift box and dumps all the toys out onto the belt, making one long, flat row of toys! It flattens nested boxes into a single stream.",

    // 7. sorted and peek
    "Sorted is like a temporary waiting room. Items pause on the conveyor belt so the machine can line them up in alphabetical order from A to Z! Peek is a small glass window above the belt. It lets you inspect each item for debugging without changing it.",

    // 8. Lazy Evaluation
    "Here is the coolest magic trick of all! It is called Lazy Evaluation. Imagine building a super long waterslide with ten twists and loops. But guess what? Not a single drop of water flows down the slide until someone turns the red valve at the very end! In Java, all your filters and maps wait patiently. Nothing actually moves until you call a terminal method like collect!",

    // 9. Short-Circuiting
    "Short circuiting saves time! Imagine your teacher asks you to find one blue crayon in your art box. You open the box, pick up the very first blue crayon, and stop searching immediately! Operations like limit or findFirst stop the stream as soon as they get what they need.",

    // 10. collect()
    "The Terminal operation is the final stop! It turns on the water tap and collects all your transformed data items into a neat List, a Set, or calculates a final total sum!",

    // 11. Recap
    "Hooray! You are now a Java Streams master! Just remember the golden formula: Start at the Source, process with Intermediate steps, and finish with a Terminal operation. Great job learning!"
  ];

  function speakTeacherScript(sectionIndex) {
    if (!synth) return;
    synth.cancel(); // Stop any active speech
    if (autoplayTimer) clearTimeout(autoplayTimer);

    if (!isVoiceEnabled) {
      // If voice is disabled but Auto-Play is ON, use a 10s timer fallback
      if (isAutoplay) {
        autoplayTimer = setTimeout(() => advanceNextSection(), 10000);
      }
      return;
    }

    const text = teacherScripts[sectionIndex];
    if (!text) return;

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let sentenceIndex = 0;

    function speakNextSentence() {
      if (!isVoiceEnabled || sentenceIndex >= sentences.length) {
        // Voice finished for this entire section!
        if (isAutoplay && isVoiceEnabled) {
          // Wait 1.5 seconds after speaking before advancing to next section
          autoplayTimer = setTimeout(() => {
            advanceNextSection();
          }, 1500);
        }
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex].trim());
      utterance.pitch = 1.05;
      utterance.rate = 0.87;

      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        sentenceIndex++;
        if (sentenceIndex < sentences.length) {
          setTimeout(speakNextSentence, 200);
        } else {
          // Last sentence finished!
          if (isAutoplay && isVoiceEnabled) {
            autoplayTimer = setTimeout(() => {
              advanceNextSection();
            }, 1500);
          }
        }
      };

      utterance.onerror = () => {
        if (isAutoplay) {
          autoplayTimer = setTimeout(() => advanceNextSection(), 2000);
        }
      };

      synth.speak(utterance);
    }

    speakNextSentence();
  }

  function advanceNextSection() {
    if (currentSection < sections.length - 1) {
      sections[currentSection + 1].scrollIntoView({ behavior: 'smooth' });
    } else {
      // Reached the end section! Stop autoplay
      stopAutoplay();
    }
  }

  function stopAutoplay() {
    isAutoplay = false;
    if (autoplayTimer) clearTimeout(autoplayTimer);
    btnAutoplay.classList.remove('active');
    btnAutoplay.textContent = '▶ Auto-Play';
  }

  // Voice Toggle Button
  if (btnVoice) {
    btnVoice.addEventListener('click', () => {
      isVoiceEnabled = !isVoiceEnabled;
      btnVoice.classList.toggle('active', isVoiceEnabled);
      btnVoice.textContent = isVoiceEnabled ? '🎙️ Teacher Voice: ON' : '🎙️ Teacher Voice: OFF';

      if (isVoiceEnabled) {
        speakTeacherScript(currentSection);
      } else {
        if (synth) synth.cancel();
      }
    });
  }

  // Auto-Play Button
  if (btnAutoplay) {
    btnAutoplay.addEventListener('click', () => {
      isAutoplay = !isAutoplay;
      btnAutoplay.classList.toggle('active', isAutoplay);
      btnAutoplay.textContent = isAutoplay ? '⏸ Pause' : '▶ Auto-Play';

      if (isAutoplay) {
        // Start speaking/advancing from current section
        speakTeacherScript(currentSection);
      } else {
        stopAutoplay();
      }
    });
  }

  // ----------------------------------------------------------------
  // 3. SECTIONS & INTERSECTION OBSERVER
  // ----------------------------------------------------------------
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

    // Speak teacher script (and auto-advance when done if autoplay is ON)
    speakTeacherScript(idx);
  }

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.section);
      sections[idx].scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ----------------------------------------------------------------
  // 4. BALANCED INTERACTIVE PIPELINE SIMULATORS
  // ----------------------------------------------------------------

  // Sim 1: Fruit -> Juice Stream
  window.runStreamSim1 = function () {
    const track = document.getElementById('track-sim1');
    if (!track) return;

    track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());

    const items = [
      { emoji: '🍎', label: 'Apple', isFruit: true, juice: '🧃' },
      { emoji: '🍕', label: 'Pizza', isFruit: false, juice: '❌' },
      { emoji: '🍌', label: 'Banana', isFruit: true, juice: '🍹' },
    ];

    items.forEach((item, index) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'data-packet-bubble';
        bubble.innerHTML = `<span>${item.emoji}</span><small style="font-size:0.6rem;display:block;">${item.label}</small>`;
        bubble.style.left = '5%';
        bubble.style.top = '15%';
        track.appendChild(bubble);

        setTimeout(() => {
          bubble.style.left = '32%';
          if (!item.isFruit) {
            bubble.classList.add('rejected');
            bubble.innerHTML = `<span>❌</span><small style="font-size:0.55rem;">Tossed Out!</small>`;
            setTimeout(() => bubble.remove(), 1400);
          } else {
            bubble.classList.add('passed');
            setTimeout(() => {
              bubble.style.left = '60%';
              bubble.innerHTML = `<span>${item.juice}</span><small style="font-size:0.55rem;">Morphed!</small>`;
              bubble.style.borderColor = 'var(--pink)';

              setTimeout(() => {
                bubble.style.left = '88%';
                bubble.style.borderColor = 'var(--lime)';
                setTimeout(() => bubble.remove(), 1400);
              }, 1200);
            }, 1200);
          }
        }, 1200);
      }, index * 1600);
    });
  };

  // Sim 2: Filter Numbers > 5
  window.runFilterSim = function () {
    const track = document.getElementById('track-filter');
    if (!track) return;

    track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());

    const numbers = [2, 8, 3, 9];

    numbers.forEach((num, index) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'data-packet-bubble';
        bubble.innerHTML = `<span>${num}</span>`;
        bubble.style.left = '8%';
        bubble.style.top = '20%';
        track.appendChild(bubble);

        setTimeout(() => {
          bubble.style.left = '45%';
          if (num <= 5) {
            bubble.classList.add('rejected');
            bubble.innerHTML = `<span>${num}</span><small style="font-size:0.55rem;">≤5 Drop!</small>`;
            setTimeout(() => bubble.remove(), 1400);
          } else {
            bubble.classList.add('passed');
            bubble.innerHTML = `<span>${num}</span><small style="font-size:0.55rem;">&gt;5 Pass!</small>`;
            setTimeout(() => {
              bubble.style.left = '82%';
              setTimeout(() => bubble.remove(), 1400);
            }, 1100);
          }
        }, 1100);
      }, index * 1500);
    });
  };

  // Sim 3: Map Words to Length
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
        bubble.style.padding = '0.4rem 0.9rem';
        bubble.textContent = `"${item.text}"`;
        bubble.style.left = '8%';
        bubble.style.top = '20%';
        track.appendChild(bubble);

        setTimeout(() => {
          bubble.style.left = '45%';
          bubble.textContent = `Squish! -> len: ${item.len}`;
          bubble.style.borderColor = 'var(--pink)';

          setTimeout(() => {
            bubble.style.left = '80%';
            bubble.textContent = `Result: ${item.len}`;
            bubble.style.borderColor = 'var(--lime)';
            setTimeout(() => bubble.remove(), 1400);
          }, 1200);
        }, 1200);
      }, index * 1700);
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
      btnStatus.textContent = 'OPENED! (Data Starts Flowing!)';
      btnStatus.style.color = 'var(--lime)';

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const bubble = document.createElement('div');
          bubble.className = 'data-packet-bubble passed';
          bubble.textContent = '💧';
          bubble.style.left = '10%';
          bubble.style.top = '20%';
          track.appendChild(bubble);

          setTimeout(() => {
            bubble.style.left = '40%';
            setTimeout(() => {
              bubble.style.left = '68%';
              setTimeout(() => {
                bubble.style.left = '88%';
                setTimeout(() => bubble.remove(), 800);
              }, 700);
            }, 700);
          }, 700);
        }, i * 800);
      }
    } else {
      btnStatus.textContent = 'CLOSED (Lazy - No Data Moves)';
      btnStatus.style.color = 'var(--pink)';
      track.querySelectorAll('.data-packet-bubble').forEach(el => el.remove());
    }
  };

  // ----------------------------------------------------------------
  // 5. AMBIENT AUDIO
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

    const frequencies = [130.81, 196.0, 261.63, 329.63];
    frequencies.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = Math.random() * 6 - 3;
      gain.gain.value = 0.03;
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
      masterGain.gain.linearRampToValueAtTime(0.3, now + 2);
    } else {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 1);
    }
  });

  // ----------------------------------------------------------------
  // 6. KEYBOARD NAVIGATION
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
    '%c✨ Event-Driven Voice Synchronization enabled! Auto-Play advances ONLY after teacher voice finishes.',
    'color: #06b6d4; font-size: 14px; font-family: sans-serif;'
  );

})();

/* =========================================================
   POP-CALC // 24FPS ANIMATION ENGINE & CALCULATOR LOGIC
   ========================================================= */

(() => {
  // --- 1. 24FPS CANVAS FX ENGINE ---
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  const TARGET_FPS = 24;
  const FRAME_INTERVAL = 1000 / TARGET_FPS; // 41.666ms per frame
  let lastFrameTime = 0;

  const activeParticles = [];
  const activeCallouts = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function spawnComicBurst(x, y, word, accentColor = '#FFE600') {
    // Spawn comic onomatopoeia callout
    activeCallouts.push({
      x,
      y,
      word,
      color: accentColor,
      frame: 0,
      maxFrames: 16, // ~0.66s at 24fps
      angle: (Math.random() - 0.5) * 0.35
    });

    // Spawn 10 comic ink droplets / speed lines
    for (let i = 0; i < 10; i++) {
      const theta = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.4;
      const speed = 6 + Math.random() * 9;
      activeParticles.push({
        x,
        y,
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed,
        size: 4 + Math.random() * 5,
        color: i % 2 === 0 ? accentColor : '#121212',
        frame: 0,
        maxFrames: 12
      });
    }
  }

  function drawStarburst(cx, cy, spikes, outerR, innerR, fill, stroke) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  // Strict 24fps Render Loop
  function renderLoop(timestamp) {
    requestAnimationFrame(renderLoop);
    const delta = timestamp - lastFrameTime;
    if (delta < FRAME_INTERVAL) return;
    lastFrameTime = timestamp - (delta % FRAME_INTERVAL);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & Draw Ink Particles
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.frame++;

      const life = 1 - p.frame / p.maxFrames;
      if (life <= 0) {
        activeParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#121212';
      ctx.stroke();
    }

    // Update & Draw Comic Callouts
    for (let i = activeCallouts.length - 1; i >= 0; i--) {
      const c = activeCallouts[i];
      c.y -= 2.2;
      c.frame++;

      const progress = c.frame / c.maxFrames;
      if (progress >= 1) {
        activeCallouts.splice(i, 1);
        continue;
      }

      // 24fps stepped scale pop
      const scale = progress < 0.25 ? 0.6 + progress * 2.2 : 1.15 - (progress - 0.25) * 0.25;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.scale(scale, scale);

      drawStarburst(0, 0, 10, 48, 30, c.color, '#121212');

      ctx.font = '800 22px Bangers, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#121212';
      ctx.strokeText(c.word, 0, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(c.word, 0, 1);

      ctx.restore();
    }
  }
  requestAnimationFrame(renderLoop);

  // --- 2. WEB AUDIO RETRO COMIC SFX ---
  let sfxEnabled = true;
  let audioCtx = null;

  function playComicSFX(type) {
    if (!sfxEnabled) return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'num') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.055);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'op') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.09);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'equal') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(440, now + 0.05);
      osc.frequency.setValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'clear') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  // --- 3. CALCULATOR STATE & LOGIC ---
  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldResetScreen = false;
  let historyLog = [];

  const resultDisplay = document.getElementById('result-display');
  const exprDisplay = document.getElementById('expression-display');
  const displayPanel = document.getElementById('display-panel');
  const tapeList = document.getElementById('tape-list');

  function formatNumber(numStr) {
    if (numStr === 'ERR! ZERO!') return numStr;
    const [intPart, decPart] = numStr.split('.');
    const formattedInt = Number(intPart).toLocaleString('en-IN');
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  }

  function renderDisplay(isSlam = false) {
    const formatted = formatNumber(currentInput);
    resultDisplay.innerHTML = '';

    // Animate last digit or full slam
    if (isSlam) {
      resultDisplay.textContent = formatted;
      resultDisplay.classList.remove('result-slam');
      void resultDisplay.offsetWidth;
      resultDisplay.classList.add('result-slam');
    } else {
      const chars = formatted.split('');
      chars.forEach((ch, idx) => {
        const span = document.createElement('span');
        span.textContent = ch;
        if (idx === chars.length - 1) span.className = 'digit-pop';
        resultDisplay.appendChild(span);
      });
    }

    exprDisplay.textContent = operator ? `${formatNumber(previousInput)} ${operator}` : '\u00A0';
  }

  function addHistoryItem(expr, res) {
    historyLog.unshift({ expr, res });
    if (historyLog.length > 12) historyLog.pop();
    renderTape();
  }

  function renderTape() {
    if (historyLog.length === 0) {
      tapeList.innerHTML = '<span class="tape-empty">READY FOR ACTION...</span>';
      return;
    }
    tapeList.innerHTML = historyLog
      .map(
        (item) =>
          `<div class="tape-item" data-val="${item.res}">${item.expr} = <strong>${formatNumber(item.res)}</strong></div>`
      )
      .join('');
  }

  tapeList.addEventListener('click', (e) => {
    const item = e.target.closest('.tape-item');
    if (!item) return;
    currentInput = item.dataset.val;
    shouldResetScreen = true;
    playComicSFX('num');
    renderDisplay(true);
  });

  document.getElementById('clear-tape').addEventListener('click', () => {
    historyLog = [];
    renderTape();
    playComicSFX('clear');
  });

  function appendNumber(num) {
    if (currentInput === 'ERR! ZERO!') currentInput = '0';
    if (shouldResetScreen) {
      currentInput = num === '.' ? '0.' : num;
      shouldResetScreen = false;
      renderDisplay();
      return;
    }
    if (num === '.' && currentInput.includes('.')) return;
    if (currentInput.replace(/[^0-9]/g, '').length >= 12) return;

    currentInput = currentInput === '0' && num !== '.' ? num : currentInput + num;
    renderDisplay();
  }

  function chooseOperator(op) {
    if (currentInput === 'ERR! ZERO!') return;
    if (operator !== null && !shouldResetScreen) {
      compute(false);
    }
    previousInput = currentInput;
    operator = op;
    shouldResetScreen = true;
    renderDisplay();
  }

  function compute(withBurst = true, btnRect = null) {
    if (operator === null || shouldResetScreen) return;
    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput);
    if (isNaN(prev) || isNaN(curr)) return;

    if (operator === '÷' && curr === 0) {
      currentInput = 'ERR! ZERO!';
      operator = null;
      previousInput = '';
      shouldResetScreen = true;
      displayPanel.classList.remove('panel-shake');
      void displayPanel.offsetWidth;
      displayPanel.classList.add('panel-shake');
      renderDisplay(true);
      if (btnRect) spawnComicBurst(btnRect.left + btnRect.width / 2, btnRect.top, 'KABOOM!', '#FF6B6B');
      return;
    }

    let computation = 0;
    switch (operator) {
      case '+': computation = prev + curr; break;
      case '-': computation = prev - curr; break;
      case '×': computation = prev * curr; break;
      case '÷': computation = prev / curr; break;
    }

    const cleanResult = String(Math.round(computation * 1e10) / 1e10);
    addHistoryItem(`${formatNumber(previousInput)} ${operator} ${formatNumber(currentInput)}`, cleanResult);

    currentInput = cleanResult;
    operator = null;
    previousInput = '';
    shouldResetScreen = true;
    renderDisplay(true);

    if (withBurst && btnRect) {
      const words = ['POW!', 'BAM!', 'ZAP!', 'SOLVED!', 'BOOM!'];
      const word = words[Math.floor(Math.random() * words.length)];
      spawnComicBurst(btnRect.left + btnRect.width / 2, btnRect.top - 10, word, '#FFE600');
    }
  }

  // --- 4. KEYPAD & KEYBOARD EVENTS ---
  document.getElementById('keypad').addEventListener('click', (e) => {
    const btn = e.target.closest('.comic-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    if (btn.dataset.num !== undefined) {
      playComicSFX('num');
      appendNumber(btn.dataset.num);
    } else if (btn.dataset.op !== undefined) {
      playComicSFX('op');
      chooseOperator(btn.dataset.op);
      spawnComicBurst(rect.left + rect.width / 2, rect.top, btn.dataset.op, '#00E5FF');
    } else if (btn.dataset.action === 'equals') {
      playComicSFX('equal');
      compute(true, rect);
    } else if (btn.dataset.action === 'clear') {
      playComicSFX('clear');
      currentInput = '0';
      previousInput = '';
      operator = null;
      shouldResetScreen = false;
      renderDisplay(true);
      spawnComicBurst(rect.left + rect.width / 2, rect.top, 'WIPE!', '#FF6B6B');
    } else if (btn.dataset.action === 'backspace') {
      playComicSFX('num');
      if (shouldResetScreen || currentInput === 'ERR! ZERO!') {
        currentInput = '0';
      } else {
        currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
      }
      renderDisplay();
    } else if (btn.dataset.action === 'percent') {
      playComicSFX('op');
      currentInput = String(parseFloat(currentInput) / 100);
      renderDisplay(true);
    } else if (btn.dataset.action === 'negate') {
      playComicSFX('num');
      if (currentInput !== '0' && currentInput !== 'ERR! ZERO!') {
        currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
        renderDisplay();
      }
    }
  });

  // Keyboard Support Synced with Button Press
  window.addEventListener('keydown', (e) => {
    const keyMap = e.key === '=' ? 'Enter' : e.key;
    const btn = document.querySelector(`.comic-btn[data-key="${keyMap}"]`);
    if (btn) {
      e.preventDefault();
      btn.classList.add('is-pressed');
      btn.click();
      setTimeout(() => btn.classList.remove('is-pressed'), 90);
    }
  });

  // --- 5. THEME & SFX SWITCHERS ---
  const themes = ['halftone', 'spider', 'golden'];
  let themeIdx = 0;

  document.getElementById('theme-cycle').addEventListener('click', (e) => {
    themeIdx = (themeIdx + 1) % themes.length;
    document.documentElement.setAttribute('data-theme', themes[themeIdx]);
    playComicSFX('op');
    const rect = e.target.getBoundingClientRect();
    spawnComicBurst(rect.left, rect.bottom + 20, themes[themeIdx].toUpperCase(), '#00E5FF');
  });

  document.getElementById('sfx-toggle').addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    document.getElementById('sfx-icon').textContent = sfxEnabled ? '🔊' : '🔇';
    if (sfxEnabled) playComicSFX('num');
  });

  // Register Offline Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();

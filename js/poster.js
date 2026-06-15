// poster.js — generate a shareable result poster (Canvas) for a finished match
// and share it via the Web Share API, with a download fallback.

function mdLoadImg(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';          // flagcdn supports CORS → canvas stays exportable
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Original, generated stadium atmosphere — no photos, no copyright.
function drawAtmosphere(ctx, W, H, homeColor, awayColor) {
  // Diagonal light shafts from the top (floodlights)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const beam = (x0, x1, color, alpha) => {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, color + alpha);
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, 0); ctx.lineTo(x1, 0);
    ctx.lineTo(x1 + 140, H * 0.62); ctx.lineTo(x0 - 140, H * 0.62);
    ctx.closePath(); ctx.fill();
  };
  beam(W * 0.16, W * 0.30, '#ffffff', '16');
  beam(W * 0.70, W * 0.84, '#ffffff', '12');
  beam(W * 0.44, W * 0.56, '#f0a500', '14');
  ctx.restore();

  // Bokeh stadium lights / distant crowd sparkle (upper area)
  for (let i = 0; i < 46; i++) {
    const x = Math.random() * W, y = Math.random() * H * 0.46, r = Math.random() * 4 + 1;
    ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.12 + 0.02).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Confetti in the two team colours + gold
  const colors = [homeColor, awayColor, '#f0a500', '#ffffff'];
  for (let i = 0; i < 64; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const w = Math.random() * 8 + 3, h = Math.random() * 14 + 5;
    ctx.save();
    ctx.globalAlpha = Math.random() * 0.18 + 0.04;
    ctx.fillStyle = colors[i % colors.length];
    ctx.translate(x, y); ctx.rotate(Math.random() * Math.PI);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Vignette to focus the centre
  const vg = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.22, W / 2, H * 0.5, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCircleFlag(ctx, img, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath();
  ctx.clip();
  if (img) {
    const size = r * 2;
    const scale = Math.max(size / img.width, size / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else { ctx.fillStyle = color; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.stroke();
}

// Look up a free Creative-Commons player photo from Wikimedia (via Wikipedia
// pageimages). Wikimedia serves CORS headers, so the result is canvas-safe.
async function fetchWikiThumb(name, size) {
  try {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&titles='
      + encodeURIComponent(name) + '&prop=pageimages&format=json&pithumbsize='
      + (size || 200) + '&redirects=1&origin=*';
    const r = await fetch(url);
    const d = await r.json();
    const pages = d.query && d.query.pages;
    if (!pages) return null;
    const p = Object.values(pages)[0];
    return (p && p.thumbnail && p.thumbnail.source) || null;
  } catch (e) { return null; }
}

function extractScorers(summary) {
  if (!summary || !summary.keyEvents) return [];
  const homeId = summary.rosters?.find(r => r.homeAway === 'home')?.team?.id;
  return summary.keyEvents
    .filter(e => /goal/i.test(e.type?.text || '') && !/disallow|cancel/i.test(e.type?.text || ''))
    .map(e => ({
      name: e.participants?.[0]?.athlete?.displayName || '',
      id: e.participants?.[0]?.athlete?.id,
      min: e.clock?.displayValue || '',
      home: String(e.team?.id) === String(homeId),
      own: /own/i.test(e.type?.text || ''),
    }))
    .filter(s => s.name);
}

async function buildMatchPoster(m, sc, summary) {
  const W = 1080, H = 1920;                       // 9:16 story format
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const homeColor = (typeof getTeamColor === 'function' && getTeamColor(m.home)) || '#f0a500';
  const awayColor = (typeof getTeamColor === 'function' && getTeamColor(m.away)) || '#4cc9f0';
  const code = (typeof getCountryCode === 'function') ? getCountryCode : (() => 'un');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0a1a');
  bg.addColorStop(0.5, '#160a28');
  bg.addColorStop(1, '#0a1422');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = (x, y, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 420);
    g.addColorStop(0, color + '2e'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  glow(250, 760, homeColor); glow(830, 760, awayColor);
  drawAtmosphere(ctx, W, H, homeColor, awayColor);

  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, W - 56, H - 56, 36); ctx.stroke();

  // Brand
  ctx.fillStyle = '#f0a500';
  ctx.font = '900 italic 120px system-ui, sans-serif';
  ctx.fillText('Gol!', W / 2, 220);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 38px system-ui, sans-serif';
  ctx.fillText('FIFA WORLD CUP 2026', W / 2, 280);

  // Status pill
  const live = sc.status === 'LIVE';
  const pillText = live ? ('● LIVE ' + (sc.clock || '')).trim() : 'FULL TIME';
  ctx.font = '800 36px system-ui, sans-serif';
  const pw = ctx.measureText(pillText).width + 80;
  ctx.fillStyle = live ? 'rgba(74,222,128,0.20)' : 'rgba(255,255,255,0.08)';
  roundRect(ctx, W / 2 - pw / 2, 330, pw, 72, 36); ctx.fill();
  ctx.fillStyle = live ? '#4ade80' : 'rgba(255,255,255,0.75)';
  ctx.fillText(pillText, W / 2, 378);

  // ── Pitch card ──
  const cardX = 70, cardY = 450, cardW = W - 140, cardH = 720;
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 28); ctx.clip();
  const pitch = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  pitch.addColorStop(0, '#0f3d22'); pitch.addColorStop(1, '#08251a');
  ctx.fillStyle = pitch; ctx.fillRect(cardX, cardY, cardW, cardH);
  // pitch markings
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2, cardY); ctx.lineTo(W / 2, cardY + cardH); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, cardY + cardH / 2, 130, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke();

  // Group badge on the card
  ctx.font = '800 34px system-ui, sans-serif';
  const gp = 'GROUP ' + m.group;
  const gpw = ctx.measureText(gp).width + 60;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, W / 2 - gpw / 2, cardY + 36, gpw, 60, 30); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(gp, W / 2, cardY + 77);

  // Circular flags
  const [hImg, aImg] = await Promise.all([
    mdLoadImg('https://flagcdn.com/w320/' + code(m.home) + '.png'),
    mdLoadImg('https://flagcdn.com/w320/' + code(m.away) + '.png'),
  ]);
  const flagCY = cardY + cardH / 2 - 10, fr = 150;
  drawCircleFlag(ctx, hImg, cardX + 200, flagCY, fr, homeColor);
  drawCircleFlag(ctx, aImg, cardX + cardW - 200, flagCY, fr, awayColor);

  // Score in the centre
  const h = sc.home >= 0 ? sc.home : 0, a = sc.away >= 0 ? sc.away : 0;
  ctx.fillStyle = '#fff'; ctx.font = '900 150px system-ui, sans-serif';
  ctx.fillText(`${h}–${a}`, W / 2, flagCY + 50);

  // Team names under flags
  ctx.fillStyle = '#fff'; ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillText(m.home, cardX + 200, cardY + cardH - 70);
  ctx.fillText(m.away, cardX + cardW - 200, cardY + cardH - 70);

  // ── Scorers ──
  const scorers = extractScorers(summary).slice(0, 6);
  let y = cardY + cardH + 80;
  if (scorers.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText('⚽  GOALS', W / 2, y);
    y += 60;
    // Load free Wikimedia photos for each scorer (canvas-safe via CORS)
    const photos = await Promise.all(scorers.map(async s => {
      const url = await fetchWikiThumb(s.name, 200);
      return url ? mdLoadImg(url) : null;
    }));
    const usedPhoto = photos.some(p => p);
    ctx.font = '600 36px system-ui, sans-serif';
    scorers.forEach((s, i) => {
      const dotColor = s.home ? homeColor : awayColor;
      const label = `${s.min}  ${s.name}${s.own ? ' (OG)' : ''}`;
      const tw = ctx.measureText(label).width;
      const photo = photos[i];
      const ph = photo ? 56 : 0;
      const total = ph + (photo ? 18 : 0) + tw;
      let x = W / 2 - total / 2;
      if (photo) {
        ctx.save();
        ctx.beginPath(); ctx.arc(x + 28, y - 12, 28, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(photo, x, y - 40, 56, 56);
        ctx.restore();
        ctx.beginPath(); ctx.arc(x + 28, y - 12, 28, 0, Math.PI * 2);
        ctx.strokeStyle = dotColor; ctx.lineWidth = 3; ctx.stroke();
        x += ph + 18;
      } else {
        ctx.fillStyle = dotColor;
        ctx.beginPath(); ctx.arc(x - 18, y - 12, 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.fillText(label, x, y);
      ctx.textAlign = 'center';
      y += 64;
    });
    if (usedPhoto) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.font = '400 22px system-ui, sans-serif';
      ctx.fillText('Player photos: Wikimedia Commons (CC)', W / 2, H - 232);
    }
  }

  // Meta + footer (anchored to bottom)
  const d = new Date(m.date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '500 32px system-ui, sans-serif';
  ctx.fillText(`${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}  ·  ${m.venue}`, W / 2, H - 200);

  ctx.fillStyle = '#f0a500';
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.fillText('getgol.in', W / 2, H - 120);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '500 32px system-ui, sans-serif';
  ctx.fillText('Track every World Cup 2026 match', W / 2, H - 72);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function shareMatchPoster(matchId) {
  const m = MATCHES.find(x => String(x.id) === String(matchId));
  if (!m) return;
  const sc = window.LIVE && window.LIVE.score(matchId);
  if (!sc || (sc.status !== 'FT' && sc.status !== 'LIVE')) {
    alert('A poster can be shared once the match has a score.');
    return;
  }

  const btn = document.getElementById('md-share-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }

  try {
    // Reuse the summary already loaded by the match detail view (for scorers)
    const summary = (typeof MD !== 'undefined' && MD.match && String(MD.match.id) === String(matchId)) ? MD.data : null;
    const blob = await buildMatchPoster(m, sc, summary);
    const file = new File([blob], `gol-${m.home}-vs-${m.away}.png`, { type: 'image/png' });
    const shareText = `${m.home} ${sc.home}–${sc.away} ${m.away} · FIFA World Cup 2026 — follow every match at getgol.in`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Gol! match result', text: shareText });
    } else {
      // Desktop / unsupported: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
  } catch (e) {
    if (e && e.name !== 'AbortError') alert('Could not create the poster. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '📤 Share result'; }
  }
}

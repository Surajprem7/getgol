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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function buildMatchPoster(m, sc) {
  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const homeColor = (typeof getTeamColor === 'function' && getTeamColor(m.home)) || '#f0a500';
  const awayColor = (typeof getTeamColor === 'function' && getTeamColor(m.away)) || '#4cc9f0';

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a1a');
  bg.addColorStop(0.5, '#1a0a2e');
  bg.addColorStop(1, '#0a1a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft team-colour glows behind each side
  const glow = (x, color) => {
    const g = ctx.createRadialGradient(x, 470, 0, x, 470, 360);
    g.addColorStop(0, color + '33');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(280, homeColor);
  glow(800, awayColor);

  // Outer border
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, W - 48, H - 48, 32);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Brand
  ctx.fillStyle = '#f0a500';
  ctx.font = '900 italic 96px system-ui, sans-serif';
  ctx.fillText('Gol!', W / 2, 150);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText('FIFA WORLD CUP 2026', W / 2, 200);

  // FULL TIME pill
  const live = sc.status === 'LIVE';
  const pillText = live ? 'LIVE' : 'FULL TIME';
  ctx.font = '800 30px system-ui, sans-serif';
  const pw = ctx.measureText(pillText).width + 70;
  ctx.fillStyle = live ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.08)';
  roundRect(ctx, W / 2 - pw / 2, 240, pw, 60, 30);
  ctx.fill();
  ctx.fillStyle = live ? '#4ade80' : 'rgba(255,255,255,0.7)';
  ctx.fillText(pillText, W / 2, 280);

  // Flags
  const code = (typeof getCountryCode === 'function') ? getCountryCode : (() => 'un');
  const [hImg, aImg] = await Promise.all([
    mdLoadImg('https://flagcdn.com/w320/' + code(m.home) + '.png'),
    mdLoadImg('https://flagcdn.com/w320/' + code(m.away) + '.png'),
  ]);
  const fw = 260, fh = 195, fy = 380;
  const hx = 150, ax = W - 150 - fw;
  const drawFlag = (img, x, color) => {
    ctx.save();
    roundRect(ctx, x, fy, fw, fh, 16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.clip();
    if (img) ctx.drawImage(img, x, fy, fw, fh);
    else { ctx.fillStyle = color; ctx.fillRect(x, fy, fw, fh); }
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, fy, fw, fh, 16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  };
  drawFlag(hImg, hx, homeColor);
  drawFlag(aImg, ax, awayColor);

  // Score (or VS) in the centre
  const h = sc.home >= 0 ? sc.home : 0;
  const a = sc.away >= 0 ? sc.away : 0;
  ctx.fillStyle = '#fff';
  ctx.font = '900 150px system-ui, sans-serif';
  ctx.fillText(`${h}–${a}`, W / 2, 510);

  // Team names under flags
  ctx.fillStyle = '#fff';
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.fillText(m.home, hx + fw / 2, 650);
  ctx.fillText(m.away, ax + fw / 2, 650);

  // Meta: group · date
  const d = new Date(m.date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 36px system-ui, sans-serif';
  ctx.fillText(`Group ${m.group}  ·  ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`, W / 2, 770);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '400 28px system-ui, sans-serif';
  ctx.fillText(m.venue, W / 2, 820);

  // Footer
  ctx.fillStyle = '#f0a500';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('getgol.in', W / 2, 985);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '500 28px system-ui, sans-serif';
  ctx.fillText('Track every World Cup 2026 match', W / 2, 1030);

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
    const blob = await buildMatchPoster(m, sc);
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

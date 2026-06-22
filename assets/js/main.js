
(function () {
  const site = document.querySelector('.site');
  const svg = document.getElementById('routeSvg');
  const NS = 'http://www.w3.org/2000/svg';
  const STOP_R = 17;
  const CORE_R = 7;
  const CORNER = 28;

  function relRect(el) {
    const a = el.getBoundingClientRect();
    const b = site.getBoundingClientRect();
    return {
      left: a.left - b.left,
      top: a.top - b.top,
      width: a.width,
      height: a.height,
      right: a.right - b.left,
      bottom: a.bottom - b.top,
      cx: a.left - b.left + a.width / 2,
      cy: a.top - b.top + a.height / 2
    };
  }

  function pointTowards(from, to, dist) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: from.x + dx * dist / len, y: from.y + dy * dist / len };
  }

  function chamferPath(points, r) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const pin = pointTowards(curr, prev, r);
      const pout = pointTowards(curr, next, r);
      d += ` L ${pin.x} ${pin.y} L ${pout.x} ${pout.y}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  function el(name, attrs) {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }

  function addStop(x, y) {
    svg.appendChild(el('circle', { cx: x, cy: y, r: STOP_R, class: 'stop-ring' }));
    svg.appendChild(el('circle', { cx: x, cy: y, r: CORE_R, class: 'stop-core' }));
  }

  function render() {
    const totalH = Math.ceil(site.scrollHeight);
    const siteRect = site.getBoundingClientRect();
    const pageRect = document.querySelector('.page').getBoundingClientRect();
    const width = Math.ceil(siteRect.width || window.innerWidth);
    const LEFT_X = Math.max(28, pageRect.left - siteRect.left + 22);
    const RIGHT_X = Math.min(width - 28, pageRect.right - siteRect.left - 22);

    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(totalH));
    svg.setAttribute('viewBox', `0 0 ${width} ${totalH}`);
    svg.innerHTML = '';

    const heroSection = relRect(document.getElementById('top'));
    const heroVideo = relRect(document.querySelector('.hero-video-anchor .circle-media'));
    const manifest = relRect(document.getElementById('manifest'));
    const parkText = relRect(document.getElementById('parking-text'));
    const dialog = relRect(document.getElementById('dialog'));
    const voteCopy = relRect(document.querySelector('#vote .copy'));
    const dialogMedia = relRect(document.querySelector('#dialog .dialog-media'));

    const isMobile = window.innerWidth <= 700;
    const topY = isMobile
      ? Math.max(heroSection.top + 18, heroVideo.top - 36)
      : heroSection.top + 36;
    const backLeftY = manifest.bottom - 42;
    const parkAcrossY = parkText.top + 42;
    const returnLeftY = dialog.bottom - 42;
    const endY = voteCopy.cy;

    const dx = Math.max(40, RIGHT_X - dialogMedia.cx);
    const diagEntryY = dialogMedia.cy - dx;
    const diagExitPoint = {
      x: Math.max(LEFT_X + CORNER * 2, dialogMedia.cx - (returnLeftY - dialogMedia.cy)),
      y: returnLeftY
    };

    const routePoints = [
      { x: heroVideo.cx, y: heroVideo.top },
      { x: heroVideo.cx, y: topY },
      { x: RIGHT_X, y: topY },
      { x: RIGHT_X, y: backLeftY },
      { x: LEFT_X, y: backLeftY },
      { x: LEFT_X, y: parkAcrossY },
      { x: RIGHT_X, y: parkAcrossY },
      { x: RIGHT_X, y: Math.max(parkAcrossY + 36, diagEntryY) },
      { x: dialogMedia.cx, y: dialogMedia.cy },
      diagExitPoint,
      { x: LEFT_X, y: returnLeftY },
      { x: LEFT_X, y: endY }
    ];

    svg.appendChild(el('path', { d: chamferPath(routePoints, CORNER), class: 'route-glow' }));
    svg.appendChild(el('path', { d: chamferPath(routePoints, CORNER), class: 'route-line' }));

    addStop(RIGHT_X, relRect(document.querySelector('#manifest .copy')).cy);
    document.querySelectorAll('[data-program-stop]').forEach(card => {
      const img = card.querySelector('img');
      const r = relRect(img);
      addStop(LEFT_X, r.cy);
    });
    addStop(RIGHT_X, relRect(document.querySelector('#parking-text .copy')).cy);
    // no stop at dialog: line passes through the center of video 12 instead
    addStop(LEFT_X, relRect(document.querySelector('#media .copy')).cy);
    addStop(LEFT_X, relRect(document.querySelector('#candidates .copy')).cy);
    addStop(LEFT_X, relRect(document.querySelector('#vote .copy')).cy);
  }

  window.addEventListener('load', render);
  window.addEventListener('resize', render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();

// Small DOM helpers shared by every screen.

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'html') el.innerHTML = v; // trusted strings only (our own SVG)
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// "2h 05m", "14m 03s", "42s"
export function fmtCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const hr = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (hr) return `${hr}h ${String(m).padStart(2, '0')}m`;
  if (m) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

// Quest lengths: "15 min", "4 hr", "1.5 hr"
export function fmtSpan(minutes) {
  if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
  if (minutes < 60) return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1).replace(/\.0$/, '')} min`;
  const hr = minutes / 60;
  return `${Number.isInteger(hr) ? hr : hr.toFixed(1)} hr`;
}

export function fmtAgo(at, now) {
  const m = Math.floor((now - at) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// A countdown span the tick loop keeps updated.
export function countdown(endAt, doneText = 'now') {
  return h('span', { class: 'countdown', 'data-ends': endAt, 'data-done': doneText },
    fmtCountdown(endAt - Date.now()));
}

export function toast(msg) {
  const el = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3100);
}

const openSheets = new Set();
export function closeAllSheets() { for (const c of [...openSheets]) c(); }

// Bottom sheet on phones, centered dialog on desktop. Returns a close function.
export function openSheet(content, { title, wide = false, onClose } = {}) {
  const close = () => {
    if (!openSheets.has(close)) return;
    openSheets.delete(close);
    backdrop.classList.add('out');
    setTimeout(() => backdrop.remove(), 180);
    document.removeEventListener('keydown', onKey);
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const sheet = h('div', { class: `sheet${wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Details' },
    h('div', { class: 'sheet-head' },
      h('h2', null, title || ''),
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, '×')),
    content);
  const backdrop = h('div', { class: 'sheet-backdrop', onclick: (e) => { if (e.target === backdrop) close(); } }, sheet);
  document.body.append(backdrop);
  document.addEventListener('keydown', onKey);
  openSheets.add(close);
  return close;
}

export function section(title, aside, ...kids) {
  return h('section', { class: 'section' },
    h('div', { class: 'section-head' }, h('h2', null, title), aside ? h('span', { class: 'muted' }, aside) : null),
    kids);
}

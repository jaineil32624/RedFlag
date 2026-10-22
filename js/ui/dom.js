/*
 * ui/dom.js
 * Screen router + shared UI primitives (toasts, modals, bottom sheets,
 * badge/level-up popups). Screens register themselves in RF.screens:
 *
 *   RF.screens.home = { tab: 'home', render: function (params) { return element; },
 *                        leave: function () {...optional cleanup...} };
 */
(function (RF) {
  'use strict';

  var U = RF.util, h = U.h;
  RF.screens = RF.screens || {};

  var current = null;       // {name, params, def}
  var stack = [];           // navigation history (for back)
  var view, tabbar, overlay, toasts;

  function init() {
    view = U.$('#view'); tabbar = U.$('#tabbar'); overlay = U.$('#overlay'); toasts = U.$('#toasts');
    U.$$('#tabbar [data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { RF.audio.play('tap'); go(b.getAttribute('data-tab'), null, { reset: true }); });
    });
    // Android / browser back button support
    window.addEventListener('popstate', function () {
      if (closeTopOverlay()) { pushState(); return; }
      if (stack.length > 1) back(); else pushState();
    });
    pushState();
    RF.bus.on('badge', function (b) { queuePopup(function (done) { badgePopup(b, done); }); });
    RF.bus.on('levelup', function (e) { queuePopup(function (done) { levelPopup(e, done); }); });
  }

  function pushState() { try { history.pushState({ rf: 1 }, ''); } catch (e) { /* file:// quirks */ } }

  /**
   * Navigate to a screen.
   * @param {string} name   screen id
   * @param {object} params passed to render()
   * @param {object} opts   {reset: clear history, replace: replace current}
   */
  function go(name, params, opts) {
    opts = opts || {};
    var def = RF.screens[name];
    if (!def) { console.warn('No screen', name); return; }
    if (current && current.def.leave) { try { current.def.leave(); } catch (e) { console.error(e); } }
    RF.speech.stop();
    if (opts.reset) stack = [];
    else if (opts.replace) stack.pop();
    var entry = { name: name, params: params || {}, def: def };
    stack.push(entry);
    render(entry);
  }

  function render(entry) {
    current = entry;
    var el;
    try { el = entry.def.render(entry.params); }
    catch (e) { console.error(e); el = h('div.screen.pad', null, [h('p', { text: 'Something went wrong. ' + e.message })]); }
    view.innerHTML = '';
    view.appendChild(el);
    view.scrollTop = 0;
    view.setAttribute('data-screen', entry.name);
    var full = !!entry.def.fullscreen;
    document.documentElement.toggleAttribute('data-fullscreen', full);
    U.$$('#tabbar [data-tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === entry.def.tab;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    var heading = el.querySelector('h1, h2');
    if (heading && !full) { heading.setAttribute('tabindex', '-1'); try { heading.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  function back() {
    if (current && current.def.leave) { try { current.def.leave(); } catch (e) { console.error(e); } }
    stack.pop();
    var prev = stack[stack.length - 1];
    if (!prev) { stack = []; go('home'); return; }
    render(prev);
  }

  /** Re-render the current screen (e.g. after settings change). */
  function refresh() { if (current) render(current); }

  /* ---------------- Toasts ---------------- */
  function toast(msg, icon, ms) {
    var t = h('div.toast', { role: 'status' }, [icon ? h('span.toast-icon', { text: icon }) : null, h('span', { text: msg })]);
    toasts.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 400); }, ms || 2600);
  }

  /* ---------------- Modals & sheets ---------------- */
  var overlays = [];
  function closeTopOverlay() {
    var top = overlays[overlays.length - 1];
    if (top && top.dismissable !== false) { top.close(); return true; }
    return !!top;
  }

  /**
   * Show a modal dialog.
   * @param {object} o - {title, body: Element|string, actions:[{label, primary, danger, onClick}], dismissable, className}
   */
  function modal(o) {
    var wrap = h('div.modal-wrap' + (o.sheet ? '.as-sheet' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || 'Dialog' });
    var box = h('div.modal' + (o.className ? '.' + o.className : ''));
    if (o.title) box.appendChild(h('h2.modal-title', { text: o.title }));
    if (o.body) box.appendChild(typeof o.body === 'string' ? h('div.modal-body', { html: o.body }) : o.body);
    var entry = { dismissable: o.dismissable, close: close };
    if (o.actions && o.actions.length) {
      var row = h('div.modal-actions');
      o.actions.forEach(function (a) {
        row.appendChild(h('button.btn' + (a.primary ? '.btn-primary' : '') + (a.danger ? '.btn-danger' : ''), {
          type: 'button', text: a.label,
          onclick: function () { RF.audio.play('tap'); var keep = a.onClick && a.onClick(); if (keep !== true) close(); }
        }));
      });
      box.appendChild(row);
    }
    wrap.appendChild(box);
    wrap.addEventListener('click', function (e) { if (e.target === wrap && o.dismissable !== false) close(); });
    overlay.appendChild(wrap);
    overlays.push(entry);
    requestAnimationFrame(function () { wrap.classList.add('in'); });
    var focusable = box.querySelector('.btn-primary') || box.querySelector('button, [href], input, textarea');
    if (focusable) setTimeout(function () { try { focusable.focus(); } catch (e) { /* ignore */ } }, 50);
    var closed = false;
    function close() {
      if (closed) return; closed = true;
      overlays.splice(overlays.indexOf(entry), 1);
      wrap.classList.remove('in');
      setTimeout(function () { wrap.remove(); }, 300);
      if (o.onClose) o.onClose();
    }
    return { close: close, el: box };
  }

  function confirm(title, text, okLabel, onOk, danger) {
    return modal({ title: title, body: h('p.modal-body', { text: text }), actions: [
      { label: 'Cancel' }, { label: okLabel || 'OK', primary: !danger, danger: danger, onClick: onOk }] });
  }

  /* ---------------- Popup queue (badges / level ups) ---------------- */
  var popupQueue = [], popupBusy = false;
  function queuePopup(fn) { popupQueue.push(fn); runQueue(); }
  function runQueue() {
    if (popupBusy || !popupQueue.length) return;
    popupBusy = true;
    var fn = popupQueue.shift();
    fn(function () { popupBusy = false; setTimeout(runQueue, 250); });
  }
  function badgePopup(b, done) {
    RF.audio.play('badge'); RF.haptics.buzz('badge');
    var el = h('div.badge-pop', { role: 'status', 'aria-live': 'polite' }, [
      h('div.badge-pop-medal', null, [h('span', { text: b.icon })]),
      h('div.badge-pop-text', null, [h('small', { text: 'Badge unlocked!' }), h('strong', { text: b.name }), h('span', { text: b.desc })])
    ]);
    U.$('#app').appendChild(el);
    if (RF.fx) RF.fx.confetti({ count: 60, y: 0.12 });
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () { el.classList.remove('in'); setTimeout(function () { el.remove(); done(); }, 450); }, 2600);
  }
  function levelPopup(e, done) {
    RF.audio.play('levelup');
    var el = h('div.badge-pop.level-pop', { role: 'status', 'aria-live': 'polite' }, [
      h('div.badge-pop-medal', null, [h('span', { text: e.rank.icon })]),
      h('div.badge-pop-text', null, [h('small', { text: 'Level up!' }), h('strong', { text: 'Level ' + e.level }),
        h('span', { text: e.rankChanged ? 'New rank: ' + e.rank.name + '!' : e.rank.name })])
    ]);
    U.$('#app').appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () { el.classList.remove('in'); setTimeout(function () { el.remove(); done(); }, 450); }, 2200);
  }

  /* ---------------- Small builders ---------------- */
  /** Toggle switch row for settings. */
  function toggleRow(label, desc, checked, onChange) {
    var id = 'tg-' + Math.random().toString(36).slice(2, 8);
    var input = h('input', { type: 'checkbox', id: id, role: 'switch' });
    input.checked = !!checked;
    input.addEventListener('change', function () { RF.audio.play('tap'); onChange(input.checked); });
    return h('div.set-row', null, [
      h('label.set-label', { for: id }, [h('span', { text: label }), desc ? h('small', { text: desc }) : null]),
      h('span.switch', null, [input, h('span.switch-ui', { 'aria-hidden': 'true' })])
    ]);
  }
  /** Segmented control. options: [[value, label]] */
  function segmented(name, options, value, onChange) {
    var wrap = h('div.segmented', { role: 'radiogroup', 'aria-label': name });
    options.forEach(function (o) {
      var b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(o[0] === value), text: o[1] });
      if (o[0] === value) b.classList.add('on');
      b.addEventListener('click', function () {
        RF.audio.play('tap');
        U.$$('button', wrap).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-checked', 'true');
        onChange(o[0]);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }
  /** Standard screen header with back button. */
  function header(title, opts) {
    opts = opts || {};
    return h('header.screen-head', null, [
      opts.noBack ? null : h('button.icon-btn', { type: 'button', 'aria-label': 'Back', onclick: function () { RF.audio.play('tap'); back(); } }, [h('span', { text: '‹' })]),
      h('h1', { text: title }),
      opts.right || h('span.head-spacer')
    ]);
  }

  RF.ui = { init: init, go: go, back: back, refresh: refresh, toast: toast, modal: modal, confirm: confirm,
    toggleRow: toggleRow, segmented: segmented, header: header,
    get current() { return current; }, closeTopOverlay: closeTopOverlay, hasOverlay: function () { return overlays.length > 0; } };
})(window.RedFlag);

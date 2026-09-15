/* ANSON JSC – main.js (không phụ thuộc thư viện ngoài) */
(function () {
  'use strict';

  /* ---------- Header: đổ bóng khi cuộn + nút lên đầu trang ---------- */
  var header = document.querySelector('.header');
  var toTop = document.querySelector('.to-top');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (toTop) toTop.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Menu di động ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('open');
    });
  }

  /* ---------- Đánh dấu menu đang active ---------- */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a[href]').forEach(function (a) {
    var href = a.getAttribute('href').split('#')[0];
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var btns = wrap.querySelectorAll('.tab-btn');
    var panels = wrap.querySelectorAll('.tab-panel');
    function activate(id, push) {
      btns.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === id); });
      panels.forEach(function (p) { p.classList.toggle('active', p.id === id); });
      if (push && history.replaceState) history.replaceState(null, '', '#' + id);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { activate(b.dataset.tab, true); });
    });
    var hash = location.hash.replace('#', '');
    if (hash && wrap.querySelector('#' + hash + '.tab-panel')) activate(hash, false);
    else if (btns[0]) activate(btns[0].dataset.tab, false);
  });

  /* ---------- Lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button class="close" aria-label="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button class="prev" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<img alt="">' +
      '<button class="next" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>' +
      '<div class="caption"></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img');
    var cap = lb.querySelector('.caption');
    var idx = 0;
    function groupOf(el) { return el.getAttribute('data-lightbox') || ''; }
    function show(i) {
      var list = items.filter(function (el) { return groupOf(el) === groupOf(items[idx]); });
      var pos = list.indexOf(items[idx]);
      pos = (pos + i + list.length) % list.length;
      idx = items.indexOf(list[pos]);
      var el = items[idx];
      img.src = el.getAttribute('href') || el.getAttribute('src');
      var c = el.getAttribute('data-caption') || el.getAttribute('title') || '';
      cap.textContent = c;
      cap.style.display = c ? 'block' : 'none';
      lb.querySelector('.prev').style.display = list.length > 1 ? '' : 'none';
      lb.querySelector('.next').style.display = list.length > 1 ? '' : 'none';
    }
    function open(i) { idx = i; show(0); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    items.forEach(function (el, i) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    });
    lb.querySelector('.close').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function () { show(-1); });
    lb.querySelector('.next').addEventListener('click', function () { show(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(-1);
      if (e.key === 'ArrowRight') show(1);
    });
  }

  /* ---------- Hiệu ứng hiện dần khi cuộn ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Bộ đếm số liệu ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function animate(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.firstChild.nodeValue = Math.round(target * eased).toLocaleString('vi-VN');
      if (p < 1) requestAnimationFrame(step);
      else el.firstChild.nodeValue = target.toLocaleString('vi-VN');
    }
    el.innerHTML = '0<small>' + suffix + '</small>';
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animate(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Biểu đồ cột tài chính ---------- */
  var bars = document.querySelectorAll('.bar .fill[data-value]');
  if (bars.length) {
    var max = 0;
    bars.forEach(function (b) { max = Math.max(max, parseFloat(b.dataset.value)); });
    var grow = function () {
      bars.forEach(function (b) { b.style.height = Math.max(6, (parseFloat(b.dataset.value) / max) * 100) + '%'; });
    };
    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { grow(); bio.disconnect(); }
      }, { threshold: 0.3 });
      bio.observe(bars[0].closest('.bars'));
    } else grow();
  }

  /* ---------- Sub-nav: active theo section ---------- */
  var subLinks = document.querySelectorAll('.subnav a[href^="#"]');
  if (subLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    subLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          subLinks.forEach(function (a) { a.classList.remove('active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) sio.observe(sec);
    });
  }

  /* ---------- Form liên hệ: gửi qua email (không cần máy chủ) ---------- */
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var subject = '[Website] Liên hệ từ ' + f.name.value + (f.company.value ? ' - ' + f.company.value : '');
      var body =
        'Họ tên: ' + f.name.value + '\n' +
        'Đơn vị: ' + f.company.value + '\n' +
        'Điện thoại: ' + f.phone.value + '\n' +
        'Email: ' + f.email.value + '\n' +
        'Nhu cầu: ' + f.topic.value + '\n\n' +
        f.message.value;
      location.href = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------- Năm hiện tại ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

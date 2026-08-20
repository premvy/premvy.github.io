(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll reveal -------------------------------------------------
  function setupReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length || reduceMotion) return;
    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity 500ms ease-out, transform 500ms ease-out';
    });
    var show = function (el) {
      var sibs = Array.prototype.slice
        .call(el.parentElement ? el.parentElement.children : [])
        .filter(function (n) { return n.hasAttribute && n.hasAttribute('data-reveal'); });
      var i = Math.max(0, sibs.indexOf(el));
      setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, i * 60);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      els.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    }, 2500);
  }

  // ---- Gallery lightbox -----------------------------------------------
  function setupLightbox() {
    var box = document.querySelector('[data-lightbox]');
    if (!box) return;
    var target = box.querySelector('[data-lightbox-img]');
    var cap = box.querySelector('[data-lightbox-cap]');

    function open(img) {
      target.src = img.currentSrc || img.src;
      target.alt = img.alt || '';
      var fig = img.closest('figure');
      var figcap = fig && fig.querySelector('figcaption');
      if (cap) cap.textContent = figcap ? figcap.textContent : '';
      box.style.opacity = '1';
      box.style.pointerEvents = 'auto';
      var close = box.querySelector('[data-lightbox-close]');
      if (close) close.focus();
    }

    function close() {
      target.removeAttribute('src');
      box.style.opacity = '0';
      box.style.pointerEvents = 'none';
    }

    document.addEventListener('click', function (e) {
      var img = e.target.closest && e.target.closest('[data-zoom]');
      if (img) { open(img); return; }
      if (e.target.closest && e.target.closest('[data-lightbox]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  // ---- Home: project card cursor spotlight -----------------------------
  function setupSpotlight() {
    var cards = document.querySelectorAll('[data-card]');
    if (!cards.length) return;
    var pending = null, raf = 0, active = null;
    function flush() {
      raf = 0;
      var e = pending;
      if (!e) return;
      var card = e.target && e.target.closest ? e.target.closest('[data-card]') : null;
      if (active && active !== card) {
        var s = active.querySelector('[data-spot]');
        if (s) { s.style.transition = 'opacity 300ms ease-out'; s.style.opacity = '0'; }
        active = null;
      }
      if (!card) return;
      var spot = card.querySelector('[data-spot]');
      if (!spot) return;
      var r = card.getBoundingClientRect();
      spot.style.background = 'radial-gradient(400px circle at ' + (e.clientX - r.left) + 'px ' + (e.clientY - r.top) + 'px, rgba(255,255,255,0.045), transparent 60%)';
      if (active !== card) { spot.style.transition = 'opacity 200ms ease-out'; spot.style.opacity = '1'; active = card; }
    }
    window.addEventListener('mousemove', function (e) {
      pending = e;
      if (!raf) raf = requestAnimationFrame(flush);
    }, { passive: true });
  }

  // ---- Home: Spline robot iframe loader ---------------------------------
  function setupSpline() {
    var iframe = document.querySelector('[data-spline]');
    if (!iframe) return;
    var loader = document.querySelector('[data-spline-loader]');
    function reveal() {
      iframe.style.opacity = '1';
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(function () { loader.style.display = 'none'; }, 450);
      }
    }
    iframe.addEventListener('load', reveal);
  }

  // ---- Home: contact form -------------------------------------------
  function setupContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var sentPanel = document.querySelector('[data-contact-sent]');
    var errorBox = form.querySelector('[data-send-error]');
    var submitBtn = form.querySelector('[data-submit-btn]');

    var fields = ['name', 'email', 'message'].map(function (key) {
      return {
        key: key,
        input: form.querySelector('[data-field="' + key + '"]'),
        label: form.querySelector('[data-label="' + key + '"]'),
        error: form.querySelector('[data-error="' + key + '"]'),
        touched: false
      };
    });
    var charCount = form.querySelector('[data-char-count]');

    function fieldError(f) {
      var v = (f.input.value || '').trim();
      if (!f.touched) return '';
      if (!v) return 'Required';
      if (f.key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email';
      return '';
    }

    function paint(f) {
      var err = fieldError(f);
      var focused = document.activeElement === f.input;
      f.input.style.borderColor = err ? '#E8694F' : (focused ? '#FFB020' : 'rgba(255,255,255,0.08)');
      if (f.label) f.label.style.color = (focused || (f.input.value || '').length) ? '#EDEDEF' : '#A0A0A8';
      if (f.error) f.error.textContent = err;
      if (f.error) f.error.style.display = err ? 'block' : 'none';
      if (f.key === 'message' && charCount) charCount.textContent = String(f.input.value.length);
    }

    fields.forEach(function (f) {
      paint(f);
      f.input.addEventListener('input', function () { paint(f); });
      f.input.addEventListener('focus', function () { paint(f); });
      f.input.addEventListener('blur', function () { f.touched = true; paint(f); });
    });

    function setSending(sending) {
      submitBtn.disabled = sending;
      submitBtn.style.opacity = sending ? '0.6' : '1';
      submitBtn.textContent = sending ? 'Sending...' : 'Send message';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      fields.forEach(function (f) { f.touched = true; paint(f); });
      var hasError = fields.some(function (f) { return fieldError(f) || !(f.input.value || '').trim(); });
      if (hasError) return;

      setSending(true);
      if (errorBox) { errorBox.textContent = ''; errorBox.style.display = 'none'; }

      var body = new FormData();
      fields.forEach(function (f) { body.append(f.key, f.input.value); });
      body.append('_subject', 'New message from portfolio site');

      fetch(form.action, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.style.transition = 'opacity 300ms ease-out';
          form.style.opacity = '0';
          setTimeout(function () {
            form.style.display = 'none';
            if (sentPanel) {
              sentPanel.style.display = 'flex';
              sentPanel.style.animation = 'fadeUp 300ms ease-out both';
            }
          }, 300);
        })
        .catch(function () {
          setSending(false);
          if (errorBox) {
            errorBox.textContent = "Something went wrong. Email me directly at pnv@ualberta.ca.";
            errorBox.style.display = 'block';
          }
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupReveal();
    setupLightbox();
    setupSpotlight();
    setupSpline();
    setupContactForm();
  });
})();

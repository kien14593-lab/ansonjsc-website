/* Trang quản trị bài viết – lưu trực tiếp vào kho GitHub qua REST API (không cần máy chủ riêng). */
(function () {
  'use strict';

  var CFG = Object.assign({
    owner: '', repo: '', branch: 'main', postsDir: 'content/posts', uploadsDir: 'assets/uploads',
    categories: ['Tin công ty'], siteUrl: ''
  }, window.ADMIN_CONFIG || {});
  if (!CFG.siteUrl) CFG.siteUrl = new URL('..', location.href).href.replace(/\/$/, '');
  var API = 'https://api.github.com';
  var RAW = 'https://raw.githubusercontent.com/' + CFG.owner + '/' + CFG.repo + '/' + CFG.branch + '/';
  var TOKEN_KEY = 'anson_admin_token';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
  var user = null;
  var posts = [];
  var editor = null;
  var editing = null;   // bài đang sửa (null = bài mới)
  var dirty = false;
  var deployTimer = null;

  /* ================= Tiện ích ================= */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function utf8ToB64(str) { return bytesToB64(new TextEncoder().encode(str)); }
  function b64ToUtf8(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function bytesToB64(bytes) {
    var bin = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin);
  }
  function slugify(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  }
  function todayISO() {
    var d = new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function fmtDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); }
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(function () { el.remove(); }, type === 'err' ? 7000 : 3500);
  }
  function confirmDialog(title, msg, okLabel) {
    return new Promise(function (resolve) {
      var dlg = $('#confirm');
      $('#confirm-title').textContent = title;
      $('#confirm-msg').textContent = msg;
      $('#confirm-ok').textContent = okLabel || 'Đồng ý';
      dlg.onclose = function () { resolve(dlg.returnValue === 'ok'); };
      dlg.showModal();
    });
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>' + (label || 'Đang xử lý…'); }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }

  /* ================= GitHub API ================= */
  function gh(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opts.headers || {});
    if (token && opts.auth !== false) headers['Authorization'] = 'Bearer ' + token;
    var init = { method: opts.method || 'GET', headers: headers, cache: 'no-store' };
    if (opts.body !== undefined) { init.body = JSON.stringify(opts.body); headers['Content-Type'] = 'application/json'; }
    return fetch(API + path, init).then(function (res) {
      if (res.status === 204) return null;
      return res.text().then(function (t) {
        var data = {}; try { data = t ? JSON.parse(t) : {}; } catch (e) { data = { message: t }; }
        if (!res.ok) {
          var err = new Error(data.message || ('HTTP ' + res.status));
          err.status = res.status; err.data = data;
          throw err;
        }
        return data;
      });
    });
  }
  function contentsPath(p) { return '/repos/' + CFG.owner + '/' + CFG.repo + '/contents/' + p.split('/').map(encodeURIComponent).join('/'); }
  function getFile(path) { return gh(contentsPath(path) + '?ref=' + encodeURIComponent(CFG.branch)); }
  function putFile(path, b64, message, sha) {
    var body = { message: message, content: b64, branch: CFG.branch };
    if (sha) body.sha = sha;
    return gh(contentsPath(path), { method: 'PUT', body: body });
  }
  function deleteFile(path, sha, message) { return gh(contentsPath(path), { method: 'DELETE', body: { message: message, sha: sha, branch: CFG.branch } }); }
  function friendlyError(err) {
    if (!err) return 'Lỗi không xác định';
    if (err.status === 401) return 'Mã truy cập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403) return 'Mã truy cập không có quyền ghi vào kho (cần Contents: Read and write). ' + (err.message || '');
    if (err.status === 404) return 'Không tìm thấy kho ' + CFG.owner + '/' + CFG.repo + ' hoặc mã truy cập chưa được cấp quyền cho kho này.';
    if (err.status === 409) return 'Xung đột phiên bản: bài viết vừa được người khác thay đổi. Hãy tải lại danh sách rồi sửa lại.';
    if (err.status === 422) return 'Dữ liệu không hợp lệ: ' + (err.message || '');
    if (err.message === 'Failed to fetch') return 'Không kết nối được tới GitHub. Kiểm tra mạng internet.';
    return err.message || String(err);
  }

  /* ================= Front matter ================= */
  var META_KEYS = ['title', 'date', 'category', 'cover', 'summary', 'published'];
  function parsePost(text) {
    text = text.replace(/^\uFEFF/, '');
    var meta = {}, body = text;
    var m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
    if (m) {
      m[1].split(/\r?\n/).forEach(function (line) {
        var i = line.indexOf(':');
        if (i > 0 && !/^\s/.test(line)) {
          var k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
          if (v.length >= 2 && v[0] === v[v.length - 1] && (v[0] === '"' || v[0] === "'")) v = v.slice(1, -1);
          meta[k] = v;
        }
      });
      body = m[2];
    }
    return { meta: meta, body: body.replace(/^\r?\n/, '') };
  }
  function serializePost(meta, body) {
    var lines = ['---'];
    META_KEYS.forEach(function (k) {
      var v = meta[k]; if (v === undefined || v === null) return;
      lines.push(k + ': ' + String(v).replace(/\r?\n/g, ' ').trim());
    });
    lines.push('---');
    return lines.join('\n') + '\n' + body.replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  }
  /* Ảnh trong kho được lưu dạng "assets/…"; khi soạn thảo đổi sang link raw để xem trước được ngay. */
  function toEditorMd(md) { return md.replace(/(\]\(|src=")(assets\/)/g, '$1' + RAW + '$2'); }
  function fromEditorMd(md) { return md.split(RAW).join(''); }

  /* ================= Điều hướng ================= */
  var VIEWS = ['login', 'setup', 'list', 'editor', 'content'];
  function currentView() { for (var i = 0; i < VIEWS.length; i++) if (!$('#view-' + VIEWS[i]).hidden) return VIEWS[i]; return ''; }
  function show(view) {
    VIEWS.forEach(function (v) { $('#view-' + v).hidden = v !== view; });
    var loggedIn = !!user && (view === 'list' || view === 'editor' || view === 'content' || (view === 'setup' && setupMode === 'change'));
    $('#topnav').hidden = !loggedIn;
    $('#userbox').hidden = !loggedIn;
    var navKey = view === 'editor' ? 'list' : view;
    document.querySelectorAll('.navbtn[data-go]').forEach(function (b) { b.classList.toggle('active', b.dataset.go === navKey); });
    window.scrollTo(0, 0);
  }
  /* Hỏi xác nhận khi rời màn hình đang có thay đổi chưa lưu (bài viết hoặc nội dung trang). */
  function guardLeave() {
    var v = currentView();
    if (v === 'editor' && dirty) return confirmDialog('Rời trang soạn thảo', 'Bạn có thay đổi chưa lưu. Rời đi và bỏ các thay đổi này?', 'Bỏ thay đổi');
    if (v === 'content' && window.AdminContent && AdminContent.isDirty()) return confirmDialog('Rời trang nội dung', 'Nội dung trang có thay đổi chưa lưu. Rời đi và bỏ các thay đổi này?', 'Bỏ thay đổi');
    return Promise.resolve(true);
  }
  function goTo(view) {
    return guardLeave().then(function (ok) {
      if (!ok) return false;
      if (view === 'editor') dirty = false;
      if (view === 'content') { if (window.AdminContent) AdminContent.open(); else toast('Không tải được mô-đun nội dung trang', 'err'); }
      else show(view);
      return true;
    });
  }

  /* ================= Mã hoá token bằng mật khẩu (WebCrypto) =================
     Token GitHub được mã hoá AES-256-GCM với khoá dẫn xuất từ mật khẩu (PBKDF2-SHA256, 600.000 vòng)
     và lưu công khai tại admin/auth.json. Không có mật khẩu thì không thể lấy lại token. */
  var AUTH_PATH = 'admin/auth.json';
  var KDF_ITER = 600000;
  var authInfo = null;      // nội dung auth.json đã tải (null = chưa thiết lập)
  var authSha = null;
  var setupMode = 'first';  // first | reset | change
  var enc = new TextEncoder();
  function b64ToBytes(b64) { var bin = atob(b64); var out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function cryptoOk() { return !!(window.crypto && crypto.subtle && window.isSecureContext); }
  function deriveKey(pass, salt, iter) {
    return crypto.subtle.importKey('raw', enc.encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encryptToken(tok, userName, pass) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(pass, salt, KDF_ITER).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: enc.encode(userName.toLowerCase()) }, key, enc.encode(tok));
    }).then(function (buf) {
      return { v: 1, user: userName, kdf: 'PBKDF2-SHA256', iter: KDF_ITER, cipher: 'AES-256-GCM', salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(buf)), updated: todayISO() };
    });
  }
  function decryptToken(auth, pass) {
    return deriveKey(pass, b64ToBytes(auth.salt), auth.iter || KDF_ITER).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(auth.iv), additionalData: enc.encode((auth.user || '').toLowerCase()) }, key, b64ToBytes(auth.data));
    }).then(function (buf) { return new TextDecoder().decode(buf); });
  }
  function genPassword() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', out = '', limit = 256 - (256 % A.length);
    while (out.length < 16) {
      var b = crypto.getRandomValues(new Uint8Array(32));
      for (var i = 0; i < b.length && out.length < 16; i++) if (b[i] < limit) out += A[b[i] % A.length];
    }
    return out.match(/.{4}/g).join('-');
  }
  var WEAK = /^(admin|password|passw0rd|123456|12345678|123456789|1234567890|qwerty|abc123|admin123|admin@123|anson|ansonjsc|ansonjsc123|anson@123|anson2026|anson@2026)$/i;
  function passStrength(pass, userName) {
    if (pass.length < 12) return { cls: 'weak', msg: 'Quá ngắn – cần tối thiểu 12 ký tự.', ok: false };
    if (WEAK.test(pass.replace(/[-_.\s]/g, '')) || pass.toLowerCase() === (userName || '').toLowerCase()) return { cls: 'weak', msg: 'Mật khẩu quá dễ đoán.', ok: false };
    var kinds = /[a-z]/.test(pass) + /[A-Z]/.test(pass) + /\d/.test(pass) + /[^a-zA-Z0-9]/.test(pass);
    if (pass.length >= 16 && kinds >= 3) return { cls: 'strong', msg: 'Mật khẩu mạnh.', ok: true };
    return { cls: 'ok', msg: 'Đạt yêu cầu – nên dài hơn 16 ký tự và có chữ hoa, số.', ok: true };
  }
  /* Tải auth.json: ưu tiên GitHub API (luôn mới nhất), dự phòng tệp cùng thư mục (chạy thử máy nội bộ). */
  function loadAuth() {
    return gh(contentsPath(AUTH_PATH) + '?ref=' + encodeURIComponent(CFG.branch), { auth: false }).then(function (d) {
      authSha = d.sha;
      return JSON.parse(b64ToUtf8(d.content));
    }).catch(function (err) {
      var missing = err && err.status === 404;
      return fetch('auth.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
        if (r.ok) return r.json();
        if (missing) return null;
        throw err;
      }).catch(function (e2) { if (missing) return null; throw e2; });
    });
  }
  function storeToken(remember) {
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); token = ''; }

  /* ================= Đăng nhập ================= */
  function showLoginError(sel, msg) { var el = $(sel); el.textContent = msg; el.hidden = !msg; }
  function openLogin() {
    show('login');
    $('#login-form').hidden = true; $('#token-form').hidden = true; $('#login-fatal').hidden = true;
    $('#login-loading').hidden = false;
    loadAuth().then(function (a) {
      authInfo = a;
      $('#login-loading').hidden = true;
      if (!authInfo) { setupMode = 'first'; openSetup(); return; }
      $('#login-form').hidden = false;
      if (!$('#user-input').value) $('#user-input').value = authInfo.user || 'admin';
      ($('#user-input').value ? $('#pass-input') : $('#user-input')).focus();
    }).catch(function (err) {
      $('#login-loading').hidden = true;
      $('#login-fatal').textContent = 'Không tải được cấu hình đăng nhập: ' + friendlyError(err);
      $('#login-fatal').hidden = false;
      $('#token-form').hidden = false;
    });
  }
  function initLogin() {
    $('#repo-name').textContent = CFG.owner + '/' + CFG.repo;
    $('#help-owner').textContent = CFG.owner;
    $('#help-repo').textContent = CFG.owner + '/' + CFG.repo;
    document.querySelectorAll('.pw-toggle').forEach(function (b) {
      b.addEventListener('click', function () { var i = $('#' + b.dataset.for); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Hiện' : 'Ẩn'; });
    });
    $('#link-token-login').addEventListener('click', function () { $('#login-form').hidden = true; $('#token-form').hidden = false; $('#token-input').focus(); });
    $('#link-pass-login').addEventListener('click', function () { $('#token-form').hidden = true; $('#login-form').hidden = false; });
    $('#link-reset').addEventListener('click', function () { setupMode = 'reset'; openSetup(); });

    $('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('#user-input').value.trim(), p = $('#pass-input').value;
      if (!u || !p) return;
      if (!cryptoOk()) { showLoginError('#login-error', 'Trình duyệt không hỗ trợ mã hoá hoặc trang không chạy qua HTTPS.'); return; }
      var btn = $('#btn-login'); busy(btn, true, 'Đang kiểm tra…'); showLoginError('#login-error', '');
      var wrong = new Error('Sai tên đăng nhập hoặc mật khẩu.');
      (u.toLowerCase() !== String(authInfo.user || '').toLowerCase() ? Promise.reject(wrong) : decryptToken(authInfo, p).catch(function () { throw wrong; }))
        .then(function (tok) {
          token = tok;
          return verifyToken().catch(function (err) {
            token = '';
            if (err.status === 401) { err = new Error('Mật khẩu đúng nhưng token GitHub đã hết hạn hoặc bị thu hồi. Hãy tạo token mới và bấm “Quên mật khẩu / thiết lập lại”.'); }
            throw err;
          });
        })
        .then(function () { storeToken($('#remember').checked); $('#pass-input').value = ''; enterApp(); })
        .catch(function (err) { showLoginError('#login-error', friendlyError(err)); })
        .finally(function () { busy(btn, false); });
    });

    $('#token-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var t = $('#token-input').value.trim();
      if (!t) return;
      var btn = $('#btn-token-login'); busy(btn, true, 'Đang kiểm tra…'); showLoginError('#token-error', '');
      token = t;
      verifyToken().then(function () {
        storeToken($('#remember-token').checked);
        $('#token-input').value = '';
        enterApp();
      }).catch(function (err) { token = ''; showLoginError('#token-error', friendlyError(err)); })
        .finally(function () { busy(btn, false); });
    });

    $('#btn-logout').addEventListener('click', function () {
      clearToken(); user = null; posts = [];
      if (window.AdminContent) AdminContent.reset();
      openLogin();
    });
    $('#btn-password').addEventListener('click', function () { setupMode = 'change'; openSetup(); });
    initSetup();
  }
  function verifyToken() {
    return gh('/user').then(function (u) {
      user = u;
      return gh('/repos/' + CFG.owner + '/' + CFG.repo);
    }).then(function (repo) {
      if (repo.permissions && repo.permissions.push === false) {
        var e = new Error('Tài khoản ' + user.login + ' không có quyền ghi vào kho này.'); e.status = 403; throw e;
      }
    });
  }
  function enterApp() {
    $('#user-login').textContent = user ? user.login : '';
    if (user && user.avatar_url) $('#user-avatar').src = user.avatar_url + '&s=56';
    show('list');
    loadPosts();
  }

  /* ================= Thiết lập đăng nhập ================= */
  function openSetup() {
    var change = setupMode === 'change';
    $('#setup-title').textContent = change ? 'Đổi mật khẩu / token' : (setupMode === 'reset' ? 'Thiết lập lại đăng nhập' : 'Thiết lập đăng nhập lần đầu');
    $('#setup-intro').hidden = change;
    $('#setup-help').open = !change;
    $('#setup-token-note').textContent = change ? '(để trống nếu giữ token hiện tại)' : '';
    $('#setup-token').required = !change;
    $('#setup-token').value = '';
    $('#setup-user').value = (authInfo && authInfo.user) || 'admin';
    $('#setup-pass').value = genPassword();
    $('#setup-cancel').hidden = setupMode === 'first' && !user;
    $('#setup-skip-row').hidden = setupMode !== 'first';
    $('#btn-setup').textContent = change ? 'Lưu thay đổi' : 'Hoàn tất thiết lập';
    showLoginError('#setup-error', '');
    updateStrength();
    show('setup');
  }
  function updateStrength() {
    var s = passStrength($('#setup-pass').value, $('#setup-user').value);
    var el = $('#pass-strength'); el.textContent = s.msg; el.className = s.cls;
    return s.ok;
  }
  function initSetup() {
    $('#btn-gen-pass').addEventListener('click', function () { $('#setup-pass').value = genPassword(); updateStrength(); });
    $('#setup-pass').addEventListener('input', updateStrength);
    $('#setup-user').addEventListener('input', updateStrength);
    $('#btn-copy-pass').addEventListener('click', function () {
      var v = $('#setup-pass').value;
      var done = function () { toast('Đã sao chép mật khẩu – hãy lưu vào nơi an toàn', 'ok'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { $('#setup-pass').select(); document.execCommand('copy'); done(); });
      else { $('#setup-pass').select(); document.execCommand('copy'); done(); }
    });
    $('#setup-cancel').addEventListener('click', function () { if (user && setupMode === 'change') show('list'); else openLogin(); });
    $('#link-setup-skip').addEventListener('click', function () {
      show('login');
      $('#login-loading').hidden = true; $('#login-form').hidden = true; $('#token-form').hidden = false;
      $('#token-input').focus();
    });
    $('#setup-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var newTok = $('#setup-token').value.trim(), u = $('#setup-user').value.trim(), p = $('#setup-pass').value;
      if (!cryptoOk()) { showLoginError('#setup-error', 'Trình duyệt không hỗ trợ mã hoá hoặc trang không chạy qua HTTPS.'); return; }
      if (!/^[a-zA-Z0-9._-]{2,32}$/.test(u)) { showLoginError('#setup-error', 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, gạch (2–32 ký tự).'); return; }
      if (!updateStrength()) { showLoginError('#setup-error', 'Mật khẩu chưa đạt yêu cầu.'); $('#setup-pass').focus(); return; }
      if (!newTok && !(setupMode === 'change' && token)) { showLoginError('#setup-error', 'Vui lòng dán token GitHub.'); $('#setup-token').focus(); return; }
      var prevToken = token, prevUser = user;
      var tok = newTok || token;
      var btn = $('#btn-setup'); busy(btn, true, 'Đang thiết lập…'); showLoginError('#setup-error', '');
      token = tok;
      verifyToken().then(function () {
        return encryptToken(tok, u, p);
      }).then(function (auth) {
        return getFile(AUTH_PATH).then(function (d) { return d.sha; }, function (err) { if (err.status === 404) return undefined; throw err; })
          .then(function (sha) { return putFile(AUTH_PATH, utf8ToB64(JSON.stringify(auth, null, 2) + '\n'), setupMode === 'first' ? 'Thiết lập đăng nhập quản trị' : 'Cập nhật đăng nhập quản trị', sha); })
          .then(function (res) { authInfo = auth; authSha = res.content.sha; return res; });
      }).then(function (res) {
        storeToken($('#setup-remember').checked);
        $('#setup-token').value = ''; $('#setup-pass').value = '';
        $('#user-input').value = u;
        toast(setupMode === 'change' ? 'Đã lưu. Từ giờ đăng nhập bằng mật khẩu mới.' : 'Thiết lập xong! Từ giờ đăng nhập bằng tên + mật khẩu.', 'ok');
        enterApp();
        watchDeploy(res.commit && res.commit.sha, null);
      }).catch(function (err) {
        token = prevToken; user = prevUser;
        showLoginError('#setup-error', friendlyError(err));
      }).finally(function () { busy(btn, false); });
    });
  }

  /* ================= Danh sách bài ================= */
  function loadPosts() {
    $('#posts-loading').hidden = false;
    $('#posts-empty').hidden = true;
    $('#posts-body').innerHTML = '';
    return gh(contentsPath(CFG.postsDir) + '?ref=' + encodeURIComponent(CFG.branch)).catch(function (err) {
      if (err.status === 404) return [];   // thư mục chưa tồn tại
      throw err;
    }).then(function (list) {
      var files = (list || []).filter(function (f) { return f.type === 'file' && /\.md$/i.test(f.name); });
      return Promise.all(files.map(function (f) {
        return getFile(CFG.postsDir + '/' + f.name).then(function (data) {
          var parsed = parsePost(b64ToUtf8(data.content));
          return { slug: f.name.replace(/\.md$/i, ''), sha: data.sha, meta: parsed.meta, body: parsed.body };
        });
      }));
    }).then(function (items) {
      posts = items.sort(function (a, b) { return (b.meta.date || '').localeCompare(a.meta.date || '') || a.slug.localeCompare(b.slug); });
      renderList();
    }).catch(function (err) {
      toast(friendlyError(err), 'err');
      if (err.status === 401) { $('#btn-logout').click(); }
    }).finally(function () { $('#posts-loading').hidden = true; });
  }
  function isPublished(meta) { return !/^(false|0|no)$/i.test((meta.published || 'true').trim()); }
  function renderList() {
    var q = ($('#search').value || '').trim().toLowerCase();
    var rows = posts.filter(function (p) {
      if (!q) return true;
      return ((p.meta.title || '') + ' ' + p.slug + ' ' + (p.meta.category || '')).toLowerCase().indexOf(q) >= 0;
    });
    var pub = posts.filter(function (p) { return isPublished(p.meta); }).length;
    $('#list-summary').textContent = posts.length + ' bài viết · ' + pub + ' đang hiển thị · ' + (posts.length - pub) + ' bản nháp';
    $('#posts-empty').hidden = posts.length > 0;
    $('#posts-body').innerHTML = rows.map(function (p) {
      var cover = p.meta.cover ? '<img src="' + esc(RAW + p.meta.cover.replace(RAW, '')) + '" alt="">' : '<span class="noimg"></span>';
      var status = isPublished(p.meta) ? '<span class="chip ok">Đang hiển thị</span>' : '<span class="chip draft">Bản nháp</span>';
      var view = isPublished(p.meta) ? '<a class="btn-link" href="' + esc(CFG.siteUrl + '/tin-tuc/' + p.slug + '.html') + '" target="_blank" rel="noopener">Xem</a>' : '';
      return '<tr data-slug="' + esc(p.slug) + '">' +
        '<td><div class="post-title">' + cover + '<div><strong>' + esc(p.meta.title || p.slug) + '</strong><small>tin-tuc/' + esc(p.slug) + '.html</small></div></div></td>' +
        '<td><span class="chip">' + esc(p.meta.category || '—') + '</span></td>' +
        '<td>' + esc(fmtDate(p.meta.date)) + '</td>' +
        '<td>' + status + '</td>' +
        '<td class="right"><button class="btn-link" data-act="edit">Sửa</button>' + view + '<button class="btn-link danger" data-act="del">Xoá</button></td>' +
        '</tr>';
    }).join('');
    if (posts.length && !rows.length) $('#posts-body').innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center;padding:2rem">Không có bài viết nào khớp “' + esc(q) + '”.</td></tr>';
  }
  function initList() {
    $('#search').addEventListener('input', renderList);
    $('#btn-reload').addEventListener('click', loadPosts);
    $('#btn-new').addEventListener('click', function () { openEditor(null); });
    $('#posts-body').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]'); if (!btn) return;
      var slug = btn.closest('tr').dataset.slug;
      var post = posts.find(function (p) { return p.slug === slug; });
      if (!post) return;
      if (btn.dataset.act === 'edit') openEditor(post);
      if (btn.dataset.act === 'del') removePost(post);
    });
    document.querySelectorAll('.navbtn[data-go]').forEach(function (b) { b.addEventListener('click', function () { goTo(b.dataset.go); }); });
  }
  function removePost(post) {
    confirmDialog('Xoá bài viết', 'Xoá vĩnh viễn bài “' + (post.meta.title || post.slug) + '”? Trang bài viết sẽ bị gỡ khỏi website sau khi cập nhật.', 'Xoá').then(function (ok) {
      if (!ok) return;
      toast('Đang xoá…');
      deleteFile(CFG.postsDir + '/' + post.slug + '.md', post.sha, 'Xoá bài viết: ' + (post.meta.title || post.slug)).then(function (res) {
        posts = posts.filter(function (p) { return p.slug !== post.slug; });
        renderList();
        toast('Đã xoá bài viết', 'ok');
        watchDeploy(res && res.commit && res.commit.sha, null);
      }).catch(function (err) { toast(friendlyError(err), 'err'); });
    });
  }

  /* ================= Soạn thảo ================= */
  function initEditorView() {
    var sel = $('#f-category');
    sel.innerHTML = CFG.categories.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    $('#btn-back').addEventListener('click', function () { leaveEditor().then(function (ok) { if (ok) show('list'); }); });
    $('#btn-cancel').addEventListener('click', function () { leaveEditor().then(function (ok) { if (ok) show('list'); }); });
    $('#btn-save').addEventListener('click', savePost);
    $('#f-title').addEventListener('input', function () {
      dirty = true;
      if (!editing && !$('#f-slug').dataset.manual) { $('#f-slug').value = slugify(this.value); updateSlugPreview(); }
    });
    $('#f-slug').addEventListener('input', function () { this.dataset.manual = '1'; this.value = slugify(this.value); updateSlugPreview(); dirty = true; });
    ['#f-summary', '#f-category', '#f-date', '#f-published', '#f-body-fallback'].forEach(function (s) { $(s).addEventListener('input', function () { dirty = true; }); });
    $('#f-published').addEventListener('change', updateSaveLabel);
    $('#f-cover-file').addEventListener('change', function () {
      var file = this.files[0]; this.value = '';
      if (!file) return;
      var lbl = this.closest('label'); lbl.classList.add('disabled'); lbl.firstChild.textContent = 'Đang tải…';
      uploadImage(file).then(function (path) {
        setCover(path); dirty = true; toast('Đã tải ảnh lên', 'ok');
      }).catch(function (err) { toast('Tải ảnh thất bại: ' + friendlyError(err), 'err'); })
        .finally(function () { lbl.classList.remove('disabled'); lbl.firstChild.textContent = 'Tải ảnh lên'; });
    });
    $('#btn-cover-clear').addEventListener('click', function () { setCover(''); dirty = true; });
    window.addEventListener('beforeunload', function (e) {
      var v = currentView();
      if ((v === 'editor' && dirty) || (v === 'content' && window.AdminContent && AdminContent.isDirty())) { e.preventDefault(); e.returnValue = ''; }
    });
    setupEditor();
  }
  function setupEditor() {
    if (!window.toastui || !toastui.Editor) { $('#editor').hidden = true; $('#f-body-fallback').hidden = false; return; }
    try {
      toastui.Editor.setLanguage('vi', {
        Markdown: 'Markdown', WYSIWYG: 'Trực quan', Write: 'Soạn', Preview: 'Xem trước', Headings: 'Tiêu đề', Paragraph: 'Đoạn văn',
        Bold: 'Đậm', Italic: 'Nghiêng', Strike: 'Gạch ngang', Code: 'Mã', Line: 'Đường kẻ', Blockquote: 'Trích dẫn',
        'Unordered list': 'Danh sách chấm', 'Ordered list': 'Danh sách số', Task: 'Việc cần làm', Indent: 'Thụt vào', Outdent: 'Thụt ra',
        'Insert link': 'Chèn liên kết', 'Insert CodeBlock': 'Chèn khối mã', 'Insert table': 'Chèn bảng', 'Insert image': 'Chèn ảnh', Heading: 'Tiêu đề',
        'Image URL': 'Địa chỉ ảnh', 'Select image file': 'Chọn tệp ảnh', 'Choose a file': 'Chọn tệp', Description: 'Mô tả', OK: 'Đồng ý', More: 'Thêm', Cancel: 'Huỷ',
        File: 'Tệp', URL: 'Địa chỉ', 'Link text': 'Chữ hiển thị', 'Add row after': 'Thêm hàng dưới', 'Add row before': 'Thêm hàng trên',
        'Add column after': 'Thêm cột phải', 'Add column before': 'Thêm cột trái', 'Remove row': 'Xoá hàng', 'Remove column': 'Xoá cột',
        'Align column to left': 'Canh trái', 'Align column to center': 'Canh giữa', 'Align column to right': 'Canh phải', 'Remove table': 'Xoá bảng',
        'Would you like to paste as table?': 'Dán dưới dạng bảng?', 'Text color': 'Màu chữ', 'Auto scroll enabled': 'Bật tự cuộn', 'Auto scroll disabled': 'Tắt tự cuộn', 'Choose language': 'Chọn ngôn ngữ'
      });
      editor = new toastui.Editor({
        el: $('#editor'), height: '560px', initialEditType: 'wysiwyg', previewStyle: 'vertical', usageStatistics: false, language: 'vi',
        placeholder: 'Soạn nội dung bài viết tại đây…',
        toolbarItems: [['heading', 'bold', 'italic', 'strike'], ['hr', 'quote'], ['ul', 'ol', 'indent', 'outdent'], ['table', 'image', 'link'], ['code', 'codeblock']],
        hooks: {
          addImageBlobHook: function (blob, callback) {
            toast('Đang tải ảnh lên…');
            uploadImage(blob).then(function (path) { callback(RAW + path, (blob.name || 'anh').replace(/\.[^.]+$/, '')); toast('Đã chèn ảnh', 'ok'); })
              .catch(function (err) { toast('Tải ảnh thất bại: ' + friendlyError(err), 'err'); });
          }
        }
      });
      editor.on('change', function () { dirty = true; });
    } catch (e) {
      editor = null; $('#editor').hidden = true; $('#f-body-fallback').hidden = false;
    }
  }
  function getBody() { return fromEditorMd(editor ? editor.getMarkdown() : $('#f-body-fallback').value); }
  function setBody(md) { if (editor) editor.setMarkdown(toEditorMd(md || ''), false); else $('#f-body-fallback').value = md || ''; }
  function setCover(path) {
    path = (path || '').replace(RAW, '');
    $('#f-cover').value = path;
    $('#cover-img').hidden = !path;
    $('#cover-placeholder').hidden = !!path;
    if (path) $('#cover-img').src = RAW + path + '?t=' + Date.now();
  }
  function updateSlugPreview() { $('#slug-preview').textContent = 'tin-tuc/' + ($('#f-slug').value || '…') + '.html'; }
  function updateSaveLabel() { $('#btn-save').textContent = $('#f-published').checked ? 'Lưu & xuất bản' : 'Lưu bản nháp'; }
  function openEditor(post) {
    editing = post;
    dirty = false;
    $('#editor-title').textContent = post ? 'Sửa bài viết' : 'Viết bài mới';
    $('#f-title').value = post ? (post.meta.title || '') : '';
    $('#f-summary').value = post ? (post.meta.summary || '') : '';
    $('#f-category').value = post && post.meta.category && CFG.categories.indexOf(post.meta.category) >= 0 ? post.meta.category : CFG.categories[0];
    $('#f-date').value = post && /^\d{4}-\d{2}-\d{2}/.test(post.meta.date || '') ? post.meta.date.slice(0, 10) : todayISO();
    $('#f-published').checked = post ? isPublished(post.meta) : true;
    $('#f-slug').value = post ? post.slug : '';
    delete $('#f-slug').dataset.manual;
    setCover(post ? post.meta.cover : '');
    setBody(post ? post.body : '');
    updateSlugPreview(); updateSaveLabel();
    show('editor');
    $('#f-title').focus();
  }
  function leaveEditor() {
    if (!dirty) return Promise.resolve(true);
    return confirmDialog('Rời trang soạn thảo', 'Bạn có thay đổi chưa lưu. Rời đi và bỏ các thay đổi này?', 'Bỏ thay đổi');
  }
  function uploadFile(file, opts) {
    opts = opts || {};
    var kind = opts.kind || 'image';
    var name = file.name || (kind === 'image' ? 'anh.jpg' : 'tep');
    var ext = (name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ext === 'jpeg') ext = 'jpg';
    if (kind === 'image') {
      if (!/^(jpg|png|gif|webp|svg)$/.test(ext)) ext = (file.type || '').split('/')[1] || 'jpg';
      if (!/^(jpg|png|gif|webp|svg)$/.test(ext)) return Promise.reject(new Error('Chỉ nhận ảnh JPG, PNG, GIF, WEBP hoặc SVG.'));
    } else if (opts.exts && opts.exts.indexOf(ext) < 0) {
      return Promise.reject(new Error('Chỉ nhận tệp ' + opts.exts.join(', ').toUpperCase() + '.'));
    }
    var maxMB = opts.maxMB || 5;
    if (file.size > maxMB * 1024 * 1024) return Promise.reject(new Error('Tệp vượt quá ' + maxMB + ' MB, hãy giảm kích thước trước khi tải lên.'));
    var base = slugify(name.replace(/\.[^.]+$/, '')) || 'tep';
    var path = opts.path;   // ghi đè đúng đường dẫn cũ (giữ nguyên địa chỉ tệp)
    if (!path) {
      var dir = opts.dir || (CFG.uploadsDir + '/' + new Date().getFullYear());
      path = dir + '/' + base + '-' + Date.now().toString(36) + '.' + ext;
    }
    var shaP = opts.path ? getFile(path).then(function (d) { return d.sha; }, function (err) { if (err.status === 404) return undefined; throw err; }) : Promise.resolve(undefined);
    return Promise.all([file.arrayBuffer(), shaP]).then(function (r) {
      return putFile(path, bytesToB64(new Uint8Array(r[0])), (opts.path ? 'Thay tệp: ' : 'Tải lên: ') + path.split('/').pop(), r[1]);
    }).then(function (res) { lastUploadCommit = res && res.commit && res.commit.sha; return path; });
  }
  var lastUploadCommit = null;
  function uploadImage(file) { return uploadFile(file, { kind: 'image', maxMB: 5 }); }
  function savePost() {
    var title = $('#f-title').value.trim();
    var body = getBody().trim();
    if (!title) { toast('Vui lòng nhập tiêu đề bài viết', 'err'); $('#f-title').focus(); return; }
    if (!body) { toast('Nội dung bài viết đang trống', 'err'); return; }
    var slug = slugify($('#f-slug').value) || slugify(title) || 'bai-viet';
    if (!editing || editing.slug !== slug) {
      var base = slug, n = 2;
      while (posts.some(function (p) { return p.slug === slug && (!editing || p.slug !== editing.slug); })) slug = base + '-' + (n++);
    }
    var meta = {
      title: title, date: $('#f-date').value || todayISO(), category: $('#f-category').value,
      cover: $('#f-cover').value, summary: $('#f-summary').value.trim(), published: $('#f-published').checked ? 'true' : 'false'
    };
    var content = serializePost(meta, body);
    var path = CFG.postsDir + '/' + slug + '.md';
    var btn = $('#btn-save'); busy(btn, true, 'Đang lưu…');
    var chain = Promise.resolve();
    if (editing && editing.slug !== slug) {
      chain = chain.then(function () { return deleteFile(CFG.postsDir + '/' + editing.slug + '.md', editing.sha, 'Đổi đường dẫn bài viết: ' + editing.slug + ' → ' + slug); });
    }
    chain.then(function () {
      var sha = editing && editing.slug === slug ? editing.sha : undefined;
      return putFile(path, utf8ToB64(content), (editing ? 'Cập nhật bài viết: ' : 'Đăng bài viết: ') + title, sha);
    }).then(function (res) {
      var saved = { slug: slug, sha: res.content.sha, meta: meta, body: body };
      posts = posts.filter(function (p) { return p.slug !== slug && (!editing || p.slug !== editing.slug); });
      posts.push(saved);
      posts.sort(function (a, b) { return (b.meta.date || '').localeCompare(a.meta.date || '') || a.slug.localeCompare(b.slug); });
      dirty = false; editing = null;
      renderList(); show('list');
      toast(meta.published === 'true' ? 'Đã lưu bài viết. Website đang được cập nhật…' : 'Đã lưu bản nháp', 'ok');
      watchDeploy(res.commit && res.commit.sha, meta.published === 'true' ? CFG.siteUrl + '/tin-tuc/' + slug + '.html' : null);
    }).catch(function (err) {
      toast(friendlyError(err), 'err');
      if (err.status === 409) loadPosts();
    }).finally(function () { busy(btn, false); updateSaveLabel(); });
  }

  /* ================= Theo dõi GitHub Actions xuất bản ================= */
  function setDeploy(state, msg, link) {
    var box = $('#deploy');
    box.hidden = false; box.className = 'deploy' + (state ? ' ' + state : '');
    $('#deploy-msg').textContent = msg;
    var a = $('#deploy-link'); a.hidden = !link; if (link) a.href = link;
  }
  function watchDeploy(sha, link) {
    if (deployTimer) clearInterval(deployTimer);
    var started = Date.now();
    setDeploy('', 'Đang cập nhật website (GitHub Actions)… thường mất 1–2 phút.', null);
    function poll() {
      var q = '/repos/' + CFG.owner + '/' + CFG.repo + '/actions/runs?branch=' + encodeURIComponent(CFG.branch) + '&per_page=5' + (sha ? '&head_sha=' + sha : '');
      gh(q).catch(function (err) { if (err.status === 403) return gh(q, { auth: false }); throw err; }).then(function (data) {
        var run = data && data.workflow_runs && data.workflow_runs[0];
        if (!run) {
          if (Date.now() - started > 90000) { clearInterval(deployTimer); setDeploy('ok', 'Đã lưu vào kho. Nếu website chưa đổi sau vài phút, kiểm tra tab Actions trên GitHub.', link); }
          return;
        }
        if (run.status === 'completed') {
          clearInterval(deployTimer);
          if (run.conclusion === 'success') setDeploy('ok', 'Website đã được cập nhật lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + '.', link);
          else setDeploy('err', 'Quá trình cập nhật website gặp lỗi (' + run.conclusion + '). Xem chi tiết tại tab Actions trên GitHub.', run.html_url);
        } else if (Date.now() - started > 10 * 60000) {
          clearInterval(deployTimer); setDeploy('', 'Quá trình cập nhật đang kéo dài bất thường. Kiểm tra tab Actions trên GitHub.', run.html_url);
        }
      }).catch(function () { /* bỏ qua lỗi tạm thời khi thăm dò */ });
    }
    setTimeout(poll, 4000);
    deployTimer = setInterval(poll, 10000);
  }
  $('#deploy-close').addEventListener('click', function () { $('#deploy').hidden = true; if (deployTimer) clearInterval(deployTimer); });

  /* ================= Khởi động ================= */
  /* API dùng chung cho mô-đun "Nội dung trang" (content.js) */
  window.AdminCore = {
    CFG: CFG, RAW: RAW, gh: gh, getFile: getFile, putFile: putFile, uploadFile: uploadFile, uploadImage: uploadImage,
    toast: toast, confirmDialog: confirmDialog, busy: busy, esc: esc, utf8ToB64: utf8ToB64, b64ToUtf8: b64ToUtf8,
    friendlyError: friendlyError, watchDeploy: watchDeploy, slugify: slugify, show: show, isLoggedIn: function () { return !!user; },
    lastCommit: function () { return lastUploadCommit; }
  };
  initLogin(); initList(); initEditorView();
  if (token) {
    verifyToken().then(enterApp).catch(function (err) {
      clearToken();
      openLogin();
      showLoginError('#login-error', friendlyError(err));
    });
  } else openLogin();
})();

/* Mô-đun "Nội dung trang": sửa content/site.json bằng biểu mẫu sinh tự động theo schema bên dưới.
   Dữ liệu này được tools/build_site.py dùng để sinh các trang Trang chủ, Giới thiệu, Năng lực, Dự án, Liên hệ. */
(function () {
  'use strict';
  var A = window.AdminCore;
  if (!A) return;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = A.esc;
  var FILE = 'content/site.json';

  var data = null, sha = null, dirty = false, changed = {}, current = null, openItems = {};

  /* ================= Schema ================= */
  var ICONS = [['plan', 'Bản kế hoạch'], ['survey', 'La bàn / khảo sát'], ['bridge', 'Cầu'], ['check', 'Dấu tích'], ['eye', 'Con mắt / giám sát'], ['build', 'Công trình'],
    ['clock', 'Đồng hồ'], ['shield', 'Khiên'], ['handshake', 'Bắt tay'], ['leaf', 'Lá cây'], ['chart', 'Biểu đồ'], ['users', 'Nhóm người'],
    ['briefcase', 'Cặp tài liệu'], ['globe', 'Quả địa cầu'], ['tools', 'Dụng cụ'], ['star', 'Ngôi sao'], ['award', 'Huy hiệu'], ['doc', 'Tài liệu']];
  var GRADES = ['Cấp đặc biệt', 'Cấp I', 'Cấp II', 'Cấp III', 'Cấp IV'];
  var CGRADES = ['Đặc biệt', 'I', 'II', 'III', 'IV'];
  var GROUPS = ['Thiết kế', 'Giám sát', 'Thi công'];
  var EQ = [{ k: 'name', label: 'Tên thiết bị' }, { k: 'unit', label: 'Đơn vị', w: '130px' }, { k: 'qty', label: 'Số lượng', type: 'number', w: '110px' }];

  var SECTIONS = [
    { key: 'company', grp: 'Chung', label: 'Thông tin công ty', page: 'lien-he.html', hint: 'Hiển thị ở đầu trang, chân trang, mục Thông tin chung (Giới thiệu) và trang Liên hệ.', type: 'object', fields: [
      { k: 'name', label: 'Tên công ty (in hoa)' }, { k: 'name_title', label: 'Tên công ty (viết thường – dùng trong tiêu đề trang)' },
      { k: 'name_en', label: 'Tên giao dịch tiếng Anh' }, { k: 'short', label: 'Tên viết tắt' },
      { k: 'slogan', label: 'Phương châm (slogan)' }, { k: 'ceo', label: 'Tổng Giám đốc' },
      { k: 'address', label: 'Địa chỉ trụ sở (đầy đủ)', type: 'textarea', full: true }, { k: 'address_short', label: 'Địa chỉ rút gọn (đầu trang / chân trang)' },
      { k: 'map_query', label: 'Địa chỉ tìm trên Google Maps (để nhúng bản đồ)' },
      { k: 'tel1', label: 'Điện thoại 1' }, { k: 'tel2', label: 'Điện thoại 2' }, { k: 'fax', label: 'Fax' }, { k: 'hotline', label: 'Hotline' },
      { k: 'email', label: 'E-mail' }, { k: 'domain', label: 'Tên miền' }, { k: 'url', label: 'Địa chỉ website (https://…)' },
      { k: 'capital', label: 'Vốn điều lệ' }, { k: 'tax', label: 'Mã số thuế' }, { k: 'founded', label: 'Ngày thành lập' },
      { k: 'license', label: 'Giấy chứng nhận đăng ký kinh doanh', type: 'textarea', full: true },
      { k: 'pdf', label: 'Tệp PDF hồ sơ năng lực (nút "Tải PDF")', type: 'file', exts: ['pdf'], maxMB: 40, dir: 'assets/docs', full: true }] },
    { key: 'letter', grp: 'Giới thiệu', label: 'Thư ngỏ', page: 'gioi-thieu.html#loi-mo-dau', hint: 'Câu phương châm (slogan) trong Thông tin công ty được chèn giữa phần mở đầu và phần kết.', type: 'object', fields: [
      { k: 'intro', label: 'Các đoạn mở đầu (mỗi đoạn một dòng)', type: 'lines', rows: 8, full: true },
      { k: 'outro', label: 'Các đoạn kết (mỗi đoạn một dòng)', type: 'lines', rows: 5, full: true },
      { k: 'signer_role', label: 'Chức danh người ký' }, { k: 'signer_name', label: 'Tên người ký' }] },
    { key: 'fields', grp: 'Giới thiệu', label: 'Ngành nghề kinh doanh', page: 'gioi-thieu.html#nganh-nghe', hint: 'Mỗi ngành nghề một dòng, hiển thị theo thứ tự.', type: 'lines', rows: 14 },
    { key: 'org', grp: 'Giới thiệu', label: 'Sơ đồ tổ chức', page: 'gioi-thieu.html#so-do', type: 'object', fields: [
      { k: 'left', label: 'Khối trực thuộc Tổng Giám đốc (mỗi phòng một dòng)', type: 'lines', rows: 5 },
      { k: 'right', label: 'Khối kỹ thuật – thuộc Phó Tổng Giám đốc (mỗi phòng một dòng)', type: 'lines', rows: 5 },
      { k: 'left_team', label: 'Đội trực thuộc (ô cuối nhánh trái)' }] },
    { key: 'leaders', grp: 'Giới thiệu', label: 'Ban lãnh đạo', page: 'gioi-thieu.html#lanh-dao', type: 'list', item: 'lãnh đạo', titleKey: 'name', fields: [
      { k: 'name', label: 'Họ tên' }, { k: 'role', label: 'Chức vụ' }, { k: 'degree', label: 'Học vị' }] },
    { key: 'departments', grp: 'Giới thiệu', label: 'Phòng ban & nhân sự', page: 'gioi-thieu.html#nhan-su', type: 'list', item: 'phòng ban', titleKey: 'name', countKey: 'staff', countLabel: 'người', fields: [
      { k: 'name', label: 'Tên phòng ban' }, { k: 'head', label: 'Phụ trách (tuỳ chọn)' },
      { k: 'staff', label: 'Danh sách nhân sự', type: 'table', item: 'người', fields: [{ k: 'name', label: 'Họ tên (kèm học vị, vd. KS. Nguyễn Văn A)' }, { k: 'title', label: 'Chức vụ', w: '220px' }] }] },
    { key: 'stats', grp: 'Trang chủ', label: 'Số liệu nổi bật', page: 'index.html', hint: 'Các con số chạy trên trang chủ.', type: 'list', item: 'số liệu', titleKey: 'label', fields: [
      { k: 'value', label: 'Giá trị', type: 'number' }, { k: 'suffix', label: 'Hậu tố (vd. "+", "+ tỷ")' }, { k: 'label', label: 'Nhãn', full: true }] },
    { key: 'services', grp: 'Trang chủ', label: 'Nhóm dịch vụ', page: 'index.html', hint: 'Các thẻ dịch vụ trên trang chủ và danh sách ở chân trang.', type: 'list', item: 'dịch vụ', titleKey: 'title', fields: [
      { k: 'title', label: 'Tiêu đề' }, { k: 'icon', label: 'Biểu tượng', type: 'select', options: ICONS }, { k: 'desc', label: 'Mô tả', type: 'textarea', full: true }] },
    { key: 'values', grp: 'Trang chủ', label: 'Giá trị cốt lõi', page: 'index.html', type: 'list', item: 'giá trị', titleKey: 'title', fields: [
      { k: 'title', label: 'Tiêu đề' }, { k: 'icon', label: 'Biểu tượng', type: 'select', options: ICONS }, { k: 'desc', label: 'Mô tả', type: 'textarea', full: true }] },
    { key: 'clients', grp: 'Trang chủ', label: 'Khách hàng tiêu biểu', page: 'index.html', hint: 'Mỗi khách hàng một dòng.', type: 'lines', rows: 16 },
    { key: 'legal', grp: 'Năng lực', label: 'Hồ sơ pháp lý', page: 'nang-luc.html#phap-ly', type: 'list', item: 'hồ sơ', titleKey: 'title', fields: [
      { k: 'title', label: 'Tên hồ sơ / chứng chỉ', full: true }, { k: 'image', label: 'Ảnh', type: 'image', full: true }] },
    { key: 'awards', grp: 'Năng lực', label: 'Giấy khen', page: 'nang-luc.html#giay-khen', type: 'list', item: 'giấy khen', titleKey: 'title', fields: [
      { k: 'title', label: 'Tên giấy khen', full: true }, { k: 'desc', label: 'Mô tả', type: 'textarea', full: true }, { k: 'image', label: 'Ảnh', type: 'image', full: true }] },
    { key: 'equipment', grp: 'Năng lực', label: 'Máy móc thiết bị', page: 'nang-luc.html#thiet-bi', type: 'object', fields: [
      { k: 'office', label: 'Máy móc thiết bị văn phòng', type: 'table', item: 'thiết bị', fields: EQ, full: true },
      { k: 'software', label: 'Phần mềm ứng dụng', type: 'table', item: 'phần mềm', fields: EQ, full: true },
      { k: 'site', label: 'Máy móc thiết bị thi công công trình', type: 'table', item: 'thiết bị', fields: EQ, full: true }] },
    { key: 'finance', grp: 'Năng lực', label: 'Năng lực tài chính', page: 'nang-luc.html#tai-chinh', hint: 'Đơn vị VNĐ. Các dòng có chữ "Tổng tài sản", "Tổng doanh thu", "Lợi nhuận" được dùng cho thẻ tóm tắt và biểu đồ.', type: 'object', fields: [
      { k: 'years', label: 'Các năm (mỗi năm một dòng, theo thứ tự cột)', type: 'lines', rows: 3 },
      { k: 'rows', label: 'Chỉ tiêu tài chính', type: 'table', item: 'chỉ tiêu', fields: [{ k: 'label', label: 'Chỉ tiêu', w: '220px' }, { k: 'values', label: 'Giá trị theo năm (VNĐ)', type: 'numbers', countFrom: 'years' }], full: true }] },
    { key: 'contracts', grp: 'Dự án', label: 'Bảng kê hợp đồng', page: 'du-an.html#hop-dong', hint: 'Mỗi nhóm là một tab trên trang Dự án. Giá trị hợp đồng nhập bằng số (VNĐ).', type: 'list', item: 'nhóm hợp đồng', titleKey: 'short', countKey: 'items', countLabel: 'hợp đồng', fields: [
      { k: 'short', label: 'Tên ngắn (hiện trên tab)' }, { k: 'title', label: 'Tên đầy đủ' },
      { k: 'items', label: 'Danh sách hợp đồng', type: 'table', item: 'hợp đồng', fields: [
        { k: 'client', label: 'Chủ đầu tư', type: 'textarea', w: '24%' }, { k: 'scope', label: 'Nội dung hợp đồng', type: 'textarea' },
        { k: 'value', label: 'Giá trị (VNĐ)', type: 'money', w: '150px' }, { k: 'grade', label: 'Cấp CT', type: 'select', options: CGRADES, w: '100px' }] }] },
    { key: 'projects', grp: 'Dự án', label: 'Công trình tiêu biểu', page: 'du-an.html#tieu-bieu', hint: 'Điền "Thứ tự trang chủ" (1, 2, 3…) cho công trình muốn hiện ở trang chủ; để trống nếu không.', type: 'list', item: 'công trình', titleKey: 'title', fields: [
      { k: 'title', label: 'Tên công trình', full: true }, { k: 'client', label: 'Chủ đầu tư', full: true },
      { k: 'group', label: 'Loại công việc', type: 'select', options: GROUPS }, { k: 'grade', label: 'Cấp công trình', type: 'select', options: GRADES },
      { k: 'specs', label: 'Thông số kỹ thuật (mỗi dòng một mục)', type: 'lines', rows: 4, full: true },
      { k: 'images', label: 'Hình ảnh (ảnh đầu dùng làm ảnh đại diện)', type: 'images', full: true },
      { k: 'home', label: 'Thứ tự trang chủ', type: 'number' }, { k: 'id', label: 'Mã liên kết (tự tạo từ tên nếu để trống)' }] }
  ];
  function section(key) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i]; return null; }

  /* ================= Tiện ích ================= */
  function pathGet(p) { return p.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, data); }
  function pathSet(p, v) {
    var ks = p.split('.'), o = data;
    for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = v;
  }
  function fmtMoney(n) { return (n === '' || n == null) ? '' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function thumb(p) { p = String(p || ''); if (!p) return ''; if (/^(https?:)?\/\//.test(p) || /^data:/.test(p)) return p; return A.RAW + (p.indexOf('/') >= 0 ? p.replace(/^\//, '') : 'assets/img/' + p); }
  function pageUrl(sec) { return A.CFG.siteUrl + '/' + (sec.page || 'index.html'); }
  function blank(fields) {
    var o = {};
    fields.forEach(function (f) {
      if (f.type === 'lines' || f.type === 'images' || f.type === 'table' || f.type === 'numbers') o[f.k] = [];
      else if (f.type === 'select') o[f.k] = Array.isArray(f.options[0]) ? f.options[0][0] : f.options[0];
      else o[f.k] = '';
    });
    return o;
  }
  function markDirty() {
    dirty = true; changed[current] = true;
    $('#content-dirty').hidden = false; $('#content-save').disabled = false;
  }
  function clearDirty() { dirty = false; changed = {}; $('#content-dirty').hidden = true; $('#content-save').disabled = true; }
  function opens(key) { return openItems[key] || (openItems[key] = {}); }
  function itemTitle(sec, it, i) {
    var t = (it && it[sec.titleKey]) || '';
    var c = sec.countKey ? ((it && it[sec.countKey]) || []).length + ' ' + sec.countLabel : '';
    if (sec.key === 'projects' && it && Number(it.home) > 0) c = 'Trang chủ #' + Number(it.home);
    return { title: t || (sec.item.charAt(0).toUpperCase() + sec.item.slice(1) + ' ' + (i + 1)), count: c };
  }

  /* ================= Sinh biểu mẫu ================= */
  function control(f, path, sec, inTable) {
    var v = pathGet(path);
    var attrs = ' data-path="' + esc(path) + '" data-type="' + esc(f.type || 'text') + '"';
    switch (f.type) {
      case 'textarea': return '<textarea' + attrs + ' rows="' + (inTable ? 2 : (f.rows || 3)) + '">' + esc(v == null ? '' : v) + '</textarea>';
      case 'number': return '<input type="number"' + attrs + ' value="' + esc(v == null || v === 0 && f.k === 'home' ? '' : v) + '">';
      case 'money': return '<input type="text" inputmode="numeric"' + attrs + ' value="' + esc(fmtMoney(v)) + '">';
      case 'select': {
        var opts = f.options.map(function (o) { return Array.isArray(o) ? o : [o, o]; });
        if (v != null && v !== '' && !opts.some(function (o) { return o[0] === v; })) opts.push([v, v]);
        return '<select' + attrs + '>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
      }
      case 'lines': return '<textarea' + attrs + ' rows="' + (f.rows || 5) + '">' + esc(Array.isArray(v) ? v.join('\n') : (v || '')) + '</textarea>';
      case 'numbers': {
        var n = ((pathGet(sec.key + '.' + f.countFrom) || []).filter(function (y) { return String(y).trim(); })).length || 1;
        var arr = Array.isArray(v) ? v : [];
        var cells = [];
        for (var j = 0; j < n; j++) cells.push('<input type="text" inputmode="numeric" data-path="' + esc(path + '.' + j) + '" data-type="money" value="' + esc(fmtMoney(arr[j] == null ? '' : arr[j])) + '">');
        return '<div class="nums">' + cells.join('') + '</div>';
      }
      case 'image': {
        var img = v ? '<img src="' + esc(thumb(v)) + '" alt="">' : '<div class="noimg">Chưa có ảnh</div>';
        return '<div class="img-single">' + img + '<div class="img-tools">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="upload" data-path="' + esc(path) + '" data-mode="single">Tải ảnh lên</button>' +
          (v ? '<button type="button" class="btn btn-ghost btn-sm" data-act="img-clear" data-path="' + esc(path) + '">Bỏ ảnh</button><small>' + esc(v) + '</small>' : '') + '</div></div>';
      }
      case 'images': {
        var list = Array.isArray(v) ? v : [];
        var items = list.map(function (p, i) {
          return '<div class="img-item"><img src="' + esc(thumb(p)) + '" alt="" title="' + esc(p) + '"><span class="item-actions">' +
            '<button type="button" class="iconbtn" data-act="up" data-path="' + esc(path) + '" data-idx="' + i + '" title="Lên trước"' + (i === 0 ? ' disabled' : '') + '>◀</button>' +
            '<button type="button" class="iconbtn" data-act="down" data-path="' + esc(path) + '" data-idx="' + i + '" title="Xuống sau"' + (i === list.length - 1 ? ' disabled' : '') + '>▶</button>' +
            '<button type="button" class="iconbtn danger" data-act="del-quiet" data-path="' + esc(path) + '" data-idx="' + i + '" title="Bỏ ảnh">✕</button></span></div>';
        }).join('');
        return '<div class="img-list">' + items + '<div class="img-item"><button type="button" class="noimg addimg" data-act="upload" data-path="' + esc(path) + '" data-mode="multi">+ Thêm ảnh</button></div></div>';
      }
      case 'file': {
        var href = v ? new URL('../' + String(v).replace(/^\//, ''), location.href).href : '';
        return '<div class="file-row">' + (v ? '<code>' + esc(v) + '</code><a class="btn-link" href="' + esc(href) + '" target="_blank" rel="noopener">Mở tệp ↗</a>' : '<span class="muted">Chưa có tệp</span>') +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="upload" data-path="' + esc(path) + '" data-mode="file">' + (v ? 'Thay tệp PDF' : 'Tải tệp PDF lên') + '</button>' +
          '<span class="hint" style="flex-basis:100%">Tệp mới sẽ ghi đè đúng địa chỉ cũ nên đường dẫn không đổi; website cập nhật sau 1–2 phút.</span></div>';
      }
      case 'table': return table(f, path, sec);
      default: return '<input type="text"' + attrs + ' value="' + esc(v == null ? '' : v) + '">';
    }
  }
  function field(f, path, sec) {
    var block = /^(table|images|image|file|numbers)$/.test(f.type || '');
    var tag = block ? 'div' : 'label';
    return '<' + tag + ' class="fld' + (f.full ? ' full' : '') + '">' + (block ? '<span class="label">' + esc(f.label) + '</span>' : esc(f.label)) +
      control(f, path, sec, false) + (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '</' + tag + '>';
  }
  function actions(path, i, n) {
    return '<span class="item-actions">' +
      '<button type="button" class="iconbtn" data-act="up" data-path="' + esc(path) + '" data-idx="' + i + '" title="Chuyển lên"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
      '<button type="button" class="iconbtn" data-act="down" data-path="' + esc(path) + '" data-idx="' + i + '" title="Chuyển xuống"' + (i === n - 1 ? ' disabled' : '') + '>▼</button>' +
      '<button type="button" class="iconbtn danger" data-act="del" data-path="' + esc(path) + '" data-idx="' + i + '" title="Xoá">✕</button></span>';
  }
  function table(f, path, sec) {
    var rows = pathGet(path); if (!Array.isArray(rows)) rows = [];
    var head = '<tr><th style="width:28px">#</th>' + f.fields.map(function (c) { return '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + esc(c.label) + '</th>'; }).join('') + '<th></th></tr>';
    var body = rows.map(function (r, i) {
      return '<tr><td class="idx">' + (i + 1) + '</td>' + f.fields.map(function (c) { return '<td>' + control(c, path + '.' + i + '.' + c.k, sec, true) + '</td>'; }).join('') +
        '<td class="acts">' + actions(path, i, rows.length).replace('data-act="del"', 'data-act="del-quiet"') + '</td></tr>';
    }).join('');
    return '<div class="table-wrap"><table class="edit-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      (rows.length ? '' : '<p class="muted small" style="margin:.4rem 0">Chưa có dòng nào.</p>') +
      '<button type="button" class="btn btn-ghost btn-sm add-row" data-act="add" data-path="' + esc(path) + '">+ Thêm ' + esc(f.item || 'dòng') + '</button>';
  }
  function list(sec) {
    var items = pathGet(sec.key); if (!Array.isArray(items)) items = [];
    var op = opens(sec.key);
    var html = items.map(function (it, i) {
      var t = itemTitle(sec, it, i);
      var isOpen = op[i] != null ? op[i] : items.length <= 4;
      return '<details class="item" data-idx="' + i + '"' + (isOpen ? ' open' : '') + '><summary><span class="idx">' + (i + 1) + '</span><span class="ttl">' + esc(t.title) + '</span>' +
        (t.count ? '<span class="cnt">' + esc(t.count) + '</span>' : '') + actions(sec.key, i, items.length) + '</summary>' +
        '<div class="item-body fields">' + sec.fields.map(function (f) { return field(f, sec.key + '.' + i + '.' + f.k, sec); }).join('') + '</div></details>';
    }).join('');
    if (!items.length) html += '<p class="muted" style="text-align:center;padding:1.5rem 0">Chưa có ' + esc(sec.item) + ' nào.</p>';
    return html + '<button type="button" class="btn btn-ghost add-row" data-act="add" data-path="' + esc(sec.key) + '">+ Thêm ' + esc(sec.item) + '</button>';
  }
  function render() {
    var sec = section(current); if (!sec || !data) return;
    var html = '<div class="sec-head"><div><h2>' + esc(sec.label) + '</h2>' + (sec.hint ? '<p class="muted">' + esc(sec.hint) + '</p>' : '') + '</div>' +
      '<a class="btn btn-ghost btn-sm" href="' + esc(pageUrl(sec)) + '" target="_blank" rel="noopener">Xem trang ↗</a></div>';
    if (sec.type === 'object') html += '<div class="fields">' + sec.fields.map(function (f) { return field(f, sec.key + '.' + f.k, sec); }).join('') + '</div>';
    else if (sec.type === 'lines') html += '<label class="fld full">' + esc(sec.label) + control({ type: 'lines', rows: sec.rows }, sec.key, sec) + '</label>';
    else html += list(sec);
    $('#content-form').innerHTML = html;
    document.querySelectorAll('#content-nav button').forEach(function (b) { b.classList.toggle('active', b.dataset.key === current); });
  }
  function rerender() { var y = window.scrollY; renderNav(); render(); window.scrollTo(0, y); }
  function renderNav() {
    var html = '', grp = null;
    SECTIONS.forEach(function (s) {
      if (s.grp !== grp) { grp = s.grp; html += '<div class="grp">' + esc(grp) + '</div>'; }
      var v = data ? data[s.key] : null;
      var n = Array.isArray(v) ? v.length : '';
      html += '<button type="button" data-key="' + s.key + '"><span>' + esc(s.label) + '</span>' + (n !== '' ? '<span class="n">' + n + '</span>' : '') + '</button>';
    });
    $('#content-nav').innerHTML = html;
  }

  /* ================= Dữ liệu ================= */
  function ensureShape() {
    SECTIONS.forEach(function (s) {
      if (s.type === 'object') { if (!data[s.key] || typeof data[s.key] !== 'object' || Array.isArray(data[s.key])) data[s.key] = {}; }
      else if (!Array.isArray(data[s.key])) data[s.key] = [];
      if (s.type === 'object') s.fields.forEach(function (f) {
        var v = data[s.key][f.k];
        if (/^(lines|table|images)$/.test(f.type || '') && !Array.isArray(v)) data[s.key][f.k] = [];
      });
    });
  }
  function load(force) {
    if (data && !force) { renderNav(); render(); return Promise.resolve(); }
    $('#content-loading').hidden = false; $('#content-error').hidden = true; $('#content-form').innerHTML = '';
    return A.getFile(FILE).then(function (d) {
      sha = d.sha; data = JSON.parse(A.b64ToUtf8(d.content));
      ensureShape(); clearDirty(); openItems = {};
      if (!current) current = SECTIONS[0].key;
      renderNav(); render();
    }).catch(function (err) {
      $('#content-error').textContent = 'Không tải được ' + FILE + ': ' + A.friendlyError(err);
      $('#content-error').hidden = false;
    }).finally(function () { $('#content-loading').hidden = true; });
  }
  /* Làm sạch trước khi lưu: bỏ dòng trống, ép số, tạo mã liên kết duy nhất. */
  function sanitize(src) {
    var d = JSON.parse(JSON.stringify(src));
    var str = function (v) { return v == null ? '' : String(v).trim(); };
    var lines = function (v) { return (Array.isArray(v) ? v : String(v || '').split('\n')).map(str).filter(Boolean); };
    var num = function (v) { if (v === '' || v == null) return ''; var n = parseInt(String(v).replace(/[^\d-]/g, ''), 10); return isNaN(n) ? '' : n; };
    var isBlank = function (o, fields) { return fields.every(function (f) { var v = o[f.k]; return Array.isArray(v) ? !v.length : str(v) === '' || (f.type === 'select'); }); };
    function cleanObj(o, fields, sec) {
      fields.forEach(function (f) {
        var v = o[f.k];
        if (f.type === 'lines' || f.type === 'images') o[f.k] = lines(v);
        else if (f.type === 'number' || f.type === 'money') o[f.k] = num(v) === '' ? (f.type === 'money' ? 0 : '') : num(v);
        else if (f.type === 'numbers') { var n = lines(d[sec.key][f.countFrom]).length; var arr = (Array.isArray(v) ? v : []).map(function (x) { return num(x) || 0; }); while (arr.length < n) arr.push(0); o[f.k] = arr.slice(0, n); }
        else if (f.type === 'table') o[f.k] = (Array.isArray(v) ? v : []).map(function (r) { return cleanObj(r, f.fields, sec); }).filter(function (r) { return !isBlank(r, f.fields); });
        else o[f.k] = str(v);
      });
      return o;
    }
    SECTIONS.forEach(function (s) {
      if (s.type === 'lines') d[s.key] = lines(d[s.key]);
      else if (s.type === 'object') cleanObj(d[s.key], s.fields, s);
      else d[s.key] = (d[s.key] || []).map(function (it) { return cleanObj(it, s.fields, s); }).filter(function (it) { return !isBlank(it, s.fields); });
    });
    var seen = {};
    d.projects.forEach(function (p) { var base = A.slugify(p.id || p.title) || 'cong-trinh', id = base, n = 2; while (seen[id]) id = base + '-' + (n++); seen[id] = 1; p.id = id; });
    seen = {};
    d.contracts.forEach(function (g) { var base = A.slugify(g.id || g.short || g.title) || 'nhom', id = base, n = 2; while (seen[id]) id = base + '-' + (n++); seen[id] = 1; g.id = id; });
    return d;
  }
  function save() {
    if (!data) return;
    var clean;
    try { clean = sanitize(data); } catch (e) { A.toast('Dữ liệu không hợp lệ: ' + e.message, 'err'); return; }
    var labels = Object.keys(changed).map(function (k) { var s = section(k); return s ? s.label : k; });
    var btn = $('#content-save'); A.busy(btn, true, 'Đang lưu…');
    A.putFile(FILE, A.utf8ToB64(JSON.stringify(clean, null, 2) + '\n'), 'Cập nhật nội dung trang: ' + (labels.join(', ') || 'chung'), sha).then(function (res) {
      sha = res.content.sha; data = clean; ensureShape();
      clearDirty(); renderNav(); rerender();
      A.toast('Đã lưu. Website đang được cập nhật…', 'ok');
      A.watchDeploy(res.commit && res.commit.sha, pageUrl(section(current)));
    }).catch(function (err) {
      A.toast(A.friendlyError(err), 'err');
      if (err.status === 409) A.confirmDialog('Nội dung đã thay đổi trên kho', 'Có người khác vừa sửa nội dung. Tải lại bản mới nhất? (Thay đổi chưa lưu của bạn sẽ mất.)', 'Tải lại').then(function (ok) { if (ok) load(true); });
    }).finally(function () { A.busy(btn, false); $('#content-save').disabled = !dirty; });
  }

  /* ================= Sự kiện ================= */
  function onInput(e) {
    var el = e.target, path = el.dataset.path; if (!path || !data) return;
    var t = el.dataset.type;
    if (t === 'number') pathSet(path, el.value === '' ? '' : Number(el.value));
    else if (t === 'money') { var digits = el.value.replace(/\D/g, ''); pathSet(path, digits ? parseInt(digits, 10) : ''); var fm = fmtMoney(digits ? parseInt(digits, 10) : ''); if (el.value !== fm) el.value = fm; }
    else if (t === 'lines') pathSet(path, el.value.split('\n'));
    else pathSet(path, el.value);
    markDirty();
    // Cập nhật tiêu đề thẻ khi sửa trường tiêu đề
    var sec = section(current), m = /^[^.]+\.(\d+)\.([^.]+)$/.exec(path);
    if (sec && sec.type === 'list' && m && m[2] === sec.titleKey) { var d = el.closest('details.item'); if (d) d.querySelector('.ttl').textContent = itemTitle(sec, pathGet(current + '.' + m[1]), Number(m[1])).title; }
  }
  function swap(arr, i, j) { var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  function remapOpen(fn) { var op = opens(current), n = {}; Object.keys(op).forEach(function (k) { var j = fn(Number(k)); if (j != null) n[j] = op[k]; }); openItems[current] = n; }
  function onClick(e) {
    var btn = e.target.closest('[data-act]'); if (!btn || !data) return;
    e.preventDefault();
    var act = btn.dataset.act, path = btn.dataset.path, idx = Number(btn.dataset.idx);
    var arr = pathGet(path);
    var isTop = path === current;
    if (act === 'add') {
      if (!Array.isArray(arr)) { arr = []; pathSet(path, arr); }
      var f = isTop ? section(current) : findField(path);
      arr.push(f && f.fields ? blank(f.fields) : '');
      markDirty();
      if (isTop) { opens(current)[arr.length - 1] = true; }
      rerender();
      if (isTop) { var el = document.querySelector('.item[data-idx="' + (arr.length - 1) + '"]'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); var inp = el.querySelector('input, textarea'); if (inp) inp.focus(); } }
    } else if (act === 'del' || act === 'del-quiet') {
      var doDel = function () { arr.splice(idx, 1); markDirty(); if (isTop) remapOpen(function (i) { return i === idx ? null : (i > idx ? i - 1 : i); }); rerender(); };
      if (act === 'del-quiet' || !Array.isArray(arr)) return doDel();
      var t = itemTitle(section(current), arr[idx], idx).title;
      A.confirmDialog('Xoá mục', 'Xoá “' + t + '”? Thay đổi chỉ có hiệu lực sau khi bấm Lưu.', 'Xoá').then(function (ok) { if (ok) doDel(); });
    } else if (act === 'up' || act === 'down') {
      var j = act === 'up' ? idx - 1 : idx + 1;
      if (!Array.isArray(arr) || j < 0 || j >= arr.length) return;
      swap(arr, idx, j); markDirty();
      if (isTop) remapOpen(function (i) { return i === idx ? j : (i === j ? idx : i); });
      rerender();
    } else if (act === 'img-clear') {
      pathSet(path, ''); markDirty(); rerender();
    } else if (act === 'upload') {
      pickFiles(btn.dataset.mode, path, btn);
    }
  }
  function findField(path) {
    // Tìm định nghĩa trường "table" theo đường dẫn: <section>.<k> hoặc <section>.<i>.<k>
    var ks = path.split('.'), sec = section(ks[0]); if (!sec) return null;
    var k = ks[ks.length - 1];
    var fields = sec.fields || [];
    for (var i = 0; i < fields.length; i++) if (fields[i].k === k) return fields[i];
    return null;
  }
  function pickFiles(mode, path, btn) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = mode === 'file' ? '.pdf,application/pdf' : 'image/*';
    inp.multiple = mode === 'multi';
    inp.addEventListener('change', function () {
      var files = Array.prototype.slice.call(inp.files || []); if (!files.length) return;
      var label = btn.textContent; btn.disabled = true; btn.textContent = 'Đang tải…';
      var chain = Promise.resolve(), done = 0;
      files.forEach(function (file) {
        chain = chain.then(function () {
          if (mode === 'file') {
            var f = findField(path) || {}; var cur = String(pathGet(path) || '');
            var opts = { kind: 'file', exts: f.exts || ['pdf'], maxMB: f.maxMB || 40, dir: f.dir || 'assets/docs' };
            if (cur && f.exts && new RegExp('\\.(' + f.exts.join('|') + ')$', 'i').test(cur)) opts.path = cur.replace(/^\//, '');
            return A.uploadFile(file, opts).then(function (p) { if (p !== cur) { pathSet(path, p); markDirty(); } A.toast('Đã tải tệp lên. Website sẽ cập nhật sau 1–2 phút.', 'ok'); A.watchDeploy(A.lastCommit(), pageUrl(section(current))); });
          }
          return A.uploadImage(file).then(function (p) {
            if (mode === 'multi') { var arr = pathGet(path); if (!Array.isArray(arr)) { arr = []; pathSet(path, arr); } arr.push(p); }
            else pathSet(path, p);
            markDirty(); done++;
            if (files.length > 1) btn.textContent = 'Đang tải ' + done + '/' + files.length + '…';
          });
        });
      });
      chain.then(function () { if (mode !== 'file') A.toast(files.length > 1 ? 'Đã tải ' + files.length + ' ảnh' : 'Đã tải ảnh lên', 'ok'); })
        .catch(function (err) { A.toast('Tải tệp thất bại: ' + A.friendlyError(err), 'err'); })
        .finally(function () { btn.disabled = false; btn.textContent = label; rerender(); });
    });
    inp.click();
  }
  function onToggle(e) {
    var d = e.target; if (!d.classList || !d.classList.contains('item')) return;
    opens(current)[Number(d.dataset.idx)] = d.open;
  }

  /* ================= Khởi tạo ================= */
  var form = $('#content-form');
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('click', onClick);
  form.addEventListener('toggle', onToggle, true);
  $('#content-nav').addEventListener('click', function (e) { var b = e.target.closest('button[data-key]'); if (!b) return; current = b.dataset.key; render(); });
  $('#content-save').addEventListener('click', save);
  $('#content-reload').addEventListener('click', function () {
    (dirty ? A.confirmDialog('Tải lại nội dung', 'Bỏ các thay đổi chưa lưu và tải lại từ kho?', 'Tải lại') : Promise.resolve(true)).then(function (ok) { if (ok) load(true); });
  });
  $('#content-save').disabled = true;

  window.AdminContent = {
    open: function () { A.show('content'); load(false); },
    isDirty: function () { return dirty; },
    reset: function () { data = null; sha = null; clearDirty(); openItems = {}; $('#content-form').innerHTML = ''; $('#content-nav').innerHTML = ''; }
  };
})();

# -*- coding: utf-8 -*-
"""Sinh website tĩnh ANSON JSC từ content/site.json (qua site_data.py) và content/posts/*.md

Cách dùng (từ thư mục gốc website):  python tools\\build_site.py
Hoặc chỉ định thư mục xuất:          python tools\\build_site.py <thư mục>
"""
import os, sys, html
from site_data import *

# Mặc định xuất ra thư mục cha của thư mục chứa script (thư mục gốc website)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = COMPANY
ROOT = ""            # tiền tố đường dẫn tương đối: "" cho trang gốc, "../" cho trang trong thư mục con
IMG = "assets/img/"
POSTS_DIR = os.path.join(OUT, "content", "posts")   # bài viết Markdown do trang quản trị tạo
POST_URL_DIR = "tin-tuc"                             # thư mục xuất trang bài viết
PLACEHOLDER_IMG = "prj-tk-gtxanh-1.jpg"              # ảnh thay thế khi mục không có ảnh

def set_root(r):
    global ROOT, IMG
    ROOT = r
    IMG = r + "assets/img/"

def img_url(f):
    """Ảnh khai báo bằng tên tệp (trong assets/img/) hoặc đường dẫn từ gốc website (vd. assets/uploads/...)."""
    f = str(f or "").strip() or PLACEHOLDER_IMG
    if f.startswith(("http://", "https://", "data:")):
        return f
    return ROOT + f.lstrip("/") if "/" in f else IMG + f

def esc(s):
    return html.escape(str(s), quote=True)

def money(n):
    return f"{n:,}".replace(",", ".")

def bil(n):
    return f"{n/1e9:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# ---------------- ICONS ----------------
def ico(name, cls=""):
    paths = {
        "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
        "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
        "fax": '<path d="M6 9V3h12v6"/><rect x="2" y="9" width="20" height="10" rx="2"/><path d="M6 15h.01M10 15h.01M14 15h.01M18 15h.01M6 19v2h12v-2"/>',
        "pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
        "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
        "award": '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
        "doc": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
        "check": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10-3-3"/>',
        "arrow": '<path d="M5 12h14M12 5l7 7-7 7"/>',
        "up": '<path d="m18 15-6-6-6 6"/>',
        "menu": '<path d="M3 6h18M3 12h18M3 18h18"/>',
        "plan": '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
        "survey": '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
        "bridge": '<path d="M2 18h20M4 18v-6M20 18v-6M2 12c4-5 16-5 20 0M8 18v-5M12 18v-6M16 18v-5"/>',
        "eye": '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        "build": '<path d="M2 20h20"/><path d="M4 20v-5a8 8 0 0 1 16 0v5"/><path d="M10 15V8a2 2 0 0 1 4 0v7"/>',
        "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
        "handshake": '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
        "leaf": '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
        "chart": '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-3"/>',
        "users": '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        "briefcase": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        "globe": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        "tools": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        "star": '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
        "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        "send": '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
        "flag": '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
        "layers": '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
    }
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths[name]}</svg>')

# ---------------- LAYOUT ----------------
def head(title, desc, page, og_img="prj-tc-ongco-1.jpg", nav=None, og_type="website", extra=""):
    full = f"{title} | {C['name_title']}" if page != "index.html" else f"{C['name_title']} – Tư vấn thiết kế, giám sát & thi công công trình giao thông"
    og_abs = og_img if og_img.startswith("http") else f"{C['url']}/{og_img if '/' in og_img else 'assets/img/' + og_img}"
    body_attr = f' data-nav="{nav}"' if nav else ""
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="keywords" content="An Sơn, ANSON JSC, tư vấn thiết kế cầu đường, tư vấn giám sát, thi công công trình giao thông, khảo sát địa hình, lập dự án đầu tư, TP.HCM">
<meta name="author" content="{esc(C['name_title'])}">
<link rel="canonical" href="{C['url']}/{page if page != 'index.html' else ''}">
<meta property="og:type" content="{og_type}">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="{esc(C['name_title'])}">
<meta property="og:title" content="{esc(full)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{C['url']}/{page if page != 'index.html' else ''}">
<meta property="og:image" content="{og_abs}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a3d91">
<link rel="icon" href="{ROOT}assets/img/favicon.ico" sizes="32x32">
<link rel="icon" href="{ROOT}assets/img/favicon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="{ROOT}assets/img/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{ROOT}assets/css/style.css">
{extra}<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{esc(C['name_title'])}",
  "alternateName": ["{esc(C['name_en'])}", "{esc(C['short'])}"],
  "url": "{C['url']}",
  "logo": "{C['url']}/assets/img/logo-stacked.png",
  "email": "{C['email']}",
  "telephone": "+84 {C['tel1_raw'][1:]}",
  "foundingDate": "2007-03-15",
  "taxID": "{C['tax']}",
  "address": {{
    "@type": "PostalAddress",
    "streetAddress": "448/1 Đường 448",
    "addressLocality": "Phường Tăng Nhơn Phú",
    "addressRegion": "Thành phố Hồ Chí Minh",
    "addressCountry": "VN"
  }}
}}
</script>
</head>
<body{body_attr}>
"""

def topbar():
    return f"""<div class="topbar">
  <div class="container">
    <ul>
      <li>{ico('phone')}<a href="tel:{C['tel1_raw']}">{C['tel1']}</a> – <a href="tel:{C['tel2_raw']}">{C['tel2']}</a></li>
      <li>{ico('mail')}<a href="mailto:{C['email']}">{C['email']}</a></li>
      <li>{ico('pin')}<span>{esc(C['address_short'])}</span></li>
    </ul>
    <span class="slogan">{esc(C['slogan'])}</span>
  </div>
</div>
"""

def header():
    links = "".join(f'<a href="{ROOT}{h}">{t}</a>' for h, t in NAV)
    return f"""<header class="header">
  <div class="container">
    <a class="brand" href="{ROOT}index.html" aria-label="{esc(C['name_title'])} – Trang chủ">
      <img src="{ROOT}assets/img/logo-mark.svg" alt="Logo An Sơn" width="72" height="46">
      <span class="brand-text"><span class="brand-name">AN SƠN</span><span class="brand-sub">Công ty Cổ phần An Sơn</span></span>
    </a>
    <nav class="nav" id="nav" aria-label="Menu chính">
      {links}
      <a class="btn btn-primary btn-sm" href="{ROOT}{C['pdf']}" target="_blank" rel="noopener">{ico('download')} Hồ sơ năng lực</a>
    </nav>
    <a class="btn btn-primary btn-sm header-cta" href="{ROOT}{C['pdf']}" target="_blank" rel="noopener">{ico('download')} Tải hồ sơ năng lực</a>
    <button class="nav-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="nav">{ico('menu')}</button>
  </div>
</header>
"""

def footer():
    links = "".join(f'<li><a href="{ROOT}{h}">{t}</a></li>' for h, t in NAV)
    svc = "".join(f'<li>{ico("check")}<span>{esc(t)}</span></li>' for _, t, _ in SERVICES)
    return f"""<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="{ROOT}index.html">
          <img src="{ROOT}assets/img/logo-mark-white.svg" alt="Logo An Sơn" width="72" height="46">
          <span class="brand-text"><span class="brand-name">AN SƠN</span><span class="brand-sub">{esc(C['name_en'])}</span></span>
        </a>
        <p>Doanh nghiệp tư vấn khảo sát, thiết kế, giám sát và thi công công trình giao thông với hơn 18 năm kinh nghiệm tại TP. Hồ Chí Minh và các tỉnh phía Nam.</p>
        <p><strong>Mã số thuế:</strong> {C['tax']}<br><strong>Vốn điều lệ:</strong> {esc(C['capital'])}</p>
      </div>
      <div>
        <h4>Liên kết</h4>
        <ul>{links}<li><a href="{ROOT}{C['pdf']}" target="_blank" rel="noopener">Tải hồ sơ năng lực (PDF)</a></li></ul>
      </div>
      <div>
        <h4>Lĩnh vực</h4>
        <ul>{svc}</ul>
      </div>
      <div>
        <h4>Liên hệ</h4>
        <ul>
          <li>{ico('pin')}<span>{esc(C['address'])}</span></li>
          <li>{ico('phone')}<span><a href="tel:{C['tel1_raw']}">{C['tel1']}</a> – <a href="tel:{C['tel2_raw']}">{C['tel2']}</a></span></li>
          <li>{ico('fax')}<span>Fax: {C['fax']}</span></li>
          <li>{ico('mail')}<a href="mailto:{C['email']}">{C['email']}</a></li>
          <li>{ico('globe')}<a href="{C['url']}">{C['domain']}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> {esc(C['name_title'])}. Bảo lưu mọi quyền. <a class="admin-link" href="{ROOT}admin/" rel="nofollow">Quản trị</a></span>
      <span class="slogan">{esc(C['slogan'])}</span>
    </div>
  </div>
</footer>
<button class="to-top" aria-label="Lên đầu trang">{ico('up')}</button>
<script src="{ROOT}assets/js/main.js"></script>
</body>
</html>
"""

def page_hero(title, sub, bg, crumb, crumbs=None):
    trail = "".join(f'<li><a href="{ROOT}{h}">{esc(t)}</a></li>' for h, t in (crumbs or []))
    return f"""<section class="page-hero">
  <div class="bg" style="background-image:url('{bg if bg.startswith(('http', '../', 'assets/')) else IMG + bg}')"></div>
  <div class="container">
    <ol class="breadcrumb"><li><a href="{ROOT}index.html">Trang chủ</a></li>{trail}<li>{esc(crumb)}</li></ol>
    <h1>{title}</h1>
    <p>{sub}</p>
  </div>
</section>
"""

def subnav(items):
    return '<div class="subnav"><div class="container"><ul>' + "".join(
        f'<li><a href="#{i}">{t}</a></li>' for i, t in items) + '</ul></div></div>\n'

def section_head(eyebrow, title, desc="", left=False):
    cls = "section-head left" if left else "section-head"
    d = f"<p>{desc}</p>" if desc else ""
    return f'<div class="{cls} reveal"><span class="eyebrow">{esc(eyebrow)}</span><h2>{title}</h2>{d}</div>'

def project_by_id(pid):
    return next((p for p in PROJECTS if p[0] == pid), None)

def group_chip(group):
    cls = {"Thiết kế": "", "Giám sát": "navy", "Thi công": ""}.get(group, "")
    return cls

# ---------------- BÀI VIẾT (TIN TỨC) ----------------
import re, datetime, glob, shutil

POST_CATEGORIES = ["Tin công ty", "Dự án", "Thông báo", "Tuyển dụng"]

try:
    import markdown as _markdown

    def md_to_html(text):
        return _markdown.markdown(text, extensions=["extra", "sane_lists"], output_format="html5")
except ImportError:  # bộ chuyển đổi tối giản khi chưa cài `pip install markdown`
    def _inline(s):
        s = esc(s)
        s = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", r'<img src="\2" alt="\1">', s)
        s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*", r"<em>\1</em>", s)
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        return s

    def md_to_html(text):
        out, para, lst = [], [], None

        def flush():
            nonlocal para, lst
            if para:
                out.append("<p>" + _inline(" ".join(para)) + "</p>")
                para = []
            if lst:
                out.append(f"</{lst}>")
                lst = None

        for raw in text.splitlines():
            line = raw.rstrip()
            if not line.strip():
                flush(); continue
            m = re.match(r"^(#{1,6})\s+(.*)", line)
            if m:
                flush(); out.append(f"<h{len(m[1])}>{_inline(m[2])}</h{len(m[1])}>"); continue
            if re.match(r"^(-{3,}|\*{3,})$", line.strip()):
                flush(); out.append("<hr>"); continue
            if line.startswith(">"):
                flush(); out.append(f"<blockquote><p>{_inline(line.lstrip('> '))}</p></blockquote>"); continue
            m = re.match(r"^\s*([-*+]|\d+\.)\s+(.*)", line)
            if m:
                kind = "ol" if m[1][0].isdigit() else "ul"
                if para or (lst and lst != kind):
                    flush()
                if not lst:
                    out.append(f"<{kind}>"); lst = kind
                out.append(f"<li>{_inline(m[2])}</li>"); continue
            if lst:
                flush()
            para.append(line.strip())
        flush()
        return "\n".join(out)

def parse_front_matter(text):
    """Tách phần đầu `--- key: value ---` khỏi nội dung Markdown."""
    meta = {}
    text = text.lstrip("\ufeff")
    if text.startswith("---"):
        parts = text.split("\n", 1)[1].split("\n---", 1)
        if len(parts) == 2:
            for line in parts[0].splitlines():
                if ":" in line and not line.startswith(" "):
                    k, v = line.split(":", 1)
                    v = v.strip()
                    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                        v = v[1:-1]
                    meta[k.strip()] = v
            return meta, parts[1].lstrip("\n")
    return meta, text

def fmt_date(iso):
    try:
        d = datetime.date.fromisoformat(iso[:10])
        return d.strftime("%d/%m/%Y")
    except ValueError:
        return iso

def plain_text(html_str, limit=160):
    t = re.sub(r"<[^>]+>", " ", html_str)
    t = re.sub(r"\s+", " ", html.unescape(t)).strip()
    return t if len(t) <= limit else t[:limit].rsplit(" ", 1)[0] + "…"

def localize_assets(html_str):
    """Đưa đường dẫn ảnh về tương đối theo ROOT (kể cả link raw.githubusercontent do trang quản trị chèn)."""
    html_str = re.sub(r"https://raw\.githubusercontent\.com/[^/\s\"')]+/[^/\s\"')]+/[^/\s\"')]+/(assets/)", ROOT + r"\1", html_str)
    html_str = re.sub(r'(src|href)="(assets/)', rf'\1="{ROOT}\2', html_str)
    return html_str

def load_posts(include_drafts=False):
    posts = []
    for path in sorted(glob.glob(os.path.join(POSTS_DIR, "*.md"))):
        slug = os.path.splitext(os.path.basename(path))[0]
        with open(path, encoding="utf-8") as f:
            meta, body = parse_front_matter(f.read())
        published = meta.get("published", "true").strip().lower() not in ("false", "0", "no")
        if not published and not include_drafts:
            continue
        cover = meta.get("cover", "").strip()
        cover = re.sub(r"https://raw\.githubusercontent\.com/[^/]+/[^/]+/[^/]+/", "", cover)
        posts.append({
            "slug": slug,
            "title": meta.get("title", slug).strip(),
            "date": meta.get("date", "1970-01-01").strip(),
            "category": meta.get("category", POST_CATEGORIES[0]).strip() or POST_CATEGORIES[0],
            "cover": cover,
            "summary": meta.get("summary", "").strip(),
            "published": published,
            "body_md": body,
            "url": f"{POST_URL_DIR}/{slug}.html",
        })
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts

def post_cover(p):
    return f"{ROOT}{p['cover']}" if p["cover"] else f"{IMG}prj-tk-gtxanh-1.jpg"

def news_card(p):
    summary = p["summary"] or plain_text(md_to_html(p["body_md"]))
    return f"""<a class="news-card reveal" href="{ROOT}{p['url']}" data-category="{esc(p['category'])}">
  <div class="thumb"><img src="{post_cover(p)}" alt="{esc(p['title'])}" loading="lazy"><span class="badge">{esc(p['category'])}</span></div>
  <div class="body"><time datetime="{esc(p['date'])}">{ico('calendar')} {fmt_date(p['date'])}</time><h3>{esc(p['title'])}</h3><p>{esc(summary)}</p><span class="more">Đọc tiếp {ico('arrow')}</span></div>
</a>"""

def build_news(posts):
    cats = [c for c in POST_CATEGORIES if any(p["category"] == c for p in posts)]
    cats += sorted({p["category"] for p in posts} - set(POST_CATEGORIES))
    filters = "".join(f'<button class="tab-btn" data-filter="{esc(c)}">{esc(c)} <span class="cnt">{sum(1 for p in posts if p["category"] == c)}</span></button>' for c in cats)
    cards = "".join(news_card(p) for p in posts)
    if posts:
        content = f"""<div class="tabs" data-filter-group>{'<button class="tab-btn active" data-filter="*">Tất cả <span class="cnt">' + str(len(posts)) + '</span></button>' + filters}</div>
    <div class="grid grid-3 news-grid">{cards}</div>
    <p class="empty-filter muted text-center" hidden>Chưa có bài viết trong mục này.</p>"""
    else:
        content = '<div class="empty-state reveal"><h3>Chưa có bài viết</h3><p class="muted">Tin tức của công ty sẽ được cập nhật tại đây.</p></div>'
    body = page_hero("Tin tức &amp; sự kiện", "Hoạt động của Công ty Cổ phần An Sơn, thông tin dự án và các thông báo mới nhất.", "prj-gs-catlai-1.jpg", "Tin tức")
    body += f"""
<section class="section" id="tin-tuc">
  <div class="container">
    {content}
  </div>
</section>
"""
    return head("Tin tức & sự kiện", "Tin tức, hoạt động và thông báo mới nhất từ Công ty Cổ phần An Sơn – tư vấn thiết kế, giám sát và thi công công trình giao thông.", "tin-tuc.html", "prj-gs-catlai-1.jpg") + topbar() + header() + body + footer()

def build_post(p, posts):
    set_root("../")
    try:
        body_html = localize_assets(md_to_html(p["body_md"]))
        desc = p["summary"] or plain_text(body_html)
        recent = [q for q in posts if q["slug"] != p["slug"]][:5]
        recent_html = "".join(
            f'<li><a href="{ROOT}{q["url"]}"><img src="{post_cover(q)}" alt="" loading="lazy"><span><strong>{esc(q["title"])}</strong><time>{fmt_date(q["date"])}</time></span></a></li>'
            for q in recent) or '<li class="muted small">Chưa có bài viết khác.</li>'
        share_url = f"{C['url']}/{p['url']}"
        cover_html = f'<figure class="post-cover"><img src="{post_cover(p)}" alt="{esc(p["title"])}"></figure>' if p["cover"] else ""
        og = f"{C['url']}/{p['cover']}" if p["cover"] else "prj-tk-gtxanh-1.jpg"
        ld = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"NewsArticle","headline":{json_str(p['title'])},"datePublished":"{esc(p['date'])}","image":[{json_str(og if og.startswith('http') else C['url'] + '/assets/img/' + og)}],"author":{{"@type":"Organization","name":{json_str(C['name_title'])}}},"publisher":{{"@type":"Organization","name":{json_str(C['name_title'])},"logo":{{"@type":"ImageObject","url":"{C['url']}/assets/img/logo-stacked.png"}}}},"description":{json_str(desc)}}}
</script>
"""
        body = f"""
<section class="post-hero">
  <div class="container">
    <ol class="breadcrumb"><li><a href="{ROOT}index.html">Trang chủ</a></li><li><a href="{ROOT}tin-tuc.html">Tin tức</a></li><li>{esc(p['category'])}</li></ol>
    <span class="chip accent">{esc(p['category'])}</span>
    <h1>{esc(p['title'])}</h1>
    <div class="post-meta"><time datetime="{esc(p['date'])}">{ico('calendar')} {fmt_date(p['date'])}</time><span>{ico('users')} {esc(C['short'])}</span></div>
  </div>
</section>
<section class="section post-section">
  <div class="container post-layout">
    <article class="post reveal">
      {cover_html}
      {f'<p class="post-summary">{esc(p["summary"])}</p>' if p["summary"] else ''}
      <div class="prose">
{body_html}
      </div>
      <div class="post-share">
        <span>Chia sẻ:</span>
        <a class="btn btn-outline btn-sm" href="https://www.facebook.com/sharer/sharer.php?u={html.escape(share_url)}" target="_blank" rel="noopener">Facebook</a>
        <button class="btn btn-outline btn-sm" type="button" data-copy-link>Sao chép liên kết</button>
      </div>
      <p class="post-nav"><a href="{ROOT}tin-tuc.html">{ico('arrow')} Tất cả tin tức</a></p>
    </article>
    <aside class="post-aside">
      <div class="card">
        <h3>Bài viết khác</h3>
        <ul class="recent-posts">{recent_html}</ul>
      </div>
      <div class="card aside-cta">
        <h3>Cần tư vấn cho dự án?</h3>
        <p class="muted small">Liên hệ An Sơn để nhận hồ sơ năng lực đầy đủ và giải pháp phù hợp.</p>
        <a class="btn btn-primary btn-sm" href="{ROOT}lien-he.html">{ico('send')} Liên hệ ngay</a>
        <a class="btn btn-outline btn-sm" href="{ROOT}{C['pdf']}" target="_blank" rel="noopener">{ico('download')} Hồ sơ năng lực</a>
      </div>
    </aside>
  </div>
</section>
"""
        return head(p["title"], desc, p["url"], og, nav="tin-tuc.html", og_type="article", extra=ld) + topbar() + header() + body + footer()
    finally:
        set_root("")

def json_str(s):
    import json
    return json.dumps(str(s), ensure_ascii=False)

# ---------------- TRANG CHỦ ----------------
def build_index(posts=()):
    stats = "".join(
        f'<div class="stat reveal"><div class="stat-value" data-count="{v}" data-suffix="{esc(s)}">{v}<small>{esc(s)}</small></div><div class="stat-label">{esc(l)}</div></div>'
        for v, s, l in STATS)
    services = "".join(
        f'<article class="card service-card reveal"><span class="num">0{i+1}</span><div class="icon-box">{ico(icon)}</div><h3>{esc(t)}</h3><p>{esc(d)}</p></article>'
        for i, (icon, t, d) in enumerate(SERVICES))
    values = "".join(
        f'<div class="value reveal"><div class="icon-box">{ico(icon)}</div><h3>{esc(t)}</h3><p>{esc(d)}</p></div>'
        for icon, t, d in VALUES)
    projects = ""
    for pid in HOME_PROJECT_IDS:
        p = project_by_id(pid)
        if not p:
            continue
        _, group, name, owner, grade, specs, imgs = p
        projects += f"""<a class="project-card reveal" href="du-an.html#prj-{pid}">
  <div class="thumb"><img src="{img_url(imgs[0] if imgs else '')}" alt="{esc(name)}" loading="lazy"><span class="badge {group_chip(group)}">{esc(group)}</span></div>
  <div class="body"><h3>{esc(name)}</h3><p class="meta">{esc(owner)}</p><span class="chip accent">Công trình {esc(grade.lower())}</span></div>
</a>"""
    awards = "".join(
        f'<article class="cert-card reveal"><a class="thumb" href="{img_url(f)}" data-lightbox="awards" data-caption="{esc(t)}"><img src="{img_url(f)}" alt="{esc(t)}" loading="lazy"></a><div class="body"><h3>{esc(t)}</h3><p>{esc(d)}</p></div></article>'
        for f, t, d in AWARDS)
    clients = "".join(f"<span>{esc(c)}</span>" for c in CLIENTS)
    total_contracts = sum(len(g[3]) for g in CONTRACT_GROUPS)
    total_value = sum(r[2] for g in CONTRACT_GROUPS for r in g[3])
    latest = list(posts)[:3]
    news_section = f"""
<section class="section section-alt" id="tin-tuc">
  <div class="container">
    {section_head("Tin tức &amp; sự kiện", "Hoạt động mới nhất của An Sơn")}
    <div class="grid grid-3 news-grid">{"".join(news_card(p) for p in latest)}</div>
    <p class="text-center" style="margin-top:2.5rem"><a class="btn btn-outline" href="tin-tuc.html">Xem tất cả tin tức {ico('arrow')}</a></p>
  </div>
</section>
""" if latest else ""

    body = f"""
<section class="hero">
  <div class="hero-bg" style="background-image:url('{IMG}prj-tc-ongco-1.jpg')"></div>
  <div class="container">
    <div class="hero-content">
      <span class="hero-badge">{ico('award')} Hơn 18 năm kinh nghiệm · Thành lập 2007</span>
      <h1>Tư vấn thiết kế, giám sát &amp; thi công <span>công trình giao thông</span></h1>
      <p>Công ty Cổ phần An Sơn cung cấp giải pháp trọn gói từ khảo sát, lập dự án, thiết kế, thẩm tra đến giám sát và thi công cầu – đường bộ, hạ tầng kỹ thuật trên khắp các tỉnh phía Nam.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="nang-luc.html">Xem hồ sơ năng lực {ico('arrow')}</a>
        <a class="btn btn-outline-light" href="du-an.html">Dự án tiêu biểu</a>
      </div>
    </div>
  </div>
</section>

<div class="stats"><div class="container"><div class="stats-grid">{stats}</div></div></div>

<section class="section" id="gioi-thieu">
  <div class="container intro">
    <div class="intro-media reveal">
      <img src="{IMG}prj-tk-bdtn-2.jpg" alt="Phối cảnh cầu kết nối Bình Dương – Tây Ninh do An Sơn thiết kế" loading="lazy">
      <div class="float-card"><div class="big">2007</div><div class="lbl">Năm thành lập – Giấy ĐKKD số {C['tax']} do Sở KH&amp;ĐT TP.HCM cấp</div></div>
    </div>
    <div class="intro-text reveal">
      <span class="eyebrow">Về chúng tôi</span>
      <h2>Đối tác tin cậy trong lĩnh vực xây dựng công trình giao thông</h2>
      <p>Công ty Cổ phần An Sơn được thành lập với chức năng hoạt động về tư vấn khảo sát xây dựng, tư vấn đấu thầu, lập quy hoạch, lập dự án đầu tư, thiết kế xây dựng công trình, thẩm tra thiết kế và dự toán, giám sát thi công xây dựng và thi công xây dựng công trình giao thông, dân dụng, thủy lợi.</p>
      <p>Trải qua hơn 18 năm hoạt động, An Sơn đã khẳng định thương hiệu và quy mô trong lĩnh vực xây dựng công trình giao thông với đội ngũ cán bộ, chuyên gia giàu kinh nghiệm và không ngừng ứng dụng công nghệ mới.</p>
      <ul class="check-list">
        <li>{ico('check')}<span>Chứng chỉ năng lực hoạt động xây dựng do cơ quan có thẩm quyền cấp</span></li>
        <li>{ico('check')}<span>Đội ngũ thạc sĩ, kỹ sư cầu đường, kiến trúc sư và cộng tác viên chuyên môn cao</span></li>
        <li>{ico('check')}<span>Thiết bị khảo sát, thi công hiện đại; phần mềm thiết kế – dự toán chuyên ngành</span></li>
        <li>{ico('check')}<span>Được Sở GTVT Tây Ninh, UBND tỉnh An Giang, Sở GTVT Kiên Giang tặng Giấy khen</span></li>
      </ul>
      <a class="btn btn-navy" href="gioi-thieu.html">Tìm hiểu thêm {ico('arrow')}</a>
    </div>
  </div>
</section>

<section class="section section-alt" id="linh-vuc">
  <div class="container">
    {section_head("Lĩnh vực hoạt động", "Dịch vụ trọn gói cho công trình giao thông", "10 ngành nghề kinh doanh chính theo Giấy chứng nhận đăng ký doanh nghiệp – từ giai đoạn chuẩn bị đầu tư đến thi công hoàn thiện.")}
    <div class="grid grid-3">{services}</div>
  </div>
</section>

<section class="section section-navy" id="gia-tri">
  <div class="container">
    {section_head("Phương châm hoạt động", C['slogan'], "Định hướng cho mọi hoạt động của Công ty Cổ phần An Sơn.")}
    <div class="values">{values}</div>
  </div>
</section>

<section class="section" id="du-an">
  <div class="container">
    {section_head("Dự án tiêu biểu", "Công trình đã và đang thực hiện", f"{total_contracts} hợp đồng với tổng giá trị hơn {bil(total_value)} tỷ đồng trong các lĩnh vực thiết kế, giám sát khảo sát, giám sát thi công và thi công xây dựng.")}
    <div class="grid grid-3">{projects}</div>
    <p class="text-center" style="margin-top:2.5rem"><a class="btn btn-outline" href="du-an.html">Xem tất cả dự án &amp; bảng kê hợp đồng {ico('arrow')}</a></p>
  </div>
</section>

<section class="section section-alt" id="giay-khen">
  <div class="container">
    {section_head("Ghi nhận", "Giấy khen &amp; chứng nhận", "Những ghi nhận từ cơ quan quản lý nhà nước và chủ đầu tư dành cho tập thể An Sơn.")}
    <div class="grid grid-3">{awards}</div>
    <p class="text-center" style="margin-top:2.5rem"><a class="btn btn-outline" href="nang-luc.html#phap-ly">Xem hồ sơ pháp lý &amp; chứng chỉ năng lực {ico('arrow')}</a></p>
  </div>
</section>

<section class="section" id="khach-hang">
  <div class="container">
    {section_head("Khách hàng &amp; đối tác", "Chủ đầu tư tiêu biểu đã tin tưởng An Sơn")}
    <div class="client-list reveal">{clients}</div>
  </div>
</section>
{news_section}
<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta reveal">
      <div><h2>Cần tư vấn cho dự án của bạn?</h2><p>Liên hệ với chúng tôi để nhận hồ sơ năng lực đầy đủ và trao đổi về giải pháp phù hợp.</p></div>
      <div class="actions">
        <a class="btn btn-primary" href="lien-he.html">{ico('send')} Liên hệ ngay</a>
        <a class="btn btn-outline-light" href="tel:{C['tel1_raw']}">{ico('phone')} {C['tel1']}</a>
      </div>
    </div>
  </div>
</section>
"""
    return (head("Trang chủ", "Công ty Cổ phần An Sơn (ANSON JSC) – hơn 18 năm kinh nghiệm tư vấn khảo sát, lập dự án, thiết kế, giám sát và thi công công trình giao thông (cầu, đường bộ) tại TP.HCM và các tỉnh phía Nam.", "index.html")
            + topbar() + header() + body + footer())

# ---------------- GIỚI THIỆU ----------------
def build_about():
    fields = "".join(f"<li>{esc(f)}</li>" for f in FIELDS)
    leaders = "".join(
        f'<article class="card leader-card reveal"><div class="avatar">{ini}</div><h3>{esc(n)}</h3><div class="role">{esc(r)}</div><p class="deg">{esc(d)}</p></article>'
        for n, r, d, ini in LEADERS)
    org_left = "".join(f'<div class="org-line"></div><div class="org-box dept">{esc(d)}</div>' for d in ORG_LEFT)
    org_right = "".join(f'<div class="org-line"></div><div class="org-box dept">{esc(d)}</div>' for d in ORG_RIGHT)

    depts = ""
    total_staff = 0
    for name, lead, people in DEPARTMENTS:
        total_staff += len(people)
        ctv = sum(1 for _, r in people if r == "Cộng tác viên")
        cnt_note = f"{len(people) - ctv} nhân sự + {ctv} CTV" if ctv else "nhân sự"
        lead_html = f'<p class="lead">{esc(lead)}</p>' if lead else ""
        rows = "".join(f"<li>{esc(n)} <span>– {esc(r)}</span></li>" for n, r in people)
        depts += f"""<article class="card dept-card reveal">
  <div class="dept-head"><h3>{esc(name)}</h3><div class="count">{len(people)}<small>{esc(cnt_note)}</small></div></div>
  {lead_html}
  <details class="staff"><summary>{ico('users')} Xem danh sách</summary><ol>{rows}</ol></details>
</article>"""

    body = page_hero("Giới thiệu công ty", "Hơn 18 năm xây dựng thương hiệu trong lĩnh vực tư vấn và thi công công trình giao thông.", "prj-tk-gtxanh-1.jpg", "Giới thiệu")
    body += subnav([("loi-mo-dau", "Lời mở đầu"), ("thong-tin", "Thông tin chung"), ("nganh-nghe", "Ngành nghề"), ("so-do", "Sơ đồ tổ chức"), ("lanh-dao", "Ban lãnh đạo"), ("nhan-su", "Nhân sự")])
    letter_intro = "".join(f"<p>{esc(p)}</p>" for p in LETTER["intro"])
    letter_outro = "".join(f"<p>{esc(p)}</p>" for p in LETTER["outro"])
    body += f"""
<section class="section" id="loi-mo-dau">
  <div class="container">
    {section_head("Lời mở đầu", "Thư ngỏ từ Ban Giám đốc", left=True)}
    <div class="letter">
      <div class="letter-body reveal">
        {letter_intro}
        <div class="quote">“{esc(C['slogan'])}”</div>
        {letter_outro}
        <div class="signature"><div class="role">{esc(LETTER['signer_role'])}</div><div class="name">{esc(LETTER['signer_name'])}</div></div>
      </div>
      <div class="letter-aside reveal">
        <img src="{IMG}prj-tc-tonducthang-1.jpg" alt="Thi công sửa chữa, mở rộng mặt cầu Tôn Đức Thắng" loading="lazy">
        <img src="{IMG}prj-tk-phuhuu-1.jpg" alt="Đường nối vào KCN Phú Hữu" loading="lazy">
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="thong-tin">
  <div class="container">
    {section_head("Hồ sơ doanh nghiệp", "Thông tin chung")}
    <div class="reveal">
    <table class="info-table">
      <tr><th>Tên công ty</th><td><strong>{esc(C['name'])}</strong></td></tr>
      <tr><th>Tên giao dịch</th><td>{esc(C['name_en'])}</td></tr>
      <tr><th>Tên viết tắt</th><td>{esc(C['short'])}</td></tr>
      <tr><th>Tổng Giám đốc</th><td>{esc(C['ceo'])} &nbsp;·&nbsp; ĐT: <a href="tel:{C['hotline_raw']}">{C['hotline']}</a></td></tr>
      <tr><th>Địa chỉ trụ sở chính</th><td>{esc(C['address'])}</td></tr>
      <tr><th>Điện thoại</th><td><a href="tel:{C['tel1_raw']}">{C['tel1']}</a> – <a href="tel:{C['tel2_raw']}">{C['tel2']}</a> &nbsp;·&nbsp; Fax: {C['fax']}</td></tr>
      <tr><th>E-mail</th><td><a href="mailto:{C['email']}">{C['email']}</a></td></tr>
      <tr><th>Website</th><td><a href="{C['url']}">{C['domain']}</a></td></tr>
      <tr><th>Vốn điều lệ</th><td>{esc(C['capital'])}</td></tr>
      <tr><th>Mã số thuế</th><td>{C['tax']}</td></tr>
      <tr><th>Giấy đăng ký kinh doanh</th><td>{esc(C['license'])}</td></tr>
    </table>
    </div>
  </div>
</section>

<section class="section" id="nganh-nghe">
  <div class="container">
    {section_head("Ngành nghề kinh doanh chính", f"{len(FIELDS)} lĩnh vực hoạt động theo đăng ký")}
    <ol class="field-list reveal">{fields}</ol>
  </div>
</section>

<section class="section section-alt" id="so-do">
  <div class="container">
    {section_head("Cơ cấu tổ chức", "Sơ đồ tổ chức hoạt động Công ty")}
    <div class="org reveal">
      <div class="org-box top">Hội đồng quản trị</div>
      <div class="org-line"></div>
      <div class="org-box lead">Tổng Giám đốc</div>
      <div class="org-branches">
        <div class="org-branch">
          <div class="org-branch-title">Khối trực thuộc Tổng Giám đốc</div>
          <div class="org-stack">{org_left[len('<div class="org-line"></div>'):]}<div class="org-line"></div><div class="org-box team">{esc(ORG_LEFT_TEAM)}</div></div>
        </div>
        <div class="org-branch">
          <div class="org-branch-title">Khối kỹ thuật</div>
          <div class="org-stack"><div class="org-box lead" style="width:100%;max-width:320px">Phó Tổng Giám đốc</div>{org_right}</div>
        </div>
      </div>
      <p class="org-note">Sơ đồ tổ chức theo Hồ sơ năng lực Công ty Cổ phần An Sơn.</p>
    </div>
  </div>
</section>

<section class="section" id="lanh-dao">
  <div class="container">
    {section_head("Ban lãnh đạo", "Đội ngũ điều hành")}
    <div class="grid grid-3">{leaders}</div>
  </div>
</section>

<section class="section section-alt" id="nhan-su">
  <div class="container">
    {section_head("Nguồn nhân lực", "Đội ngũ cán bộ, kỹ sư &amp; cộng tác viên", f"Tổng cộng {total_staff} cán bộ, kỹ sư, chuyên gia và cộng tác viên (thạc sĩ, tiến sĩ, kỹ sư cầu đường, kiến trúc sư, cử nhân) được tổ chức theo các phòng ban chuyên môn.")}
    <div class="grid grid-3">{depts}</div>
  </div>
</section>
"""
    return head("Giới thiệu", "Giới thiệu Công ty Cổ phần An Sơn: lời mở đầu, thông tin doanh nghiệp, ngành nghề kinh doanh, sơ đồ tổ chức, ban lãnh đạo và đội ngũ nhân sự.", "gioi-thieu.html", "prj-tk-gtxanh-1.jpg") + topbar() + header() + body + footer()

# ---------------- NĂNG LỰC ----------------
def build_capability():
    legal = "".join(
        f'<figure><a href="{img_url(f)}" data-lightbox="legal" data-caption="{esc(t)}"><img src="{img_url(f)}" alt="{esc(t)}" loading="lazy"><figcaption>{esc(t)}</figcaption></a></figure>'
        for f, t in LEGAL)
    awards = "".join(
        f'<article class="cert-card reveal"><a class="thumb" href="{img_url(f)}" data-lightbox="awards" data-caption="{esc(t)}"><img src="{img_url(f)}" alt="{esc(t)}" loading="lazy"></a><div class="body"><h3>{esc(t)}</h3><p>{esc(d)}</p></div></article>'
        for f, t, d in AWARDS)

    def equip_table(rows, title, icon):
        trs = "".join(f'<tr><td class="stt">{i+1}</td><td>{esc(n)}</td><td class="center">{esc(u)}</td><td class="num">{q}</td></tr>' for i, (n, u, q) in enumerate(rows))
        return f"""<div class="reveal"><h3 style="display:flex;align-items:center;gap:.6rem;margin:2rem 0 1rem">{ico(icon, 'ico')} {esc(title)} <span class="chip">{len(rows)} mục</span></h3>
<div class="table-wrap"><table class="data" style="min-width:520px"><thead><tr><th style="width:56px">STT</th><th>Tên thiết bị</th><th style="width:110px;text-align:center">Đơn vị</th><th style="width:110px;text-align:right">Số lượng</th></tr></thead><tbody>{trs}</tbody></table></div></div>"""

    fin_rows = ""
    for label, vals in FINANCE:
        fin_rows += f'<tr><td class="owner">{esc(label)}</td>' + "".join(f'<td class="num">{money(v)}</td>' for v in vals) + "</tr>"

    def fin_row(keyword, idx):
        """Tìm dòng tài chính theo từ khoá trong nhãn; nếu không có thì theo vị trí; nếu vẫn không có thì toàn 0."""
        for label, vals in FINANCE:
            if keyword in label.lower():
                return vals
        return FINANCE[idx][1] if idx < len(FINANCE) else [0] * len(FIN_YEARS)
    rev = fin_row("doanh thu", 3)
    profit = fin_row("lợi nhuận", 4)
    assets = fin_row("tổng tài sản", 0)
    fin_cards = "".join(
        f'<div class="fin-card reveal"><div class="yr">Năm {y}</div><div class="rev">{bil(r)} tỷ</div><div class="lbl">Tổng doanh thu</div><div class="lbl" style="margin-top:.6rem">Lợi nhuận sau thuế: <strong>{money(p)} đ</strong><br>Tổng tài sản: <strong>{bil(a)} tỷ</strong></div></div>'
        for y, r, p, a in zip(FIN_YEARS, rev, profit, assets))
    bars = "".join(
        f'<div class="bar"><div class="fill" data-value="{r}" style="height:6%"><span>{bil(r)} tỷ</span></div><div class="yr">{y}</div></div>'
        for y, r in zip(FIN_YEARS, rev))
    years_text = ", ".join(FIN_YEARS)

    body = page_hero("Hồ sơ năng lực", "Hồ sơ pháp lý, chứng chỉ năng lực hoạt động xây dựng, giấy khen, máy móc thiết bị và năng lực tài chính.", "prj-tc-somuoi-1.jpg", "Năng lực")
    body += subnav([("phap-ly", "Hồ sơ pháp lý"), ("giay-khen", "Giấy khen"), ("thiet-bi", "Máy móc thiết bị"), ("tai-chinh", "Năng lực tài chính"), ("tai-ve", "Tải hồ sơ")])
    body += f"""
<section class="section" id="phap-ly">
  <div class="container">
    {section_head("Hồ sơ pháp lý", "Giấy chứng nhận ĐKDN &amp; Chứng chỉ năng lực hoạt động xây dựng", "Nhấn vào từng hình để xem chi tiết.")}
    <div class="gallery reveal">{legal}</div>
  </div>
</section>

<section class="section section-alt" id="giay-khen">
  <div class="container">
    {section_head("Ghi nhận", "Giấy khen của cơ quan quản lý nhà nước")}
    <div class="grid grid-3">{awards}</div>
  </div>
</section>

<section class="section" id="thiet-bi">
  <div class="container">
    {section_head("Năng lực thiết bị", "Danh mục máy móc thiết bị, phần mềm", "Thiết bị văn phòng, phần mềm chuyên ngành và máy móc thi công công trình phục vụ khảo sát, thiết kế, giám sát và thi công.")}
    {equip_table(EQUIP_OFFICE, "Máy móc thiết bị văn phòng", "briefcase")}
    {equip_table(EQUIP_SOFTWARE, "Phần mềm ứng dụng", "layers")}
    {equip_table(EQUIP_SITE, "Máy móc thiết bị thi công công trình", "tools")}
  </div>
</section>

<section class="section section-alt" id="tai-chinh">
  <div class="container">
    {section_head("Năng lực tài chính", f"Số liệu tài chính {len(FIN_YEARS)} năm gần nhất", f"Đơn vị: VNĐ – theo Bảng cân đối kế toán và Báo cáo kết quả kinh doanh các năm {years_text}.")}
    <div class="fin-cards">{fin_cards}</div>
    <div class="table-wrap reveal"><table class="data"><thead><tr><th>Chỉ tiêu</th>{"".join(f'<th style="text-align:right">Năm {y}</th>' for y in FIN_YEARS)}</tr></thead><tbody>{fin_rows}</tbody></table></div>
    <div class="card reveal" style="margin-top:2rem"><h3 style="text-align:center">Tổng doanh thu theo năm</h3><div class="bars">{bars}</div></div>
  </div>
</section>

<section class="section" id="tai-ve">
  <div class="container">
    <div class="download-box reveal">
      <div class="icon-box">{ico('doc')}</div>
      <div><h3>Hồ sơ năng lực Công ty Cổ phần An Sơn (bản đầy đủ)</h3><p>Định dạng PDF · 40 trang · Cập nhật năm 2026. Bao gồm bảng kê hợp đồng, hình ảnh công trình và các hồ sơ pháp lý.</p></div>
      <a class="btn btn-primary" href="{C['pdf']}" target="_blank" rel="noopener">{ico('download')} Tải PDF</a>
    </div>
  </div>
</section>
"""
    return head("Hồ sơ năng lực", "Hồ sơ pháp lý, chứng chỉ năng lực hoạt động xây dựng, giấy khen, danh mục máy móc thiết bị và năng lực tài chính của Công ty Cổ phần An Sơn.", "nang-luc.html", "prj-tc-somuoi-1.jpg") + topbar() + header() + body + footer()

# ---------------- DỰ ÁN ----------------
def build_projects():
    tabs = ""
    panels = ""
    grand_n = 0
    grand_v = 0
    for i, (gid, title, short, rows) in enumerate(CONTRACT_GROUPS):
        total = sum(r[2] for r in rows)
        grand_n += len(rows); grand_v += total
        tabs += f'<button class="tab-btn{" active" if i == 0 else ""}" data-tab="hd-{gid}">{esc(short)} <span class="cnt">{len(rows)}</span></button>'
        trs = "".join(
            f'<tr><td class="stt">{j+1}</td><td class="owner">{esc(o)}</td><td class="desc">{esc(d)}</td><td class="num">{money(v)}</td><td class="center"><span class="chip">{esc(g)}</span></td></tr>'
            for j, (o, d, v, g) in enumerate(rows))
        big = max(rows, key=lambda r: r[2], default=(None, None, 0, None))
        panels += f"""<div class="tab-panel{" active" if i == 0 else ""}" id="hd-{gid}">
  <div class="tab-summary">
    <div class="card"><div class="icon-box" style="margin:0">{ico('briefcase')}</div><div><div class="v">{len(rows)}</div><div class="l">hợp đồng</div></div></div>
    <div class="card"><div class="icon-box" style="margin:0">{ico('chart')}</div><div><div class="v">{bil(total)} tỷ</div><div class="l">tổng giá trị (VNĐ)</div></div></div>
    <div class="card"><div class="icon-box" style="margin:0">{ico('star')}</div><div><div class="v">{bil(big[2])} tỷ</div><div class="l">hợp đồng lớn nhất</div></div></div>
  </div>
  <h3 style="margin-bottom:1rem">{esc(title)}</h3>
  <div class="table-wrap"><table class="data"><thead><tr><th style="width:56px">STT</th><th>Chủ đầu tư</th><th>Nội dung hợp đồng</th><th style="text-align:right">Giá trị HĐ + PLHĐ (VNĐ)</th><th style="text-align:center">Cấp CT</th></tr></thead>
  <tbody>{trs}</tbody>
  <tfoot><tr><td colspan="3">Tổng cộng ({len(rows)} hợp đồng)</td><td class="num">{money(total)}</td><td></td></tr></tfoot></table></div>
</div>"""

    features = ""
    for pid, group, name, owner, grade, specs, imgs in PROJECTS:
        media = "".join(
            f'<a href="{img_url(im)}" data-lightbox="prj-{pid}" data-caption="{esc(name)}"><img src="{img_url(im)}" alt="{esc(name)} – ảnh {k+1}" loading="lazy"></a>'
            for k, im in enumerate(imgs))
        spec = "".join(f"<li>{esc(s)}</li>" for s in specs)
        features += f"""<article class="feature reveal" id="prj-{pid}">
  <div class="feature-media{' single' if len(imgs) <= 1 else ''}">{media}</div>
  <div class="feature-body">
    <span class="badge static {group_chip(group)}">{esc(group)}</span>
    <h3>{esc(name)}</h3>
    <p class="owner">Chủ đầu tư: <strong>{esc(owner)}</strong></p>
    <ul class="spec-list">{spec}</ul>
    <div class="feature-tags"><span class="chip accent">Công trình {esc(grade.lower())}</span></div>
  </div>
</article>"""

    body = page_hero("Dự án &amp; hợp đồng tiêu biểu", f"{grand_n} hợp đồng đã và đang thực hiện với tổng giá trị hơn {bil(grand_v)} tỷ đồng, cùng hình ảnh các công trình tiêu biểu.", "prj-tk-bdtn-1.jpg", "Dự án")
    body += subnav([("hop-dong", "Bảng kê hợp đồng"), ("tieu-bieu", "Công trình tiêu biểu")])
    body += f"""
<section class="section" id="hop-dong">
  <div class="container">
    {section_head("Kinh nghiệm", "Bảng kê hợp đồng đã và đang thực hiện", "Phân theo 4 lĩnh vực: tư vấn thiết kế, giám sát khảo sát, giám sát thi công và thi công xây dựng.")}
    <div data-tabs class="reveal">
      <div class="tabs">{tabs}</div>
      {panels}
    </div>
    <p class="table-note">Giá trị hợp đồng bao gồm phụ lục hợp đồng (PLHĐ). Cấp công trình theo phân cấp tại thời điểm ký hợp đồng.</p>
  </div>
</section>

<section class="section section-alt" id="tieu-bieu">
  <div class="container">
    {section_head("Hình ảnh", "Một số công trình tiêu biểu", "Nhấn vào hình để xem kích thước lớn.")}
    {features}
  </div>
</section>
"""
    return head("Dự án tiêu biểu", "Bảng kê hợp đồng tư vấn thiết kế, giám sát khảo sát, giám sát thi công, thi công xây dựng và hình ảnh các công trình cầu đường tiêu biểu của Công ty Cổ phần An Sơn.", "du-an.html", "prj-tk-bdtn-1.jpg") + topbar() + header() + body + footer()

# ---------------- LIÊN HỆ ----------------
def build_contact():
    from urllib.parse import quote
    q = quote(C["map_query"])
    body = page_hero("Liên hệ", "Hãy liên hệ với chúng tôi để được tư vấn và nhận hồ sơ năng lực đầy đủ.", "prj-gs-xlhn-2.jpg", "Liên hệ")
    body += f"""
<section class="section">
  <div class="container contact-grid">
    <div class="reveal">
      <span class="eyebrow">Thông tin liên hệ</span>
      <h2>{esc(C['name_title'])}</h2>
      <p class="muted">{esc(C['name_en'])} · {esc(C['short'])}</p>
      <div class="contact-cards" style="margin-top:1.5rem">
        <div class="card contact-card"><div class="icon-box">{ico('pin')}</div><div><h3>Trụ sở chính</h3><p>{esc(C['address'])}</p></div></div>
        <div class="card contact-card"><div class="icon-box">{ico('phone')}</div><div><h3>Điện thoại</h3><p><a href="tel:{C['tel1_raw']}">{C['tel1']}</a> – <a href="tel:{C['tel2_raw']}">{C['tel2']}</a><br>Hotline: <a href="tel:{C['hotline_raw']}">{C['hotline']}</a> (Tổng Giám đốc)</p></div></div>
        <div class="card contact-card"><div class="icon-box">{ico('fax')}</div><div><h3>Fax</h3><p>{C['fax']}</p></div></div>
        <div class="card contact-card"><div class="icon-box">{ico('mail')}</div><div><h3>E-mail</h3><p><a href="mailto:{C['email']}">{C['email']}</a></p></div></div>
        <div class="card contact-card"><div class="icon-box">{ico('clock')}</div><div><h3>Giờ làm việc</h3><p>Thứ Hai – Thứ Sáu: 8:00 – 17:00<br>Thứ Bảy: 8:00 – 12:00</p></div></div>
      </div>
    </div>
    <div class="reveal">
      <div class="card">
        <h3>Gửi yêu cầu tư vấn</h3>
        <p class="muted small">Điền thông tin bên dưới, hệ thống sẽ mở ứng dụng email của bạn với nội dung đã soạn sẵn gửi tới {C['email']}.</p>
        <form class="form" id="contact-form" data-email="{C['email']}">
          <div class="form-row">
            <label>Họ và tên *<input type="text" name="name" required placeholder="Nguyễn Văn A"></label>
            <label>Đơn vị<input type="text" name="company" placeholder="Ban QLDA / Công ty"></label>
          </div>
          <div class="form-row">
            <label>Điện thoại *<input type="tel" name="phone" required placeholder="09xx xxx xxx"></label>
            <label>E-mail<input type="email" name="email" placeholder="email@domain.com"></label>
          </div>
          <label>Nhu cầu
            <select name="topic">
              <option>Tư vấn khảo sát – thiết kế</option>
              <option>Tư vấn lập dự án đầu tư / thẩm tra</option>
              <option>Tư vấn giám sát</option>
              <option>Thi công xây dựng</option>
              <option>Hợp tác – Khác</option>
            </select>
          </label>
          <label>Nội dung *<textarea name="message" required placeholder="Mô tả ngắn về dự án hoặc yêu cầu của bạn..."></textarea></label>
          <button class="btn btn-primary" type="submit">{ico('send')} Gửi yêu cầu</button>
        </form>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" style="padding-top:0">
  <div class="container">
    <div class="map-wrap reveal">
      <iframe title="Bản đồ trụ sở Công ty Cổ phần An Sơn" src="https://www.google.com/maps?q={q}&amp;output=embed&amp;hl=vi&amp;z=16" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
  </div>
</section>
"""
    return head("Liên hệ", f"Liên hệ Công ty Cổ phần An Sơn – {C['address']}. Điện thoại {C['tel1']} – {C['tel2']}. Email {C['email']}.", "lien-he.html", "prj-gs-xlhn-2.jpg") + topbar() + header() + body + footer()

# ---------------- PHỤ TRỢ ----------------
def build_404():
    body = f"""
<section class="section" style="min-height:60vh;display:grid;place-items:center">
  <div class="container text-center">
    <span class="eyebrow" style="justify-content:center">Lỗi 404</span>
    <h1>Không tìm thấy trang</h1>
    <p class="muted">Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p>
    <a class="btn btn-navy" href="index.html">Về trang chủ {ico('arrow')}</a>
  </div>
</section>
"""
    return head("Không tìm thấy trang", "Trang không tồn tại.", "404.html") + topbar() + header() + body + footer()

def build_sitemap(posts=()):
    urls = "".join(f"  <url><loc>{C['url']}/{'' if h == 'index.html' else h}</loc><changefreq>monthly</changefreq><priority>{'1.0' if h == 'index.html' else '0.8'}</priority></url>\n" for h, _ in NAV)
    urls += "".join(f"  <url><loc>{C['url']}/{p['url']}</loc><lastmod>{esc(p['date'][:10])}</lastmod><changefreq>yearly</changefreq><priority>0.6</priority></url>\n" for p in posts)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n'

def write(name, content):
    p = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("wrote", name, len(content))

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    posts = load_posts()
    write("index.html", build_index(posts))
    write("gioi-thieu.html", build_about())
    write("nang-luc.html", build_capability())
    write("du-an.html", build_projects())
    write("tin-tuc.html", build_news(posts))
    # Xoá trang bài viết cũ rồi sinh lại toàn bộ (bài đã xoá trong content/ sẽ biến mất)
    shutil.rmtree(os.path.join(OUT, POST_URL_DIR), ignore_errors=True)
    for p in posts:
        write(p["url"], build_post(p, posts))
    write("lien-he.html", build_contact())
    write("404.html", build_404())
    write("sitemap.xml", build_sitemap(posts))
    write("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /content/\nDisallow: /tools/\nSitemap: {C['url']}/sitemap.xml\n")
    print("posts:", len(posts), "(drafts:", len(load_posts(True)) - len(posts), ")")
    # Thống kê kiểm tra
    n = sum(len(g[3]) for g in CONTRACT_GROUPS)
    v = sum(r[2] for g in CONTRACT_GROUPS for r in g[3])
    print("contracts:", n, "total:", money(v))
    for gid, t, s, rows in CONTRACT_GROUPS:
        print(" ", gid, len(rows), money(sum(r[2] for r in rows)))
    print("staff:", sum(len(d[2]) for d in DEPARTMENTS))

# -*- coding: utf-8 -*-
"""Dữ liệu nội dung website ANSON JSC.

Toàn bộ nội dung có thể chỉnh sửa nằm trong content/site.json (sửa bằng trang quản trị /admin/
hoặc trực tiếp trên GitHub). Tệp này chỉ đọc JSON và chuyển sang các biến mà build_site.py sử dụng.
"""
import json, os, re, unicodedata

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_JSON = os.environ.get("SITE_JSON") or os.path.join(ROOT_DIR, "content", "site.json")

with open(SITE_JSON, encoding="utf-8") as _f:
    DATA = json.load(_f)


# ---------------- tiện ích ----------------
def _s(v, default=""):
    return default if v is None else str(v).strip()


def _int(v, default=0):
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (int, float)):
        return int(v)
    digits = re.sub(r"[^\d-]", "", _s(v))
    try:
        return int(digits)
    except ValueError:
        return default


def _lines(v):
    """Danh sách chuỗi: chấp nhận list hoặc chuỗi nhiều dòng; bỏ dòng trống."""
    if isinstance(v, str):
        v = v.splitlines()
    return [_s(x) for x in (v or []) if _s(x)]


def _digits(v):
    return re.sub(r"\D", "", _s(v))


def slugify(text):
    text = unicodedata.normalize("NFD", _s(text)).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "muc"


def _initials(name):
    words = [w for w in re.split(r"\s+", _s(name)) if w and not w.endswith(".")]
    if not words:
        return "AS"
    return (words[0][0] + (words[-1][0] if len(words) > 1 else "")).upper()


def _unique_ids(items, key="id", fallback="title"):
    seen = set()
    for it in items:
        base = slugify(it.get(key) or it.get(fallback) or "muc")
        iid, n = base, 2
        while iid in seen:
            iid = f"{base}-{n}"
            n += 1
        seen.add(iid)
        it[key] = iid
    return items


# ---------------- công ty ----------------
_c = DATA.get("company", {})
COMPANY = {k: _s(v) for k, v in _c.items()}
COMPANY.setdefault("name", "CÔNG TY CỔ PHẦN AN SƠN")
COMPANY.setdefault("name_title", "Công ty Cổ phần An Sơn")
COMPANY.setdefault("short", "ANSON JSC")
COMPANY.setdefault("domain", "ansonjsc.com.vn")
COMPANY.setdefault("url", "https://" + COMPANY["domain"])
COMPANY.setdefault("address_short", COMPANY.get("address", ""))
COMPANY.setdefault("map_query", COMPANY.get("address", ""))
COMPANY.setdefault("pdf", "assets/docs/ho-so-nang-luc-anson-2026.pdf")
for _k in ("tel1", "tel2", "hotline"):
    COMPANY.setdefault(_k, "")
    COMPANY[_k + "_raw"] = _digits(COMPANY[_k])
COMPANY.setdefault("fax", "")
COMPANY.setdefault("email", "")
COMPANY.setdefault("slogan", "")
COMPANY.setdefault("ceo", "")
COMPANY.setdefault("capital", "")
COMPANY.setdefault("tax", "")
COMPANY.setdefault("license", "")
COMPANY.setdefault("founded", "")

NAV = [
    ("index.html", "Trang chủ"),
    ("gioi-thieu.html", "Giới thiệu"),
    ("nang-luc.html", "Năng lực"),
    ("du-an.html", "Dự án"),
    ("tin-tuc.html", "Tin tức"),
    ("lien-he.html", "Liên hệ"),
]

# ---------------- thư ngỏ ----------------
_l = DATA.get("letter", {})
LETTER = {
    "intro": _lines(_l.get("intro")),
    "outro": _lines(_l.get("outro")),
    "signer_role": _s(_l.get("signer_role"), "Tổng Giám đốc"),
    "signer_name": _s(_l.get("signer_name"), COMPANY.get("ceo", "")),
}

# ---------------- trang chủ ----------------
FIELDS = _lines(DATA.get("fields"))
SERVICES = [(_s(x.get("icon"), "check"), _s(x.get("title")), _s(x.get("desc"))) for x in DATA.get("services", []) if _s(x.get("title"))]
VALUES = [(_s(x.get("icon"), "check"), _s(x.get("title")), _s(x.get("desc"))) for x in DATA.get("values", []) if _s(x.get("title"))]
STATS = [(_int(x.get("value")), _s(x.get("suffix")), _s(x.get("label"))) for x in DATA.get("stats", []) if _s(x.get("label"))]

# ---------------- nhân sự ----------------
LEADERS = [(_s(x.get("name")), _s(x.get("role")), _s(x.get("degree")), _initials(x.get("name"))) for x in DATA.get("leaders", []) if _s(x.get("name"))]
DEPARTMENTS = [
    (_s(x.get("name")), _s(x.get("head")), [(_s(p.get("name")), _s(p.get("title"))) for p in x.get("staff", []) if _s(p.get("name"))])
    for x in DATA.get("departments", []) if _s(x.get("name"))
]
_o = DATA.get("org", {})
ORG_LEFT = _lines(_o.get("left"))
ORG_LEFT_TEAM = _s(_o.get("left_team"), "Đội thi công")
ORG_RIGHT = _lines(_o.get("right"))

# ---------------- thiết bị ----------------
def _equip(rows):
    return [(_s(r.get("name")), _s(r.get("unit"), "Cái"), _int(r.get("qty"), 1)) for r in rows or [] if _s(r.get("name"))]

_e = DATA.get("equipment", {})
EQUIP_OFFICE = _equip(_e.get("office"))
EQUIP_SOFTWARE = _equip(_e.get("software"))
EQUIP_SITE = _equip(_e.get("site"))

# ---------------- tài chính ----------------
_fin = DATA.get("finance", {})
FIN_YEARS = _lines(_fin.get("years"))
FINANCE = []
for _r in _fin.get("rows", []):
    if not _s(_r.get("label")):
        continue
    _vals = [_int(v) for v in (_r.get("values") or [])]
    _vals = (_vals + [0] * len(FIN_YEARS))[:len(FIN_YEARS)]   # luôn đủ số cột theo số năm
    FINANCE.append((_s(_r.get("label")), _vals))

# ---------------- hợp đồng ----------------
CONTRACT_GROUPS = []
for _g in _unique_ids([dict(g) for g in DATA.get("contracts", []) if _s(g.get("short") or g.get("title"))], fallback="short"):
    _rows = [(_s(r.get("client")), _s(r.get("scope")), _int(r.get("value")), _s(r.get("grade")))
             for r in _g.get("items", []) if _s(r.get("client")) or _s(r.get("scope"))]
    CONTRACT_GROUPS.append((_g["id"], _s(_g.get("title")) or _s(_g.get("short")), _s(_g.get("short")) or _s(_g.get("title")), _rows))
CONTRACTS_A, CONTRACTS_B, CONTRACTS_C, CONTRACTS_D = (list(CONTRACT_GROUPS[i][3]) if i < len(CONTRACT_GROUPS) else [] for i in range(4))

# ---------------- dự án tiêu biểu ----------------
_projects = _unique_ids([dict(p) for p in DATA.get("projects", []) if _s(p.get("title"))])
PROJECTS = [
    (p["id"], _s(p.get("group"), "Thiết kế"), _s(p.get("title")), _s(p.get("client")), _s(p.get("grade")),
     _lines(p.get("specs")), _lines(p.get("images")))
    for p in _projects
]
# Thứ tự hiện ở trang chủ: trường "home" là số thứ tự (0 / trống = không hiện)
HOME_PROJECT_IDS = [p["id"] for p in sorted((p for p in _projects if _int(p.get("home")) > 0), key=lambda p: _int(p.get("home")))]

# ---------------- giấy khen, pháp lý, khách hàng ----------------
AWARDS = [(_s(x.get("image")), _s(x.get("title")), _s(x.get("desc"))) for x in DATA.get("awards", []) if _s(x.get("title"))]
LEGAL = [(_s(x.get("image")), _s(x.get("title"))) for x in DATA.get("legal", []) if _s(x.get("title"))]
CLIENTS = _lines(DATA.get("clients"))

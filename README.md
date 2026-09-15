# Website CÔNG TY CỔ PHẦN AN SƠN — ansonjsc.com.vn

Website tĩnh (HTML/CSS/JS thuần, không cần máy chủ ứng dụng hay cơ sở dữ liệu) giới thiệu **hồ sơ năng lực** của Công ty Cổ phần An Sơn, xây dựng từ tài liệu *"HS NL TONG – AS 07 2026"*.

## 1. Cấu trúc thư mục

```
ansonjsc-website/
├── index.html          Trang chủ (lĩnh vực, số liệu, dự án tiêu biểu, giấy khen)
├── gioi-thieu.html     Thư ngỏ, thông tin pháp nhân, ngành nghề, sơ đồ tổ chức, lãnh đạo, nhân sự (51 người)
├── nang-luc.html       Hồ sơ pháp lý (6 chứng chỉ), giấy khen (3), thiết bị (6 + 4 + 22), tài chính 2023–2025, 45 hợp đồng
├── du-an.html          11 công trình tiêu biểu kèm hình ảnh (thiết kế / giám sát / thi công)
├── lien-he.html        Địa chỉ mới, điện thoại, e-mail, bản đồ Google, biểu mẫu liên hệ
├── 404.html            Trang báo lỗi không tìm thấy
├── sitemap.xml, robots.txt
├── assets/
│   ├── css/style.css   Toàn bộ giao diện (đáp ứng di động, in ấn)
│   ├── js/main.js      Menu di động, tab, lightbox ảnh, bộ đếm số liệu, biểu mẫu liên hệ
│   ├── img/            Logo, favicon, ảnh chứng chỉ (legal-*.jpg), giấy khen (award-*.jpg), ảnh dự án (prj-*.jpg)
│   └── docs/ho-so-nang-luc-anson-2026.pdf   Bản PDF đầy đủ để tải về
└── tools/
    ├── site_data.py    TOÀN BỘ NỘI DUNG (thông tin công ty, nhân sự, thiết bị, hợp đồng, dự án…)
    └── build_site.py   Script sinh lại các file .html từ site_data.py
```

## 2. Bộ nhận diện (logo)

Logo được vẽ lại dạng vector từ mẫu trong hồ sơ năng lực (chữ **A** tam giác xanh navy `#0a3d91` với dải cong cam `#f5a623`):

| Tệp | Dùng cho |
|---|---|
| `assets/img/logo-mark.svg` / `.png` | Biểu tượng chính trên nền sáng |
| `assets/img/logo-mark-white.svg` / `.png` | Biểu tượng trên nền tối (footer, banner) |
| `assets/img/logo-horizontal.png`, `logo-horizontal-white.png` | Logo ngang có chữ AN SƠN |
| `assets/img/logo-stacked.png`, `logo-stacked-white-bg.png` | Logo dọc (danh thiếp, bìa hồ sơ, avatar) |
| `assets/img/favicon.ico`, `favicon-32/192/512.png` | Biểu tượng trình duyệt / màn hình điện thoại |

## 3. Xem thử trên máy

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy máy chủ tạm (khuyến nghị để bản đồ và phông chữ hoạt động đúng):

```powershell
cd ansonjsc-website
python -m http.server 8080
# mở http://localhost:8080
```

## 4. Cập nhật nội dung

Tất cả số liệu nằm trong `tools/site_data.py` (mã hoá UTF-8). Sau khi sửa, chạy:

```powershell
python tools\build_site.py
```

Script sẽ ghi đè 5 trang, `404.html`, `sitemap.xml`, `robots.txt`. **Không sửa trực tiếp các file .html** vì lần chạy sau sẽ mất thay đổi.

Các mục thường cần cập nhật:

| Cần sửa | Biến trong `site_data.py` |
|---|---|
| Địa chỉ, điện thoại, e-mail, mã số thuế, vốn điều lệ | `COMPANY` |
| Ban lãnh đạo | `LEADERS` |
| Phòng ban & danh sách nhân sự | `DEPARTMENTS` |
| Thiết bị, phần mềm | `EQUIP_OFFICE`, `EQUIP_SOFTWARE`, `EQUIP_SITE` |
| Số liệu tài chính theo năm | `FIN_YEARS`, `FINANCE` |
| Hợp đồng theo nhóm (thiết kế / giám sát / giám sát–thi công / thi công) | `CONTRACTS_A` … `CONTRACTS_D` |
| Dự án tiêu biểu (tiêu đề, chủ đầu tư, mô tả, ảnh) | `PROJECTS`, `HOME_PROJECT_IDS` |
| Giấy khen, hồ sơ pháp lý | `AWARDS`, `LEGAL` |

Thêm ảnh dự án: chép ảnh JPG vào `assets/img/` (nên ≤ 1600 px, ≤ 400 KB) rồi khai báo tên tệp trong `PROJECTS`.

Thay PDF hồ sơ năng lực: ghi đè `assets/docs/ho-so-nang-luc-anson-2026.pdf` (hoặc đổi tên và sửa `COMPANY["pdf"]`).

## 5. Đưa lên tên miền ansonjsc.com.vn

Website chỉ gồm file tĩnh nên chạy được trên mọi hosting:

1. **Hosting cPanel / DirectAdmin (phổ biến tại Việt Nam):** tải toàn bộ nội dung thư mục (trừ `tools/`) vào `public_html/`. Bật SSL (Let's Encrypt) trong hosting để dùng `https://`.
2. **GitHub Pages / Cloudflare Pages / Netlify (miễn phí):** đẩy thư mục lên kho Git, trỏ tên miền tuỳ chỉnh `ansonjsc.com.vn` và `www.ansonjsc.com.vn` theo hướng dẫn của dịch vụ.
3. Tại nhà đăng ký tên miền `.com.vn`, cập nhật bản ghi DNS: `A`/`CNAME` trỏ về hosting; sau đó kiểm tra `https://ansonjsc.com.vn/sitemap.xml` và khai báo với Google Search Console.

## 6. Ghi chú quan trọng

- **Địa chỉ đã được cập nhật** trên toàn website thành *448/1 đường 448, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh*. Tuy nhiên file PDF hồ sơ năng lực gốc (`assets/docs/`) vẫn in địa chỉ cũ (460 Lê Văn Việt) — nên thay bằng bản PDF đã chỉnh sửa khi có.
- Bản đồ dùng Google Maps nhúng theo địa chỉ (không cần API key). Nếu muốn ghim chính xác, lấy liên kết "Nhúng bản đồ" từ Google Maps và thay vào `build_contact()` trong `tools/build_site.py`.
- Biểu mẫu liên hệ **không có máy chủ xử lý**: khi bấm gửi, trình duyệt mở ứng dụng e-mail với nội dung điền sẵn tới `congtycpanson@gmail.com`. Nếu cần nhận trực tiếp qua web, có thể tích hợp dịch vụ như Formspree/Getform bằng cách đổi thuộc tính `action` của form.
- Bảng hợp đồng nhóm *Tư vấn giám sát* trong PDF có 3 dòng trùng lặp (cùng một hợp đồng liệt kê nhiều lần); website đã gộp lại còn 11 dòng, tổng 4 nhóm = 45 hợp đồng, giá trị 127.475.674.003 đ.
- Phông chữ *Be Vietnam Pro* tải từ Google Fonts; nếu hosting cần hoạt động ngoại tuyến hoàn toàn, tải phông về `assets/fonts/` và sửa `@font-face` trong `style.css`.
- Số hotline 0903 600 205 lấy theo hồ sơ năng lực (số của Tổng Giám đốc); có thể đổi trong `COMPANY`.

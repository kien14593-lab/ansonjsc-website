# Website CÔNG TY CỔ PHẦN AN SƠN — ansonjsc.com.vn

Website tĩnh (HTML/CSS/JS thuần, không cần máy chủ ứng dụng hay cơ sở dữ liệu) giới thiệu **hồ sơ năng lực** của Công ty Cổ phần An Sơn, xây dựng từ tài liệu *"HS NL TONG – AS 07 2026"*.

## 1. Cấu trúc thư mục

```
ansonjsc-website/
├── index.html          Trang chủ (lĩnh vực, số liệu, dự án tiêu biểu, giấy khen, tin mới)
├── gioi-thieu.html     Thư ngỏ, thông tin pháp nhân, ngành nghề, sơ đồ tổ chức, lãnh đạo, nhân sự (51 người)
├── nang-luc.html       Hồ sơ pháp lý (6 chứng chỉ), giấy khen (3), thiết bị (6 + 4 + 22), tài chính 2023–2025, 45 hợp đồng
├── du-an.html          11 công trình tiêu biểu kèm hình ảnh (thiết kế / giám sát / thi công)
├── tin-tuc.html        Danh sách bài viết (lọc theo danh mục)
├── tin-tuc/<slug>.html Trang từng bài viết (sinh tự động từ content/posts)
├── lien-he.html        Địa chỉ mới, điện thoại, e-mail, bản đồ Google, biểu mẫu liên hệ
├── 404.html            Trang báo lỗi không tìm thấy
├── sitemap.xml, robots.txt
├── content/site.json   TOÀN BỘ NỘI DUNG các trang (thông tin công ty, nhân sự, thiết bị, hợp đồng, dự án…) – sửa qua trang quản trị
├── content/posts/      Bài viết dạng Markdown (mỗi bài một tệp .md) – do trang quản trị tạo
├── admin/              Trang quản trị: đăng bài / sửa bài (admin.js) và sửa nội dung trang (content.js); config.js, auth.json
├── .github/workflows/deploy.yml   Tự động sinh lại website & đưa lên GitHub Pages sau mỗi thay đổi
├── assets/
│   ├── css/style.css   Toàn bộ giao diện (đáp ứng di động, in ấn)
│   ├── js/main.js      Menu di động, tab, lightbox ảnh, bộ đếm số liệu, biểu mẫu liên hệ
│   ├── img/            Logo, favicon, ảnh chứng chỉ (legal-*.jpg), giấy khen (award-*.jpg), ảnh dự án (prj-*.jpg)
│   ├── uploads/        Ảnh do trang quản trị tải lên (theo năm)
│   └── docs/ho-so-nang-luc-anson-2026.pdf   Bản PDF đầy đủ để tải về
└── tools/
    ├── site_data.py    Đọc content/site.json và chuẩn hoá dữ liệu cho script sinh trang
    └── build_site.py   Script sinh lại các file .html từ content/site.json + content/posts
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

**Cách dễ nhất:** dùng trang quản trị → mục **Nội dung trang** (xem §5.3). Mọi thứ hiển thị trên Trang chủ, Giới thiệu, Năng lực, Dự án, Liên hệ đều sửa được bằng biểu mẫu, không cần biết lập trình.

Toàn bộ dữ liệu nằm trong một tệp duy nhất `content/site.json` (mã hoá UTF-8). Người quen kỹ thuật có thể sửa trực tiếp tệp này (trên GitHub hoặc trên máy) rồi chạy:

```powershell
pip install markdown        # chỉ cần lần đầu
python tools\build_site.py
```

Script sẽ ghi đè các trang, `tin-tuc/*.html`, `404.html`, `sitemap.xml`, `robots.txt`. **Không sửa trực tiếp các file .html** vì lần chạy sau sẽ mất thay đổi. Khi đã đưa lên GitHub, không cần chạy tay: mỗi lần đẩy thay đổi lên nhánh `main`, workflow `.github/workflows/deploy.yml` tự sinh lại website và xuất bản (1–2 phút).

Các mục trong `content/site.json` (trùng với các mục ở trang quản trị):

| Cần sửa | Mục trong `site.json` | Hiển thị ở |
|---|---|---|
| Địa chỉ, điện thoại, e-mail, mã số thuế, vốn điều lệ, tệp PDF | `company` | Đầu/chân trang, Giới thiệu, Liên hệ |
| Thư ngỏ, ngành nghề, sơ đồ tổ chức | `letter`, `fields`, `org` | Giới thiệu |
| Ban lãnh đạo; phòng ban & danh sách nhân sự | `leaders`, `departments` | Giới thiệu |
| Số liệu nổi bật, nhóm dịch vụ, giá trị cốt lõi, khách hàng | `stats`, `services`, `values`, `clients` | Trang chủ |
| Hồ sơ pháp lý, giấy khen | `legal`, `awards` | Năng lực (giấy khen còn ở Trang chủ) |
| Thiết bị, phần mềm; số liệu tài chính theo năm | `equipment`, `finance` | Năng lực |
| Hợp đồng theo nhóm (mỗi nhóm một tab) | `contracts` | Dự án |
| Công trình tiêu biểu (ảnh, thông số, thứ tự trang chủ `home`) | `projects` | Dự án, Trang chủ |

Ảnh: ghi tên tệp trong `assets/img/` (vd. `prj-tk-phuhuu-1.jpg`) hoặc đường dẫn đầy đủ trong kho (vd. `assets/uploads/2026/anh.jpg`). Ảnh tải lên từ trang quản trị tự dùng dạng thứ hai.

Thay PDF hồ sơ năng lực: nút **Thay tệp PDF** trong *Nội dung trang → Thông tin công ty* (ghi đè đúng tệp cũ), hoặc ghi đè `assets/docs/ho-so-nang-luc-anson-2026.pdf`.

## 5. Trang quản trị – đăng bài, sửa bài, sửa nội dung trang

Địa chỉ: `https://<tên-miền>/admin/` (bản demo: <https://kien14593-lab.github.io/ansonjsc-website/admin/>). Trang quản trị chạy hoàn toàn trên trình duyệt, lưu bài viết thẳng vào kho GitHub qua API; không cần máy chủ hay cơ sở dữ liệu riêng.

### 5.1 Thiết lập lần đầu (chủ kho làm một lần, ~2 phút)

1. Mở `/admin/` → màn hình **Thiết lập đăng nhập lần đầu** hiện ra.
2. Tạo token GitHub theo hướng dẫn trên màn hình: <https://github.com/settings/personal-access-tokens/new> → *Only select repositories* → chọn kho website → *Repository permissions* → **Contents: Read and write** → thời hạn dài nhất (tối đa 1 năm).
3. Dán token, giữ tên đăng nhập `admin` (hoặc đổi), **sao chép mật khẩu mạnh đã tạo sẵn và lưu lại** (hoặc tự đặt, ≥ 12 ký tự), bấm **Hoàn tất thiết lập**.

Từ đó mọi người được cấp mật khẩu đăng nhập bằng **tên + mật khẩu** ở bất kỳ máy nào. Token được mã hoá AES-256-GCM bằng khoá dẫn xuất từ mật khẩu (PBKDF2-SHA256, 600.000 vòng) và lưu tại `admin/auth.json`; không có mật khẩu thì không thể lấy lại token. Mật khẩu không được lưu ở đâu cả — quên mật khẩu hoặc token hết hạn thì bấm **Quên mật khẩu / thiết lập lại** và dán token mới. Đổi mật khẩu: nút **Đổi mật khẩu** trên thanh trên cùng.

### 5.2 Viết bài

- **Viết bài mới** → nhập tiêu đề (đường dẫn `tin-tuc/<slug>.html` tự sinh), tóm tắt, danh mục, ngày, ảnh đại diện; soạn nội dung bằng trình soạn thảo trực quan (kéo-thả hoặc dán ảnh để tải lên `assets/uploads/`).
- Bỏ chọn **Hiển thị trên website** để lưu **bản nháp** (không xuất hiện ngoài trang).
- Sau khi **Lưu**, GitHub Actions sinh lại website; thanh trạng thái trên trang quản trị báo khi xong (thường 1–2 phút).
- Bài viết là tệp `content/posts/<slug>.md` gồm phần đầu (`title, date, category, cover, summary, published`) và nội dung Markdown; có thể sửa trực tiếp trên GitHub nếu cần. Liên kết tới trang khác trong website viết dạng `../lien-he.html`.
- Danh mục sửa trong `admin/config.js` (`categories`) và `tools/build_site.py` (`POST_CATEGORIES`).

### 5.3 Sửa nội dung trang (Giới thiệu, Năng lực, Dự án, Liên hệ…)

Thanh trên cùng → **Nội dung trang**. Bên trái là danh sách các mục, nhóm theo trang hiển thị (Chung, Giới thiệu, Trang chủ, Năng lực, Dự án); bên phải là biểu mẫu của mục đang chọn.

- Mục dạng danh sách (lãnh đạo, phòng ban, hợp đồng, công trình, giấy khen…): mỗi mục là một thẻ có thể mở/đóng; dùng ▲ ▼ để đổi thứ tự, ✕ để xoá, **+ Thêm …** ở cuối để thêm mới.
- Bảng (nhân sự, thiết bị, hợp đồng, tài chính): sửa ngay trong ô; dòng để trống sẽ tự bị bỏ khi lưu. Giá trị tiền nhập bằng số, dấu chấm ngăn cách được tự thêm.
- Ảnh: **Tải ảnh lên** / **+ Thêm ảnh** (nhiều ảnh cùng lúc; ảnh đầu của công trình là ảnh đại diện). Tệp PDF hồ sơ năng lực: **Thay tệp PDF** trong *Thông tin công ty*.
- Công trình muốn hiện ở Trang chủ: điền **Thứ tự trang chủ** (1, 2, 3…); để trống thì chỉ hiện ở trang Dự án.
- Có thể sửa nhiều mục rồi bấm **Lưu & cập nhật website** một lần; nhãn *Chưa lưu* nhắc còn thay đổi. Nút ⟳ tải lại bản trên kho và bỏ thay đổi chưa lưu. Sau khi lưu, website cập nhật sau 1–2 phút (thanh trạng thái báo khi xong).
- Bản chất mỗi lần lưu là một lần ghi tệp `content/site.json` vào kho, nên lịch sử thay đổi xem được ở GitHub → *History* và khôi phục được khi cần.

### 5.4 Lưu ý bảo mật

- Ai có mật khẩu (hoặc token) đều có thể đăng/sửa/xoá bài và sửa nội dung trang. Chỉ chia sẻ cho người phụ trách; khi cần thu hồi: xoá token tại GitHub → Settings → Developer settings → Personal access tokens, rồi thiết lập lại với token mới.
- Token bị giới hạn ở đúng kho website và chỉ quyền *Contents*, không ảnh hưởng tài khoản GitHub hay kho khác.

## 6. Đưa lên tên miền ansonjsc.com.vn

Website chỉ gồm file tĩnh nên chạy được trên mọi hosting:

1. **Hosting cPanel / DirectAdmin (phổ biến tại Việt Nam):** tải toàn bộ nội dung thư mục (trừ `tools/`) vào `public_html/`. Bật SSL (Let's Encrypt) trong hosting để dùng `https://`.
2. **GitHub Pages (đang dùng cho bản demo):** kho `kien14593-lab/ansonjsc-website`, xuất bản qua GitHub Actions. Để dùng tên miền riêng: Settings → Pages → *Custom domain* nhập `ansonjsc.com.vn`, bật *Enforce HTTPS*; đồng thời đặt `siteUrl: "https://ansonjsc.com.vn"` trong `admin/config.js`. Cloudflare Pages / Netlify cũng dùng được (chạy lệnh build `pip install markdown && python tools/build_site.py`, thư mục xuất là gốc kho).
3. Tại nhà đăng ký tên miền `.com.vn`, cập nhật bản ghi DNS: `A`/`CNAME` trỏ về hosting; sau đó kiểm tra `https://ansonjsc.com.vn/sitemap.xml` và khai báo với Google Search Console.

## 7. Ghi chú quan trọng

- **Địa chỉ đã được cập nhật** trên toàn website thành *448/1 đường 448, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh*. Tuy nhiên file PDF hồ sơ năng lực gốc (`assets/docs/`) vẫn in địa chỉ cũ (460 Lê Văn Việt) — nên thay bằng bản PDF đã chỉnh sửa khi có.
- Bản đồ dùng Google Maps nhúng theo địa chỉ (không cần API key). Nếu muốn ghim chính xác, lấy liên kết "Nhúng bản đồ" từ Google Maps và thay vào `build_contact()` trong `tools/build_site.py`.
- Biểu mẫu liên hệ **không có máy chủ xử lý**: khi bấm gửi, trình duyệt mở ứng dụng e-mail với nội dung điền sẵn tới `congtycpanson@gmail.com`. Nếu cần nhận trực tiếp qua web, có thể tích hợp dịch vụ như Formspree/Getform bằng cách đổi thuộc tính `action` của form.
- Bảng hợp đồng nhóm *Tư vấn giám sát* trong PDF có 3 dòng trùng lặp (cùng một hợp đồng liệt kê nhiều lần); website đã gộp lại còn 11 dòng, tổng 4 nhóm = 45 hợp đồng, giá trị 127.475.674.003 đ.
- Phông chữ *Be Vietnam Pro* tải từ Google Fonts; nếu hosting cần hoạt động ngoại tuyến hoàn toàn, tải phông về `assets/fonts/` và sửa `@font-face` trong `style.css`.
- Số hotline 0903 600 205 lấy theo hồ sơ năng lực (số của Tổng Giám đốc); có thể đổi trong `COMPANY`.

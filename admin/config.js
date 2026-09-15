/* Cấu hình trang quản trị – chỉnh khi đổi kho GitHub hoặc tên miền */
window.ADMIN_CONFIG = {
  owner: "kien14593-lab",          // tài khoản / tổ chức GitHub sở hữu kho
  repo: "ansonjsc-website",        // tên kho chứa website
  branch: "main",                  // nhánh xuất bản
  postsDir: "content/posts",       // nơi lưu bài viết (.md)
  uploadsDir: "assets/uploads",    // nơi lưu ảnh tải lên
  categories: ["Tin công ty", "Dự án", "Thông báo", "Tuyển dụng"],
  // Địa chỉ website công khai. Để trống = tự suy ra từ địa chỉ trang quản trị (khuyên dùng).
  siteUrl: ""
};

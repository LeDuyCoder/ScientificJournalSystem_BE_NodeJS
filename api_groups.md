# Phân nhóm API - Scientific Journal System

Dựa trên cấu trúc file định tuyến (router) của hệ thống, tôi đã tổng hợp và phân nhóm các API thành các lĩnh vực (domain) riêng biệt. Điều này sẽ giúp bạn dễ dàng quản lý và chia nhỏ công việc khi refactor sang Fastify.

## 1. Authentication & Users (Xác thực & Người dùng)
Nhóm này quản lý việc đăng ký, đăng nhập và thông tin cá nhân của người dùng.
- `/users` - Quản lý thông tin hồ sơ, phân quyền người dùng.
- `/auth/login` - Đăng nhập (Local).
- `/auth/register` - Đăng ký tài khoản mới.
- `/auth/google` - Xác thực thông qua Google OAuth.
- `/auth` - Các tính năng auth khác (ví dụ: Reset password, refresh token).

## 2. Research Data (Dữ liệu khoa học)
Nhóm API lõi phục vụ tra cứu và quản lý thông tin học thuật, bài báo, tạp chí.
- `/articles` - Quản lý bài báo khoa học.
- `/journal` - Quản lý tạp chí (Journals).
- `/author` - Thông tin tác giả.
- `/publishers` - Nhà xuất bản.
- `/volumes` - Các tập san (Volumes) của tạp chí.
- `/issues` - Các số xuất bản (Issues).
- `/topics` - Các chủ đề nghiên cứu (Topics/Sub-topics).
- `/keywords` - Từ khóa bài báo/dự án.
- `/subject-areas` - Nhóm ngành lớn (Subject Areas).
- `/subject-categories` - Chuyên ngành cụ thể (Subject Categories).

## 3. Projects & Workspaces (Dự án & Không gian làm việc)
Nhóm quản lý không gian làm việc của các nhà nghiên cứu, lưu trữ bài báo và cộng tác.
- `/projects` - CRUD dự án cá nhân/nhóm.
- `/projects/:id/keywords` - Quản lý từ khóa riêng của dự án.
- `/projects/:id/members` - Quản lý thành viên tham gia dự án (phân quyền Owner/Member/Viewer).

## 4. Search & Discovery (Tìm kiếm & Khám phá)
Nhóm chuyên dụng cho việc truy vấn dữ liệu lớn.
- `/search` - Chứa các logic tìm kiếm (có thể sẽ tích hợp Full-text search GIN hoặc Vector Search ở đây).
- `/catalog` - API lấy dữ liệu danh mục tĩnh hoặc bộ lọc.
- `/zones` - API về các khu vực địa lý (Quốc gia/Vùng lãnh thổ).

## 5. Wallet & Payments (Ví điện tử & Thanh toán)
Hệ thống tiền tệ nội bộ và cổng thanh toán.
- `/wallet` - Quản lý số dư ví nội bộ, lịch sử giao dịch nạp/tiêu xu.
- `/coin-packages` - Các gói xu (Packages) có thể mua.
- `/payments` - Xử lý giao dịch thanh toán (VNPay, Momo, Stripe,...).

## 6. Admin & Analytics (Quản trị & Thống kê)
Dành riêng cho vai trò Quản trị viên (Administrator).
- `/admin` - Các chức năng can thiệp hệ thống, duyệt tài khoản, cấm người dùng.
- `/dashboard` - Lấy dữ liệu tổng quan cho trang chủ hoặc màn hình chính.
- `/statistics` - Báo cáo thống kê chuyên sâu (ví dụ: Tăng trưởng người dùng, doanh thu).

---

> [!TIP]
> **Kế hoạch chuyển đổi sang Fastify:**
> Khi chuyển sang Fastify, mỗi nhóm (Domain) ở trên sẽ được gom gọn vào một **Fastify Plugin**. 
> *Ví dụ: `fastify.register(userRoutes, { prefix: '/users' })`.*
> Cách chia này giúp mã nguồn cực kỳ gọn gàng, DTO (Data Transfer Objects) rõ ràng và dễ dàng triển khai Microservices trong tương lai nếu hệ thống lớn lên.

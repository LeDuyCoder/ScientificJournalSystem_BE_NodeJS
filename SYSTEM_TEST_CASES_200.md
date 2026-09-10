# Scientific Journal Publication Trend Tracking System — System Test Case

> Cấu trúc tài liệu được chuẩn hóa theo file mẫu `SWT301_Test_Case.md`. Bộ test gồm đúng 200 system test case và chưa ghi nhận kết quả thực thi.

## Cover

### TEST CASE

| Field | Value |
| --- | --- |
| Project Name | Scientific Journal Publication Trend Tracking System |
| Creator | Project Team |
| Project Code | SJS |
| Reviewer/Approver |  |
| Document Code | SJS_SYSTEM_TEST_CASE_v1.0 |
| Issue Date | 2026-07-23 |
| Version | 1.0 |

### Record of Change

| Effective Date | Version | Change Item | *A,D,M | Change description | Reference |
| --- | --- | --- | --- | --- | --- |
| 2026-07-23 | 1.0 | Toàn bộ tài liệu | A | Tạo và chuẩn hóa 200 system test case theo cấu trúc SWT301 | Source code backend và `SWT301_Test_Case.md` |

## Test Case List

| Field | Value |
| --- | --- |
| Project Name | Scientific Journal Publication Trend Tracking System |
| Project Code | SJS |
| Test Environment Setup Description | 1. Backend: Node.js/Express, base URL `/api/v1`.<br>2. Database: PostgreSQL.<br>3. Cache: Redis.<br>4. Authentication: JWT access/refresh token và Google OAuth test account.<br>5. Email: SMTP sandbox cho activation, reset password và project invitation.<br>6. Payment: VNPay/MoMo sandbox.<br>7. Client: Chrome/Edge phiên bản mới, frontend origin nằm trong CORS whitelist. |

### Modules

| No | Function Name | Sheet Name | Description | Pre-Condition |
| --- | --- | --- | --- | --- |
| 1 | Nền tảng, xác thực và phiên | Module1_AUTH | Kiểm tra đăng ký, kích hoạt, đăng nhập, Google login, refresh/logout, reset password, JWT và CORS. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 2 | Người dùng và quản trị người dùng | Module2_USER | Kiểm tra hồ sơ cá nhân, tự xóa tài khoản, quản lý user và phân quyền Administrator. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 3 | Dự án, thành viên và watched keyword | Module3_PROJECT | Kiểm tra vòng đời project, phân quyền thành viên, lời mời và từ khóa theo dõi. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 4 | Bài báo | Module4_ARTICLE | Kiểm tra danh sách, chi tiết, tạo/cập nhật, validation, soft-delete và restore bài báo. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 5 | Journal, publisher, volume và issue | Module5_PUBLICATION | Kiểm tra dữ liệu phân cấp xuất bản, ràng buộc khóa ngoại, trùng lặp và soft-delete/restore. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 6 | Author, keyword và taxonomy | Module6_TAXONOMY | Kiểm tra author, keyword, subject area, subject category, topic và thống kê liên quan. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 7 | Catalog, search, zone, statistics và dashboard | Module7_ANALYTICS | Kiểm tra catalog, tìm kiếm, dữ liệu vùng, xu hướng, dashboard, cache và độ chính xác tổng hợp. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 8 | Ví coin, gói coin và thanh toán | Module8_COINPAY | Kiểm tra ví, ledger, gói coin, VNPay/MoMo, callback idempotency và thao tác quản trị. | Môi trường test và dữ liệu chuẩn đã được thiết lập |
| 9 | Admin reporting và thuộc tính cấp hệ thống | Module9_SYSTEM | Kiểm tra báo cáo admin, CSV, atomicity, lỗi hệ thống, hiệu năng, đồng thời và phục hồi. | Môi trường test và dữ liệu chuẩn đã được thiết lập |

### Test Data

| Ký hiệu | Dữ liệu chuẩn |
| --- | --- |
| `U1` | User LOCAL, ACTIVE, role RESEARCHER, có access/refresh token hợp lệ |
| `U2` | User LOCAL, ACTIVE, role STUDENT, không sở hữu dữ liệu của U1 |
| `U3` / `U4` / `UG` | User INACTIVE / BANNED / đăng nhập Google |
| `A1` | User ACTIVE, role ADMINISTRATOR |
| `P1` / `P2` / `P_DEL` | Project của U1 / project của U2 / project đã soft-delete |
| `AR1` / `AR_DEL` | Article hoạt động / article đã soft-delete |
| `J1` / `J_DEL` | Journal hoạt động / journal đã soft-delete |
| `V1` / `V_DEL` | Volume hoạt động / volume đã soft-delete |
| `I1` / `I_DEL` | Issue hoạt động / issue đã soft-delete |
| `AU1` / `K1` / `SA1` / `SC1` / `TP1` | Author, keyword, subject area, subject category và topic hợp lệ |
| `CP1` / `W1` | Coin package hoạt động / ví U1 có đủ số dư |
| `T_EXPIRED` / `T_TAMPERED` | Access token hết hạn / JWT bị sửa payload hoặc chữ ký |

## Module1_AUTH

### Module Information

| Field | Value |
| --- | --- |
| Module Code | AUTH |
| Test requirement | Kiểm tra đăng ký, kích hoạt, đăng nhập, Google login, refresh/logout, reset password, JWT và CORS. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 25 | 0 | 25 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_001] | Đăng ký LOCAL hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /auth/register` với email hợp lệ, password ≥ 6, role `RESEARCHER` và hồ sơ hợp lệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201, `REGISTER_SUCCESS`; user được tạo type `LOCAL`, status `INACTIVE`; password được hash; email kích hoạt được gửi; response không chứa password/hash | Email mới chưa tồn tại; email sandbox hoạt động | Untested |  | Priority: P0 |
| [ST_002] | Đăng ký thiếu email | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi body có password nhưng không có email<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400, `EMAIL_REQUIRED`; không tạo user, không gửi email | Không | Untested |  | Priority: P0 |
| [ST_003] | Đăng ký email sai định dạng | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi `email="abc@"`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400, `EMAIL_INVALID`; DB không đổi | Không | Untested |  | Priority: P1 |
| [ST_004] | Đăng ký mật khẩu quá ngắn | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi password 5 ký tự<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400, `PASSWORD_TOO_SHORT`; DB không đổi | Email mới | Untested |  | Priority: P0 |
| [ST_005] | Đăng ký role ngoài whitelist | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi `role="SUPER_ADMIN"`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400, `ROLE_INVALID`; không tạo tài khoản đặc quyền | Email mới | Untested |  | Priority: P1 |
| [ST_006] | Đăng ký trùng email không phân biệt hoa thường | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Đăng ký `user@test.com`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 409; chỉ có một user cho email chuẩn hóa; không gửi thêm email kích hoạt | Đã có `User@Test.com` | Untested |  | Priority: P0 |
| [ST_007] | Kích hoạt tài khoản bằng token hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /auth/verify?token=...`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `ACCOUNT_ACTIVATION_SUCCESS`; status chuyển đúng một lần thành `ACTIVE` | `U3` và activation token còn hạn | Untested |  | Priority: P0 |
| [ST_008] | Kích hoạt lại tài khoản đã active | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi lại endpoint verify<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `ACCOUNT_ALREADY_ACTIVE`; dữ liệu không bị tạo/cập nhật lặp | Token hợp lệ của user đã `ACTIVE` | Untested |  | Priority: P1 |
| [ST_009] | Kích hoạt bằng token thiếu, giả mạo hoặc hết hạn | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi verify lần lượt với thiếu token, token sửa chữ ký và token hết hạn<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi request HTTP 400 với lỗi kích hoạt; status user không đổi | Có ba biến thể token | Untested |  | Priority: P0 |
| [ST_010] | Đăng nhập LOCAL thành công, không ghi nhớ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /auth/login` với `remember=false`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `LOGIN_SUCCESS`; trả access token và set cookie `access_token` HttpOnly; refresh cookie cũ bị xóa; tạo log đăng nhập | `U1` có mật khẩu đúng | Untested |  | Priority: P0 |
| [ST_011] | Đăng nhập LOCAL với remember | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Login với `remember=true`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; set cả access và refresh cookie với thuộc tính domain/SameSite/Secure theo môi trường; refresh token dùng được | `U1` hợp lệ | Untested |  | Priority: P0 |
| [ST_012] | Đăng nhập sai mật khẩu hoặc email không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi hai request tương ứng<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Cả hai HTTP 401 với thông điệp tổng quát tương đương; không cho phép suy đoán email tồn tại | Không | Untested |  | Priority: P0 |
| [ST_013] | Chặn đăng nhập user inactive/banned | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Login bằng mật khẩu đúng của từng user<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 403; không cấp token/cookie; trạng thái DB không đổi | Có `U3`, `U4` | Untested |  | Priority: P0 |
| [ST_014] | Chặn đăng nhập password cho tài khoản Google | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Login LOCAL bằng email `UG`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 403; không cấp token | Có `UG` type `GOOGLE` | Untested |  | Priority: P1 |
| [ST_015] | Google login tạo user mới | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /auth/google` với ID token<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; tạo user Google active, phát access token; email/provider và hồ sơ ánh xạ đúng; không lưu mật khẩu thô | Google ID token hợp lệ cho email mới | Untested |  | Priority: P0 |
| [ST_016] | Google login với token lỗi hoặc user banned | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi endpoint cho hai biến thể<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Token lỗi bị từ chối 400; user banned bị từ chối 403; không cấp JWT | Token Google giả và token của `U4` | Untested |  | Priority: P0 |
| [ST_017] | Cấp lại access token | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /auth/refresh`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `REFRESH_TOKEN_SUCCESS`; access token mới có đúng user/role và được set cookie | Refresh cookie hợp lệ của `U1` | Untested |  | Priority: P0 |
| [ST_018] | Từ chối refresh token thiếu/giả mạo | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi `/auth/refresh`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 401 với code phù hợp; không phát access token | Không có cookie, sau đó dùng token sửa chữ ký | Untested |  | Priority: P0 |
| [ST_019] | Kiểm tra trạng thái đăng nhập có cookie | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /auth/check-auth`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `authenticated=true`; phản hồi nhất quán với cookie hiện tại | Có access cookie | Untested |  | Priority: P1 |
| [ST_020] | Đăng xuất | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /auth/logout`, sau đó gọi API bảo vệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `LOGOUT_SUCCESS`; cả hai cookie bị clear; request sau không có token nhận 401 | Có access và refresh cookie | Untested |  | Priority: P0 |
| [ST_021] | Forgot password chống dò email | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /auth/forgot-password` cho cả hai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Cả hai trả thông điệp thành công tương đương; chỉ email tồn tại nhận link; token DB lưu dạng hash và hết hạn sau khoảng 15 phút | Một email LOCAL tồn tại và một email không tồn tại | Untested |  | Priority: P1 |
| [ST_022] | Không reset password bằng tài khoản Google | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Forgot password cho email `UG`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 403, `RESET_PASSWORD_NOT_SUPPORTED`; không tạo token reset | Có `UG` | Untested |  | Priority: P1 |
| [ST_023] | Reset password hợp lệ và chỉ dùng token một lần | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /auth/reset-password` với password mới ≥ 6; login bằng password mới; dùng lại token<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần đầu 200 và transaction commit cả password hash/`used_at`; login mới thành công; dùng lại token bị 400 | Reset token còn hạn của `U1` | Untested |  | Priority: P0 |
| [ST_024] | Reset password với token hết hạn hoặc password ngắn | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi token hết hạn; sau đó gửi password dưới 6 ký tự<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với code validation/token phù hợp; password và token hợp lệ chưa dùng không bị thay đổi | Token hết hạn và token hợp lệ | Untested |  | Priority: P0 |
| [ST_025] | Middleware xác thực và CORS | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi endpoint bằng thiếu token, `T_EXPIRED`, `T_TAMPERED`, token trong header/cookie; gửi preflight từ origin cho phép và origin lạ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Thiếu/invalid token nhận 401; header và cookie hợp lệ được chấp nhận; origin whitelist nhận CORS credentials, origin lạ không nhận `Access-Control-Allow-Origin`; không lộ secret | Có endpoint bảo vệ; cấu hình hai frontend origin | Untested |  | Priority: P0 |

## Module2_USER

### Module Information

| Field | Value |
| --- | --- |
| Module Code | USER |
| Test requirement | Kiểm tra hồ sơ cá nhân, tự xóa tài khoản, quản lý user và phân quyền Administrator. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 15 | 0 | 15 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_026] | Lấy hồ sơ cá nhân | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /users/me`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `SUCCESS_GET_USER`; đúng user theo JWT; không trả password/hash/token | `U1` đăng nhập | Untested |  | Priority: P0 |
| [ST_027] | Cập nhật hồ sơ cá nhân qua `/me` | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /users/me` với first/last name, ngày sinh, gender, image<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `UPDATE_PROFILE_SUCCESS`; chỉ field hồ sơ được đổi; tạo audit log | `U1` đăng nhập | Untested |  | Priority: P0 |
| [ST_028] | Ngăn self-update field nhạy cảm qua ID | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /users/{U1.id}` với `role`, `status`, `email`, `password`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `INVALID_FIELDS` nếu chỉ có field cấm; role/status/email/password trong DB không đổi | `U1` đăng nhập | Untested |  | Priority: P0 |
| [ST_029] | Ngăn cập nhật hồ sơ user khác | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /users/{U2.id}` với first_name<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 403 `FORBIDDEN`; `U2` không đổi | `U1` đăng nhập; có `U2` | Untested |  | Priority: P0 |
| [ST_030] | Validate UUID, ngày sinh và gender khi self-update | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi với UUID sai; ngày không hợp lệ; gender là chuỗi<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi request HTTP 400 với code tương ứng; DB không đổi | `U1` đăng nhập | Untested |  | Priority: P1 |
| [ST_031] | Tự xóa tài khoản | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /users/me`, sau đó login/gọi API<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; đúng tài khoản bị xóa theo thiết kế; không xóa user khác; phiên cũ không còn truy cập được; có log | Tạo user test riêng đang active | Untested |  | Priority: P0 |
| [ST_032] | Chặn non-admin truy cập API admin user | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi `GET /admin/users`, `POST /admin/users`, `GET /admin/users/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Tất cả HTTP 403 `NO_PERMISSION`; có warning log; không thay đổi dữ liệu | `U1` đăng nhập | Untested |  | Priority: P0 |
| [ST_033] | Admin lấy danh sách user có phân trang/lọc/sort | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /admin/users?search=...&role=...&status=...&page=1&limit=10&sortBy=...&sortOrder=...`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ bản ghi khớp, thứ tự đúng, pagination đúng; không lộ password | `A1`; có nhiều role/status | Untested |  | Priority: P1 |
| [ST_034] | Admin xem chi tiết user | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /admin/users/{U1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `GET_USER_DETAIL_SUCCESS`; đúng user và dữ liệu quản trị; có audit log xem | `A1`; có `U1` | Untested |  | Priority: P1 |
| [ST_035] | Admin xem user UUID sai/không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi với `abc`, sau đó UUID hợp lệ không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần lượt HTTP 400 `INVALID_USER_ID` và 404 `USER_NOT_FOUND` | `A1` | Untested |  | Priority: P1 |
| [ST_036] | Admin tạo user hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /admin/users` với email, password ≥ 6, role/status/hồ sơ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201, `CREATE_USER_SUCCESS`; password hash; role/status đúng; response không chứa password; có audit log | `A1`; email mới | Untested |  | Priority: P0 |
| [ST_037] | Admin tạo user trùng email hoặc payload sai | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi trùng email; thiếu email; password ngắn<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trùng email 409 `EMAIL_EXISTS`; payload sai 400; không có user rác | `A1`; email đã tồn tại | Untested |  | Priority: P0 |
| [ST_038] | Admin cập nhật role/status user | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /admin/users/{id}` đổi role/status và hồ sơ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200, `ADMIN_UPDATE_USER_SUCCESS`; field whitelist đổi đúng; password nếu đổi được hash; log không chứa password | `A1`; user test | Untested |  | Priority: P0 |
| [ST_039] | Validate admin update user | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi body rỗng, field lạ, role/status/type/date/gender/email/password sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi biến thể HTTP 400 với code cụ thể; không cập nhật một phần | `A1` | Untested |  | Priority: P0 |
| [ST_040] | Token role cũ không vượt phân quyền sau thay đổi | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Dùng token cũ gọi admin API, rồi đăng nhập/cấp token mới và gọi lại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Quyền được quyết định nhất quán với mô hình JWT hiện hành; token thường không vào được admin; token admin hợp lệ vào được; kết quả được ghi nhận như rủi ro nếu thay role không thu hồi token cũ | `U1` có token role thường; admin nâng/hạ role trong DB | Untested |  | Priority: P0 |

## Module3_PROJECT

### Module Information

| Field | Value |
| --- | --- |
| Module Code | PROJECT |
| Test requirement | Kiểm tra vòng đời project, phân quyền thành viên, lời mời và từ khóa theo dõi. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 25 | 0 | 25 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_041] | Tạo project hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /projects` với title, `subject_category_ids`, `journal_ids`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; project thuộc `U1`; bảng liên kết category/journal được tạo đủ, không trùng | `U1`; `SC1`, `J1` tồn tại | Untested |  | Priority: P0 |
| [ST_042] | Validate payload tạo project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi title trống; category không phải mảng; journal không phải mảng<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi request HTTP 400 với code validation phù hợp; không tạo project | `U1` | Untested |  | Priority: P1 |
| [ST_043] | Tạo project với ID liên kết không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi category/journal ID không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trả lỗi 4xx nghiệp vụ; transaction rollback, không còn project hoặc link mồ côi | `U1` | Untested |  | Priority: P1 |
| [ST_044] | Lấy danh sách project của user | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects` bằng `U1`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ project `U1` sở hữu/tham gia theo nghiệp vụ; không lộ `P2` ngoài quyền | `U1` có nhiều project; `U2` có `P2` | Untested |  | Priority: P0 |
| [ST_045] | Lấy chi tiết project có quyền | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/{P1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; trả project cùng category/journal/watched keyword liên quan chính xác | `U1`; có `P1` | Untested |  | Priority: P0 |
| [ST_046] | Chặn xem project của user khác | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/{P2.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | 403 hoặc 404 theo chính sách che giấu tài nguyên; không trả metadata của `P2` | `U1`; có `P2` | Untested |  | Priority: P0 |
| [ST_047] | Validate project ID | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi project routes với `0`, `-1`, `abc`, `1.5`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `INVALID_PROJECT_ID`; không truy vấn/cập nhật nhầm | `U1` | Untested |  | Priority: P1 |
| [ST_048] | Cập nhật project hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /projects/{P1.id}` đổi title, category và journal<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; dữ liệu chính và bảng liên kết đồng bộ đúng; không nhân đôi link | `U1`; `P1` | Untested |  | Priority: P0 |
| [ST_049] | Chặn cập nhật project không sở hữu | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /projects/{P2.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | 403/404; `P2` và link không đổi | `U1`; `P2` | Untested |  | Priority: P0 |
| [ST_050] | Soft-delete project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /projects/{id}`, sau đó list/detail<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; project được đánh dấu xóa; không còn trong danh sách active; link lịch sử không hỏng | `U1`; project test active | Untested |  | Priority: P0 |
| [ST_051] | Xóa lại project đã xóa | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /projects/{P_DEL.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lỗi 4xx “already deleted” hoặc idempotent theo contract; không phát sinh thay đổi lặp | `U1`; `P_DEL` | Untested |  | Priority: P1 |
| [ST_052] | Restore project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /projects/{P_DEL.id}/restore`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; project active trở lại cùng các liên kết hợp lệ; xuất hiện trong list | `U1`; `P_DEL` | Untested |  | Priority: P0 |
| [ST_053] | Activate project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /projects/{id}/activate`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; trạng thái chuyển đúng; gọi lại không tạo side effect sai | `U1`; project ở trạng thái có thể activate | Untested |  | Priority: P1 |
| [ST_054] | Lấy bài báo liên quan project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/{id}/related-articles?limit=10`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; tối đa 10 bài phù hợp, không trùng, không gồm bài soft-delete | `U1`; `P1` có categories/journals/keywords | Untested |  | Priority: P1 |
| [ST_055] | Validate limit bài liên quan | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi với `limit=0`, `-1`, `abc`, `1.5`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `INVALID_LIMIT`; không trả tập dữ liệu không giới hạn | `U1`; `P1` | Untested |  | Priority: P1 |
| [ST_056] | Project overview | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/{id}/overview`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; tổng số và các nhóm dữ liệu khớp truy vấn DB độc lập | `U1`; `P1` có dữ liệu | Untested |  | Priority: P1 |
| [ST_057] | Project analytics | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/{id}/analytics`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; series/nội dung phân tích đúng project, mốc thời gian tăng dần, tổng khớp dữ liệu nguồn | `U1`; `P1` có dữ liệu nhiều năm | Untested |  | Priority: P1 |
| [ST_058] | Lấy danh sách thành viên project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/{projectId}/members` bằng owner và member<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200 cho người có quyền; danh sách, role và trạng thái lời mời chính xác; người ngoài bị chặn | Owner và member đã accept | Untested |  | Priority: P0 |
| [ST_059] | Mời thành viên mới | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /projects/{P1.id}/members/invite` với email/role hợp lệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Thành công; tạo đúng một invitation còn hạn; gửi email chứa token; chưa cấp quyền trước khi accept | `U1` là owner; email `U2`; chưa là member | Untested |  | Priority: P0 |
| [ST_060] | Chặn lời mời không hợp lệ/trùng | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Mời email sai, owner tự mời, member đã tồn tại, hoặc invitation đang pending<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trả 4xx phù hợp; không tạo invitation/member/email trùng | `P1` | Untested |  | Priority: P0 |
| [ST_061] | Chấp nhận lời mời project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /projects/project-invite/accept?token=...`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Thành công; `U2` trở thành member đúng role; invitation được đánh dấu dùng; token không dùng lại được | Có invitation token hợp lệ cho `U2` | Untested |  | Priority: P0 |
| [ST_062] | Chấp nhận invitation token lỗi/hết hạn | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi accept<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trả 4xx; không tạo member | Có token sửa chữ ký và hết hạn | Untested |  | Priority: P0 |
| [ST_063] | Owner đổi role thành viên | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /projects/{P1.id}/members/{U2.id}/role` với role hợp lệ; thử bằng non-owner/role sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Owner cập nhật thành công; non-owner/role sai bị 4xx; không thể làm project mất owner cuối cùng nếu nghiệp vụ cấm | `U1` owner; `U2` member | Untested |  | Priority: P0 |
| [ST_064] | Xóa thành viên project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /projects/{P1.id}/members/{U2.id}`; thử xóa owner bởi member<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Xóa member thành công và mất quyền ngay; member không thể xóa owner; dữ liệu project không bị xóa | `U1` owner; `U2` member | Untested |  | Priority: P0 |
| [ST_065] | Quản lý watched keywords xuyên suốt | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST thêm mảng keyword; GET trending/articles; PUT thay toàn bộ; DELETE một keyword; thử thao tác `P2` và ID keyword không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Các thao tác của owner đồng bộ đúng, không trùng; query chỉ theo tập đang watch; project khác bị 404/403; ID không tồn tại nhận 400; không có link mồ côi | `U1`; `P1`; có `K1` và keyword khác | Untested |  | Priority: P0 |

## Module4_ARTICLE

### Module Information

| Field | Value |
| --- | --- |
| Module Code | ARTICLE |
| Test requirement | Kiểm tra danh sách, chi tiết, tạo/cập nhật, validation, soft-delete và restore bài báo. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 15 | 0 | 15 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_066] | Lấy danh sách article công khai | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /articles?page=1&limit=10`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; danh sách/pagination đúng; không trả `AR_DEL`; không cần token khi không lọc keywords | Có article active và soft-delete | Untested |  | Priority: P1 |
| [ST_067] | Lọc article theo keywords yêu cầu xác thực | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /articles?keywords=AI` không token, sau đó với `U1`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Không token nhận 401; có token nhận 200 và chỉ bài phù hợp | Có dữ liệu keyword | Untested |  | Priority: P0 |
| [ST_068] | Lấy chi tiết article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /articles/{AR1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; trả article, issue/journal, authors, topics, keywords đúng và không nhân bản do join | Có `AR1` | Untested |  | Priority: P1 |
| [ST_069] | Article ID sai/không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi detail với `abc`, sau đó ID số không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | ID sai nhận 400 `ID_INVALID`; ID không tồn tại nhận 404; không 500 | Không | Untested |  | Priority: P1 |
| [ST_070] | Tạo article đầy đủ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /articles` với title, publication_year, issue_id, authors, primary_topic, sub_topic, keywords<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; article và mọi bảng liên kết được tạo trong một transaction; primary topic đúng; không trùng author/keyword | `U1`; `I1`, authors/topics hợp lệ | Untested |  | Priority: P0 |
| [ST_071] | Validate trường bắt buộc của article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi title trống; thiếu year; year dạng chuỗi; issue/primary topic sai kiểu<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi biến thể HTTP 400 với code tương ứng; DB không đổi | `U1` | Untested |  | Priority: P0 |
| [ST_072] | Validate authors của article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi authors không phải mảng; phần tử không nguyên; ID author không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `AUTHORS_INVALID` hoặc `AUTHORS_NOT_FOUND`; không tạo article/link | `U1` | Untested |  | Priority: P1 |
| [ST_073] | Validate keywords của article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi array chứa số; object có keyword trống/score không phải số; kiểu primitive<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `KEYWORDS_INVALID`; không tạo dữ liệu keyword một phần | `U1` | Untested |  | Priority: P1 |
| [ST_074] | Validate sub-topic của article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi không phải mảng hoặc phần tử kiểu object<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `SUB_TOPIC_INVALID`; DB không đổi | `U1` | Untested |  | Priority: P1 |
| [ST_075] | Cập nhật article và quan hệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /articles/{id}` đổi metadata, authors, topics, keywords<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; tập quan hệ cũ được thay/đồng bộ đúng; không tạo duplicate; detail phản ánh dữ liệu mới | `U1`; article test active | Untested |  | Priority: P0 |
| [ST_076] | Cập nhật article với author không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. PUT authors chứa ID không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `AUTHORS_NOT_FOUND`; toàn bộ update rollback | `U1`; `AR1` | Untested |  | Priority: P0 |
| [ST_077] | Soft-delete article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /articles/{id}`; kiểm tra list/detail/search/statistics<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; article bị soft-delete và không xuất hiện ở các API active; liên kết không bị orphan | `U1`; article active | Untested |  | Priority: P0 |
| [ST_078] | Xóa lại article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE lại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trả lỗi 4xx hoặc kết quả idempotent theo contract; không tăng/giảm thống kê lặp | `U1`; `AR_DEL` | Untested |  | Priority: P1 |
| [ST_079] | Restore article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PATCH /articles/{id}/restore`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; article và quan hệ hiển thị lại đúng; thống kê trở về đúng một lần | `U1`; `AR_DEL` và parent còn active | Untested |  | Priority: P0 |
| [ST_080] | Restore article khi parent bị xóa | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Restore article<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Bị từ chối 4xx hoặc khôi phục theo quy tắc được tài liệu hóa; không tạo article active trỏ tới parent không hợp lệ | `U1`; article đã xóa, issue/volume/journal parent bị xóa | Untested |  | Priority: P1 |

## Module5_PUBLICATION

### Module Information

| Field | Value |
| --- | --- |
| Module Code | PUBLICATION |
| Test requirement | Kiểm tra dữ liệu phân cấp xuất bản, ràng buộc khóa ngoại, trùng lặp và soft-delete/restore. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 30 | 0 | 30 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_081] | Lấy danh sách journal | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /journal?page=1&limit=10&search=...`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; filter/pagination đúng; không trả journal đã xóa | Có nhiều journal, gồm soft-delete | Untested |  | Priority: P1 |
| [ST_082] | Lấy chi tiết journal | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /journal/{J1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; publisher, zone, ISSN và metadata đúng | Có `J1` | Untested |  | Priority: P1 |
| [ST_083] | Tạo journal hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /journal` với display_name, publisher_id, country, region, ISSN hợp lệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; default `type=Journal`, boolean mặc định false nếu thiếu; các FK đúng | `U1`; publisher/country/region active | Untested |  | Priority: P0 |
| [ST_084] | Validate field bắt buộc/FK journal | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Lần lượt thiếu display_name, publisher, country, region; dùng FK không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với code cụ thể; không tạo journal | `U1` | Untested |  | Priority: P0 |
| [ST_085] | Validate ISSN journal | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi string nhiều ISSN hợp lệ; sau đó format sai, array có phần tử sai và kiểu số<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Hợp lệ được chuẩn hóa/lưu đúng; các biến thể sai nhận 400; không lưu một phần | `U1` | Untested |  | Priority: P1 |
| [ST_086] | Cập nhật journal hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /journal/{id}` đổi publisher/zone/ISSN/boolean<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; FK được kiểm tra; detail phản ánh đúng; không ảnh hưởng journal khác | `U1`; journal test | Untested |  | Priority: P0 |
| [ST_087] | Soft-delete và restore journal | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE rồi `PATCH /journal/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Xóa làm journal biến mất khỏi list active; restore đưa trở lại đúng một lần; status và quan hệ nhất quán | `U1`; journal test không gây vi phạm dữ liệu | Untested |  | Priority: P0 |
| [ST_088] | Journal ID sai/không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE/restore với ID 0, chữ và ID số không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | ID sai nhận 400 `INVALID_JOURNAL_ID`; không tồn tại nhận 404; DB không đổi | `U1` | Untested |  | Priority: P1 |
| [ST_089] | Lấy danh sách và chi tiết publisher | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /publishers`, `GET /publishers/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; search/pagination đúng; detail đúng; không trả soft-delete | Có publisher active/soft-delete | Untested |  | Priority: P1 |
| [ST_090] | Chặn non-admin CRUD publisher | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST, PUT, DELETE, restore publisher<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mọi request HTTP 403; DB không đổi | `U1` | Untested |  | Priority: P0 |
| [ST_091] | Admin tạo/cập nhật publisher | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST publisher hợp lệ, sau đó PUT đổi metadata<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201/200; dữ liệu đúng, không tạo bản ghi trùng ngoài rule | `A1` | Untested |  | Priority: P0 |
| [ST_092] | Admin soft-delete/restore publisher | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE rồi PATCH restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trạng thái chuyển đúng; list/detail phản ánh; gọi lặp không gây side effect | `A1`; publisher không/đang bị xóa | Untested |  | Priority: P0 |
| [ST_093] | Tạo volume hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /volumes` với journal_id, volume_number dương, publication_year dương<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; volume liên kết đúng journal; không trùng trong journal | `U1`; `J1` active | Untested |  | Priority: P0 |
| [ST_094] | Validate volume parent và số | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. journal sai/đã xóa; volume_number 0 hoặc thập phân; year sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với code tương ứng; không tạo volume | `U1` | Untested |  | Priority: P0 |
| [ST_095] | Chặn volume trùng trong cùng journal | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Tạo thêm volume X cho `J1`, rồi cùng X cho journal khác<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Cùng journal nhận 400 `DUPLICATE_VOLUME`; journal khác được phép nếu dữ liệu hợp lệ | `U1`; đã có số volume X ở `J1` | Untested |  | Priority: P0 |
| [ST_096] | Danh sách volume có lọc/phân trang | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /volumes` với page/limit và filter hỗ trợ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; kết quả đúng, pagination đúng, không có `V_DEL` | `U1`; nhiều journal/year | Untested |  | Priority: P1 |
| [ST_097] | Chi tiết volume | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /volumes/{V1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; đúng journal, số volume, năm và trạng thái | `U1`; `V1` | Untested |  | Priority: P1 |
| [ST_098] | Cập nhật volume hợp lệ và chặn trùng | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. PUT đổi year/số sang giá trị mới; sau đó đổi thành số đã có<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần đầu 200; lần sau 400 `DUPLICATE_VOLUME`; update lỗi không làm mất dữ liệu cũ | `U1`; hai volume cùng journal | Untested |  | Priority: P0 |
| [ST_099] | Chặn cập nhật volume đã xóa | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PUT /volumes/{V_DEL.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `VOLUME_ALREADY_DELETED`; DB không đổi | `U1`; `V_DEL` | Untested |  | Priority: P1 |
| [ST_100] | Soft-delete và restore volume | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE, kiểm tra list/detail, PATCH restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trạng thái chuyển đúng; issue con được xử lý nhất quán theo nghiệp vụ; gọi lại không nhân side effect | `U1`; volume test | Untested |  | Priority: P0 |
| [ST_101] | Volume ID sai/không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi detail/update/delete/restore với ID sai và ID không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | ID sai nhận 400; không tồn tại nhận 404 ở tầng nghiệp vụ; không 500 | `U1` | Untested |  | Priority: P1 |
| [ST_102] | Lấy danh sách issue công khai | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /issues` với pagination/filter volume<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; danh sách đúng; không trả `I_DEL`; không cần token cho list | Có issue active/soft-delete | Untested |  | Priority: P1 |
| [ST_103] | Tạo issue hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /issues` với volume_id, issue_number và dữ liệu hợp lệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; issue liên kết đúng volume; unique rule được giữ | `U1`; `V1` active | Untested |  | Priority: P0 |
| [ST_104] | Validate tạo issue | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. volume thiếu/sai/đã xóa; issue_number sai; dữ liệu ngày sai nếu có<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với code phù hợp; không tạo issue | `U1` | Untested |  | Priority: P0 |
| [ST_105] | Chặn issue trùng trong volume | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Tạo số X trong `V1`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 duplicate; chỉ còn một issue số X | `U1`; issue số X đã có trong `V1` | Untested |  | Priority: P0 |
| [ST_106] | Chi tiết issue cần xác thực | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /issues/{I1.id}` không token và với `U1`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Không token 401; có token 200 và dữ liệu đúng | Có `I1` | Untested |  | Priority: P1 |
| [ST_107] | Cập nhật issue hợp lệ/chặn trùng | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. PUT đổi metadata hợp lệ; sau đó đổi sang số trùng<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần đầu 200; lần sau 400; transaction lỗi không cập nhật một phần | `U1`; hai issue | Untested |  | Priority: P0 |
| [ST_108] | Soft-delete issue | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /issues/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; issue biến mất khỏi list; article con được xử lý/giữ nhất quán, không thành dữ liệu active mồ côi | `U1`; issue active | Untested |  | Priority: P0 |
| [ST_109] | Restore issue | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `PATCH /issues/{id}/restore`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; issue active trở lại; list/detail và thống kê đúng | `U1`; `I_DEL`, volume parent active | Untested |  | Priority: P0 |
| [ST_110] | Issue ID/state biên | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi với ID sai/không tồn tại; xóa lại; restore issue đang active hoặc có parent deleted<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trả 400/404 theo tình huống; không 500; không thay đổi sai trạng thái | `U1` | Untested |  | Priority: P1 |

## Module6_TAXONOMY

### Module Information

| Field | Value |
| --- | --- |
| Module Code | TAXONOMY |
| Test requirement | Kiểm tra author, keyword, subject area, subject category, topic và thống kê liên quan. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 30 | 0 | 30 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_111] | Danh sách author có phân trang | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /author?page=1&limit=10`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; pagination đúng, không trùng, không trả author đã xóa | Có nhiều author | Untested |  | Priority: P1 |
| [ST_112] | Validate pagination author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi page 0; limit 0; limit 101<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `AUTHOR_INVALID_PAGINATION` | Không | Untested |  | Priority: P1 |
| [ST_113] | Chi tiết author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /author/{AU1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; hồ sơ/chỉ số đúng; không lộ dữ liệu nội bộ | Có `AU1` | Untested |  | Priority: P1 |
| [ST_114] | Author ID sai/không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi với chữ, 0 và ID số không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | ID sai nhận 400; không tồn tại 404 | Không | Untested |  | Priority: P1 |
| [ST_115] | Tạo author hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /author` với `display_name` Unicode hợp lệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; tên được trim; author active được tạo | `U1` | Untested |  | Priority: P0 |
| [ST_116] | Validate tên author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Tên trống, 1 ký tự, >255, HTML/script, ký tự cấm<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi request HTTP 400 `AUTHOR_INVALID_BODY`; không tạo author | `U1` | Untested |  | Priority: P1 |
| [ST_117] | Cập nhật author hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. PUT display_name, ORCID, chỉ số không âm và institution<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; field whitelist đổi đúng | `U1`; author test | Untested |  | Priority: P0 |
| [ST_118] | Validate update author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Body không field hợp lệ; chỉ số âm/không phải số; tên chứa script<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400; không cập nhật một phần | `U1`; `AU1` | Untested |  | Priority: P1 |
| [ST_119] | Soft-delete/restore author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE rồi PATCH restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trạng thái chuyển đúng; liên kết bài báo giữ toàn vẹn; list/detail phản ánh | `U1`; author test | Untested |  | Priority: P0 |
| [ST_120] | Bài báo và breakdown lĩnh vực của author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET `/author/{id}/articles` và `/author/{id}/areas-breakdown`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; bài và tỷ trọng/count đúng; tổng breakdown nhất quán, không gồm article xóa | `AU1` có nhiều article/area | Untested |  | Priority: P1 |
| [ST_121] | Leaderboard author | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /author/leaderboard` với query hỗ trợ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; thứ hạng/sort và tie handling ổn định; số liệu khớp DB | Có authors với cited/h-index khác nhau | Untested |  | Priority: P1 |
| [ST_122] | Danh sách và chi tiết keyword | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /keywords`, `GET /keywords/{K1.id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; list/detail đúng; không trả keyword deleted trong list active | Có `K1` và keyword deleted | Untested |  | Priority: P1 |
| [ST_123] | Bài báo theo keyword | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /keywords/{K1.id}/articles`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ bài active liên kết với `K1`; pagination nếu có đúng | `K1` có article active/deleted | Untested |  | Priority: P1 |
| [ST_124] | Tạo keyword hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /keywords` với display_name hợp lệ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; tên trim; không tạo trùng theo rule chuẩn hóa | `U1`; tên mới | Untested |  | Priority: P0 |
| [ST_125] | Validate keyword body | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Tên trống, 1 ký tự, >255, ký tự đặc biệt, HTML<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `KEYWORD_INVALID_BODY`; DB không đổi | `U1` | Untested |  | Priority: P1 |
| [ST_126] | Cập nhật keyword và xử lý trùng | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. PUT tên mới hợp lệ; sau đó tên đã tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần đầu 200; trùng bị 409/400 `KEYWORD_DUPLICATE`; liên kết article không mất | `U1`; hai keyword | Untested |  | Priority: P0 |
| [ST_127] | Soft-delete/restore keyword | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. DELETE rồi PATCH restore; lặp thao tác<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trạng thái/code `KEYWORD_DELETED`/`KEYWORD_RESTORED` đúng; repeated state nhận lỗi phù hợp; link không mồ côi | `U1`; keyword test | Untested |  | Priority: P0 |
| [ST_128] | Keyword ID sai/không tồn tại | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi detail/update/delete với `abc`, 0, ID không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | 400 `KEYWORD_INVALID_ID` hoặc 404 `KEYWORD_NOT_FOUND`; không 500 | Không | Untested |  | Priority: P1 |
| [ST_129] | Danh sách/chi tiết subject area | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET `/subject-areas` có pagination và `/subject-areas/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; pagination, lọc active và detail đúng | Có `SA1` và bản ghi deleted | Untested |  | Priority: P1 |
| [ST_130] | CRUD/restore subject area | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST, PUT, DELETE, PATCH restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Status/code đúng; dữ liệu chuyển trạng thái đúng; không trùng tên; quan hệ category được giữ | `U1`; tên mới | Untested |  | Priority: P0 |
| [ST_131] | Validate subject area | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. ID sai; tên thiếu/sai/duplicate; pagination ngoài biên<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400/409 phù hợp; DB không đổi | `U1` | Untested |  | Priority: P1 |
| [ST_132] | Thống kê subject area | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /subject-areas/{SA1.id}/statistics`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; count/ranking/trend khớp dữ liệu nguồn, bỏ soft-delete | Có `SA1` với journal/article | Untested |  | Priority: P1 |
| [ST_133] | Danh sách/chi tiết subject category | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET list có pagination và detail<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; category gắn đúng area; không trả deleted | Có `SC1` và bản ghi deleted | Untested |  | Priority: P1 |
| [ST_134] | CRUD/restore subject category | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST category hợp lệ, PUT, DELETE, PATCH restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Thành công đúng status; FK area đúng; không trùng; quan hệ project/journal giữ toàn vẹn | `U1`; `SA1` | Untested |  | Priority: P0 |
| [ST_135] | Validate subject category | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. ID/category name/area ID/pagination sai hoặc duplicate<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400/404/409 phù hợp; không tạo/cập nhật một phần | `U1` | Untested |  | Priority: P1 |
| [ST_136] | Thống kê subject category | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /subject-categories/{SC1.id}/statistics`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; count/trend đúng category và bỏ dữ liệu xóa | Có `SC1` với dữ liệu | Untested |  | Priority: P1 |
| [ST_137] | Danh sách/chi tiết topic | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET `/topics` và `/topics/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; list active và detail đúng | Có `TP1`, topic deleted | Untested |  | Priority: P1 |
| [ST_138] | CRUD/restore topic | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST, PUT, DELETE, PATCH restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Dữ liệu và state đúng; duplicate bị chặn; liên kết sub-topic/article không mất | `U1`; topic mới | Untested |  | Priority: P0 |
| [ST_139] | Validate topic ID và trạng thái | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. ID chữ/0/không tồn tại; delete lại; restore active<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400/404 hoặc state error phù hợp; không 500 | `U1` | Untested |  | Priority: P1 |
| [ST_140] | Lấy article theo topic | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /topics/{TP1.id}/articles`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; trả đủ bài liên quan không trùng, không gồm bài deleted; count/pagination đúng | `TP1` là primary/sub-topic của nhiều bài | Untested |  | Priority: P1 |

## Module7_ANALYTICS

### Module Information

| Field | Value |
| --- | --- |
| Module Code | ANALYTICS |
| Test requirement | Kiểm tra catalog, tìm kiếm, dữ liệu vùng, xu hướng, dashboard, cache và độ chính xác tổng hợp. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 25 | 0 | 25 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_141] | Catalog subject areas | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /catalog/subject-areas` với query hỗ trợ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; schema catalog, thứ tự và dữ liệu active đúng | Có catalog data | Untested |  | Priority: P1 |
| [ST_142] | Catalog subject categories và lọc theo area | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /catalog/subject-categories` với filter area<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ category đúng area; không trùng | Có nhiều area/category | Untested |  | Priority: P1 |
| [ST_143] | Catalog journal rankings | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /catalog/journals/{J1.id}/rankings`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; quartile/rank/year/category đúng; journal sai nhận 404/4xx | `J1` có ranking theo năm/category | Untested |  | Priority: P1 |
| [ST_144] | Catalog volumes | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /catalog/volumes` với filter/pagination<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; filter và pagination đúng; không có deleted | Có volumes nhiều journal/year | Untested |  | Priority: P1 |
| [ST_145] | Catalog issues | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /catalog/issues` với volume/journal filter hỗ trợ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; quan hệ volume/journal đúng; không có deleted | Có issues nhiều volume | Untested |  | Priority: P1 |
| [ST_146] | Search keyword hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /search/machine%20learning`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; nhóm kết quả đúng, không trả soft-delete, dữ liệu được escape an toàn | Có dữ liệu “machine learning” ở nhiều entity | Untested |  | Priority: P1 |
| [ST_147] | Validate search keyword | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi keyword rỗng/space, quá ngắn hoặc payload URL bất thường theo validator<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với lỗi validation; không 500 | Không | Untested |  | Priority: P1 |
| [ST_148] | Search chống SQL injection/XSS | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Search bằng chuỗi `' OR 1=1 --` và `<script>`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Không mở rộng trái phép kết quả, không lỗi SQL, không phản chiếu script chưa escape, DB không đổi | Có dữ liệu test | Untested |  | Priority: P0 |
| [ST_149] | Search Unicode và ký tự có dấu | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Search từ khóa viết hoa/thường và có dấu<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; hành vi case/diacritic đúng thiết kế, kết quả ổn định | Có title/author tiếng Việt | Untested |  | Priority: P1 |
| [ST_150] | Thống kê quốc gia có phân trang | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /zones/countries/stats?page=1&limit=10`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; article_count, totalPages và thứ tự đúng; tổng khớp DB | Có dữ liệu zone/article | Untested |  | Priority: P1 |
| [ST_151] | Thống kê region toàn cầu/theo quốc gia | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET `/zones/regions/stats`, sau đó `?country_code=VN`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; filter đúng; country code không tồn tại nhận 404 | Có VN và region | Untested |  | Priority: P1 |
| [ST_152] | Region theo country path | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /zones/countries/VN/regions/stats`, rồi mã rỗng/sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Thành công trả country + regions/count đúng; mã sai nhận 400/404; không 500 | Có mã `VN` | Untested |  | Priority: P1 |
| [ST_153] | Publication trends hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /statistics/publication-trends?fromYear=2020&toYear=2025`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; series theo năm, zero-fill nếu contract yêu cầu, tổng khớp article active | `U1`; dữ liệu nhiều năm | Untested |  | Priority: P1 |
| [ST_154] | Validate publication trend range | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. from/to không nguyên, ≤0, hoặc fromYear > toYear<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với `INVALID_FROM_YEAR`, `INVALID_TO_YEAR` hoặc `INVALID_YEAR_RANGE` | `U1` | Untested |  | Priority: P1 |
| [ST_155] | Trending keywords dashboard | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /dashboard/trending-keywords?limit=10&fromYear=2020&toYear=2025&metric=articleCount`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; tối đa 10 keyword, metric/sort đúng, không trùng | `U1`; dữ liệu keyword | Untested |  | Priority: P1 |
| [ST_156] | Trending keywords theo project | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Thêm `projectId=P1.id`; sau đó dùng `P2.id`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | `P1` chỉ trả keyword trong scope; project không có quyền bị 403/404; không lộ dữ liệu | `U1`; `P1` có watched keywords | Untested |  | Priority: P1 |
| [ST_157] | Validate trending keywords query | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. projectId/limit/year sai; from > to; metric ngoài enum<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với code tương ứng; không chạy truy vấn nặng | `U1` | Untested |  | Priority: P1 |
| [ST_158] | Author leaderboard ổn định khi đồng hạng | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi leaderboard lặp lại và qua nhiều page<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Tie-break ổn định; không mất/trùng author giữa page | Có hai author cùng chỉ số | Untested |  | Priority: P1 |
| [ST_159] | Dữ liệu mềm bị xóa không góp vào analytics | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi search, zone, trends, dashboard trước/sau delete/restore<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Sau delete các count giảm đúng một lần; restore tăng đúng một lần; không double count | Có snapshot count; soft-delete article/journal liên quan | Untested |  | Priority: P1 |
| [ST_160] | API public không nhận diện nhầm route động | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi `/author/leaderboard`, `/keywords/{id}/articles`, các catalog route<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Route tĩnh/chi tiết được dispatch đúng controller; không bị route `/:id` bắt nhầm | Có leaderboard và author ID | Untested |  | Priority: P1 |
| [ST_161] | Public coin packages | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /coin-packages`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ package được phép bán, giá/currency/coin đúng; không lộ field quản trị | Có package active và inactive | Untested |  | Priority: P1 |
| [ST_162] | Cache đọc danh mục/article | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi cùng request hai lần, sau đó cập nhật entity và gọi lại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần sau có thể dùng cache nhưng response tương đương; mutation làm invalidation đúng, không trả dữ liệu stale quá TTL | Redis hoạt động; có endpoint được cache | Untested |  | Priority: P1 |
| [ST_163] | Redis unavailable | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi endpoint đọc có cache và một mutation<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Hệ thống fallback DB hoặc trả lỗi được kiểm soát theo thiết kế; không crash process; mutation không mất dữ liệu vì lỗi cache | Tạm ngắt Redis trong môi trường test | Untested |  | Priority: P1 |
| [ST_164] | Chuẩn schema/phân trang giữa các danh sách | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi các list với page/limit giống nhau<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | `data` và `pagination` có kiểu nhất quán theo contract từng API; page ngoài tổng trả mảng rỗng, không 500 | Có dữ liệu cho journals/authors/topics/categories | Untested |  | Priority: P1 |
| [ST_165] | Độ chính xác dữ liệu tổng hợp lớn | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Chạy search/zone/trends/trending/leaderboard<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mọi tổng, nhóm, tỷ lệ và thứ hạng khớp expected dataset; không sai do join nhân bản hoặc BigInt/string conversion | Nạp dataset chuẩn biết trước kết quả | Untested |  | Priority: P2 |

## Module8_COINPAY

### Module Information

| Field | Value |
| --- | --- |
| Module Code | COINPAY |
| Test requirement | Kiểm tra ví, ledger, gói coin, VNPay/MoMo, callback idempotency và thao tác quản trị. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 25 | 0 | 25 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_166] | Lấy ví cá nhân | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /wallet/me`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; wallet đúng user; `balance`, `total_deposit`, `total_spent` là số và khớp sổ giao dịch | `U1`, `W1` | Untested |  | Priority: P0 |
| [ST_167] | Lịch sử giao dịch ví | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /wallet/me/transactions?page=1&limit=20&type=spend`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ transaction của `U1`, filter/pagination đúng, balance_before/after liên tục | `U1` có deposit/spend/refund | Untested |  | Priority: P1 |
| [ST_168] | Validate query lịch sử ví | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. type ngoài enum; page/limit biên nếu service hỗ trợ<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 cho enum sai; không trả dữ liệu user khác | `U1` | Untested |  | Priority: P1 |
| [ST_169] | Tiêu coin thành công | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /wallet/spend` amount nguyên dương và description<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; balance giảm đúng amount; total_spent tăng; tạo đúng một transaction `spend` | `W1` đủ số dư | Untested |  | Priority: P0 |
| [ST_170] | Chặn tiêu coin không đủ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Spend lớn hơn balance<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 409; balance/tổng/transaction không đổi | Ví có số dư nhỏ | Untested |  | Priority: P0 |
| [ST_171] | Validate amount/description khi spend | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. amount 0, âm, thập phân, chữ; description không phải string<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 với code phù hợp; ví không đổi | `U1` | Untested |  | Priority: P0 |
| [ST_172] | Đồng thời tiêu coin không làm âm ví | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi song song hai request<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Chỉ tối đa một request thành công; balance cuối 20, không âm; chỉ một transaction commit | Ví balance 100; hai request spend 80 đồng thời | Untested |  | Priority: P0 |
| [ST_173] | Chặn non-admin quản lý coin package | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi GET admin list, POST, PUT, DELETE package<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 403; package không đổi | `U1` | Untested |  | Priority: P0 |
| [ST_174] | Admin tạo coin package hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST name, coin_amount >0, bonus ≥0, price >0, currency, is_active<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201; chuẩn hóa camel/snake case và uppercase currency; dữ liệu số đúng | `A1` | Untested |  | Priority: P0 |
| [ST_175] | Validate tạo coin package | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Tên trống; coin 0/thập phân; bonus âm; price 0; currency trống; is_active sai kiểu<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Mỗi request HTTP 400 với code cụ thể; không tạo package | `A1` | Untested |  | Priority: P1 |
| [ST_176] | Admin cập nhật coin package | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. PUT một/vài field hợp lệ, gồm alias camelCase<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ field gửi lên đổi; currency chuẩn hóa; public list phản ánh trạng thái | `A1`; `CP1` | Untested |  | Priority: P0 |
| [ST_177] | Validate update/package ID | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. UUID sai; body không field hợp lệ; field số/boolean sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400 `INVALID_PACKAGE_ID`, `NO_UPDATE_FIELDS` hoặc code field; DB không đổi | `A1` | Untested |  | Priority: P1 |
| [ST_178] | Admin vô hiệu hóa package | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `DELETE /admin/coin-packages/{id}`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; package thành inactive/soft-delete; biến mất khỏi public list nhưng còn lịch sử payment | `A1`; package active | Untested |  | Priority: P0 |
| [ST_179] | Tạo payment hợp lệ | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `POST /payments/create` với packageId và `vnpay`, sau đó với `momo`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 201/200 theo controller; transaction `pending` đúng amount/coin; trả payment URL/provider data; chưa cộng coin | `U1`; `CP1` active | Untested |  | Priority: P0 |
| [ST_180] | Validate tạo payment | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. package UUID sai/không tồn tại/inactive; payment method ngoài enum<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 400/404 phù hợp; không tạo pending payment rác | `U1` | Untested |  | Priority: P1 |
| [ST_181] | Danh sách payment cá nhân | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /payments/me?status=success&paymentMethod=vnpay&page=1&limit=10`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; chỉ payment của `U1`, filter/pagination đúng; không lộ payment user khác | `U1` có nhiều status/method | Untested |  | Priority: P1 |
| [ST_182] | Chi tiết payment và kiểm soát sở hữu | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `U1` GET payment của mình rồi payment `U2`; thử UUID sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Payment mình trả 200; payment người khác 403/404; UUID sai 400 | Có payment của `U1` và `U2` | Untested |  | Priority: P0 |
| [ST_183] | VNPay return thành công | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /payments/vnpay/return?...`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Payment chuyển `success`; cộng đúng base+bonus coin một lần; lưu provider code/note; response/redirect đúng | Có pending payment; params/signature hợp lệ | Untested |  | Priority: P0 |
| [ST_184] | VNPay IPN thành công và idempotent | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi cùng IPN hợp lệ qua POST rồi lặp lại/GET<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Provider nhận acknowledgment đúng; payment success và ví chỉ được cộng một lần dù callback lặp | Có pending payment | Untested |  | Priority: P0 |
| [ST_185] | Từ chối VNPay signature/amount sai | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi callback chữ ký sai, transaction/amount sai<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Callback bị từ chối/failed theo contract; không cộng coin; lưu trạng thái/note an toàn | Có pending payment | Untested |  | Priority: P0 |
| [ST_186] | MoMo IPN thành công và idempotent | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi IPN hợp lệ hai lần<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Payment success; coin cộng đúng một lần; provider transaction code lưu đúng | Có pending MoMo payment | Untested |  | Priority: P0 |
| [ST_187] | Từ chối MoMo signature/result lỗi | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi signature sai hoặc resultCode thất bại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Không cộng coin; payment failed/pending theo contract; acknowledgment không làm provider retry vô hạn ngoài dự kiến | Có pending payment | Untested |  | Priority: P0 |
| [ST_188] | Callback đồng thời từ return và IPN | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi return và IPN hợp lệ gần như đồng thời<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Transaction/locking đảm bảo chỉ một lần credit; payment cuối success; một deposit ledger entry | Một pending VNPay payment | Untested |  | Priority: P0 |
| [ST_189] | Admin xem payments/wallet transactions | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET `/admin/payments` và `/admin/wallet-transactions` với filter/pagination<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | HTTP 200; dữ liệu toàn hệ thống đúng filter; pagination đúng; non-admin bị 403 | `A1`; có nhiều user/status/type | Untested |  | Priority: P1 |
| [ST_190] | Admin điều chỉnh ví | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. POST `/admin/wallets/{userId}/adjust` với số dương, số âm hợp lệ; thử 0, UUID sai và trừ quá số dư<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Cộng/trừ hợp lệ cập nhật balance và tạo `admin_adjust`; 0/UUID sai nhận 400; thiếu số dư nhận 409; audit trail đầy đủ | `A1`; user có ví | Untested |  | Priority: P0 |

## Module9_SYSTEM

### Module Information

| Field | Value |
| --- | --- |
| Module Code | SYSTEM |
| Test requirement | Kiểm tra báo cáo admin, CSV, atomicity, lỗi hệ thống, hiệu năng, đồng thời và phục hồi. |
| Tester |  |

### Execution Summary

| Pass | Fail | Untested | N/A | Number of Test cases |
| --- | --- | --- | --- | --- |
| 0 | 0 | 10 | 0 | 10 |

### Test Cases

| ID | Test Case Description | Test Case Procedure | Expected Output | Inter-test case Dependence | Result | Test date | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ST_191] | Bảo vệ toàn bộ admin dashboard | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Với mỗi endpoint dashboard admin, gọi không token, token `U1`, token `A1`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Lần lượt 401, 403 và 200; không endpoint admin nào bỏ sót middleware | `U1`, `A1` | Untested |  | Priority: P0 |
| [ST_192] | Admin dashboard summary/publication trends | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET `/admin/dashboard/summary` và `/admin/dashboard/publication-trends?year=2025&limit=5`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Total/growth/trend khớp DB, đủ năm, kiểu số đúng; query biên không làm 500 | `A1`; dataset chuẩn | Untested |  | Priority: P1 |
| [ST_193] | Volume/issue status và CSV export | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. GET status, sau đó `/admin/dashboard/volume-issue-status/export` với cùng filter<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | JSON và CSV có cùng tập dữ liệu/count; CSV header, encoding UTF-8, escaping dấu phẩy/newline/formula đúng; content type/filename đúng | `A1`; dữ liệu nhiều trạng thái | Untested |  | Priority: P1 |
| [ST_194] | Recent activities | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /admin/dashboard/recent-activities`<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Sự kiện mới nhất đúng thứ tự thời gian; actor/action/entity/metadata đúng; không lộ token, password hoặc secret | `A1`; đã thực hiện login/create/update/delete | Untested |  | Priority: P1 |
| [ST_195] | Journal repository summary | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. `GET /admin/repositories/journals/{J1.id}/summary`; thử ID sai/không tồn tại<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Thành công trả tổng phân cấp khớp DB; ID sai 400, không tồn tại 404; không double count | `A1`; `J1` có volume/issue/article | Untested |  | Priority: P1 |
| [ST_196] | Atomicity khi DB lỗi giữa transaction | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gây lỗi sau khi insert/update đầu tiên nhưng trước commit<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Toàn bộ transaction rollback; không có bản ghi/link/số dư/token-used dở dang; connection được release | Có khả năng fault injection ở bước tạo article/payment/reset password | Untested |  | Priority: P0 |
| [ST_197] | Chuẩn hóa lỗi 404, JSON lỗi và payload lớn | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gọi route không tồn tại; gửi JSON malformed; gửi body vượt giới hạn hợp lý<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Trả 4xx có kiểm soát, không HTML stack trace/5xx crash; process tiếp tục phục vụ request sau | Server chạy | Untested |  | Priority: P1 |
| [ST_198] | Hiệu năng tải đọc hỗn hợp | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Trong 5 phút chạy tải đồng thời list/search/dashboard/detail theo SLA dự án<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Tỷ lệ lỗi và p95 đáp ứng SLA đã thống nhất; pool DB/Redis không cạn; memory/CPU ổn định, không tăng rò rỉ | Dataset gần production; monitoring bật | Untested |  | Priority: P1 |
| [ST_199] | Tính nhất quán dưới mutation đồng thời | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Gửi đồng thời create duplicate, delete/restore, update role hoặc update package<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Unique/state/authorization được giữ; không duplicate/mất update ngoài contract; response xung đột là 4xx, không corrupt DB | Cùng một journal/keyword/member/package | Untested |  | Priority: P0 |
| [ST_200] | Khởi động, graceful failure và phục hồi phụ thuộc | 1. Chuẩn bị dữ liệu và quyền truy cập theo cột Inter-test case Dependence.<br>2. Start với cấu hình đúng; thử thiếu JWT/DB; ngắt DB ngắn trong traffic rồi khôi phục<br>3. Ghi nhận HTTP response, kiểm tra dữ liệu DB/cache/log và đối chiếu Expected Output. | Cấu hình đúng khởi động và phục vụ; cấu hình/DB lỗi được log rõ mà không lộ secret; request lỗi có kiểm soát; sau khi phụ thuộc phục hồi hệ thống hoạt động lại, không cần sửa dữ liệu thủ công | Có thể restart app/DB/Redis | Untested |  | Priority: P0 |

## Test Report

| Field | Value |
| --- | --- |
| Project Name | Scientific Journal Publication Trend Tracking System |
| Creator | Project Team |
| Project Code | SJS |
| Reviewer/Approver |  |
| Document Code | SJS_TEST_REPORT_v1.0 |
| Issue Date | 2026-07-23 |
| Notes | Initial system test specification; execution results have not been recorded. |

### Module Results

| No | Module code | Pass | Fail | Untested | N/A | Number of test cases |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH | 0 | 0 | 25 | 0 | 25 |
| 2 | USER | 0 | 0 | 15 | 0 | 15 |
| 3 | PROJECT | 0 | 0 | 25 | 0 | 25 |
| 4 | ARTICLE | 0 | 0 | 15 | 0 | 15 |
| 5 | PUBLICATION | 0 | 0 | 30 | 0 | 30 |
| 6 | TAXONOMY | 0 | 0 | 30 | 0 | 30 |
| 7 | ANALYTICS | 0 | 0 | 25 | 0 | 25 |
| 8 | COINPAY | 0 | 0 | 25 | 0 | 25 |
| 9 | SYSTEM | 0 | 0 | 10 | 0 | 10 |
|  | **Sub total** | **0** | **0** | **200** | **0** | **200** |

### Coverage

| Metric | Value | Unit |
| --- | --- | --- |
| Test coverage | 0 | % executed |
| Test successful coverage | 0 | % passed |
| Test case specification coverage | 200/200 | cases documented |

## Execution Notes

- `Untested` nghĩa là test case mới được đặc tả, chưa được thực thi trong môi trường kiểm thử.
- Khi chạy test, cập nhật đồng thời Result, Test date, Note và Execution Summary của module.
- Không đổi Expected Output để làm test pass; mọi sai khác giữa hệ thống và expected result phải được ghi nhận thành defect.

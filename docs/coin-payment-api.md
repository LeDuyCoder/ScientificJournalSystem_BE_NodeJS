# Coin & Payment API Guide

Tài liệu này dành cho phía UI khi tích hợp hệ thống ví coin, gói coin và thanh toán VNPay/MoMo.

Base URL hiện tại:

```txt
/api/v1
```

Với các API cần đăng nhập, gửi header:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 1. Luồng UI Nạp Coin

1. User mở trang nạp coin.
2. UI gọi `GET /api/v1/coin-packages` để lấy danh sách gói đang bán.
3. User chọn một gói coin.
4. UI gọi `POST /api/v1/payments/create`.
5. Backend trả về `paymentUrl`.
6. UI redirect user sang `paymentUrl`.
7. VNPay thanh toán xong sẽ redirect user về `GET /api/v1/payments/vnpay/return`.
8. UI hiển thị trạng thái đang xác nhận.
9. UI gọi lại:

```http
GET /api/v1/payments/{transactionId}
GET /api/v1/wallet/me
```

10. Nếu `payment_status = success`, cập nhật số dư ví.

> Lưu ý: Coin chỉ được cộng khi IPN/Webhook xác nhận thành công. Return URL chỉ là bước user quay lại hệ thống.

## 2. Wallet API

### 2.1. Xem Số Dư Ví

```http
GET /api/v1/wallet/me
Authorization: Bearer <user_token>
```

Response:

```json
{
  "success": true,
  "code": "GET_WALLET_SUCCESS",
  "message": "Lay thong tin vi coin thanh cong",
  "data": {
    "wallet_id": "uuid",
    "user_id": "uuid",
    "balance": 550,
    "total_deposit": 550,
    "total_spent": 0,
    "created_at": "2026-07-08T09:25:13.020Z",
    "updated_at": "2026-07-08T09:25:13.020Z"
  }
}
```

UI nên dùng:

| Field | Ý nghĩa |
|---|---|
| `balance` | Số coin hiện có |
| `total_deposit` | Tổng coin đã nạp |
| `total_spent` | Tổng coin đã tiêu |

### 2.2. Lịch Sử Giao Dịch Coin

```http
GET /api/v1/wallet/me/transactions?page=1&limit=50&type=deposit
Authorization: Bearer <user_token>
```

Query params:

| Param | Bắt buộc | Mô tả |
|---|---:|---|
| `page` | Không | Trang hiện tại, mặc định `1` |
| `limit` | Không | Số bản ghi mỗi trang, mặc định `50` |
| `type` | Không | `deposit`, `spend`, `refund`, `admin_adjust` |

Response:

```json
{
  "success": true,
  "code": "GET_WALLET_TRANSACTIONS_SUCCESS",
  "data": [
    {
      "wallet_transaction_id": "uuid",
      "wallet_id": "uuid",
      "user_id": "uuid",
      "type": "deposit",
      "amount": 550,
      "balance_before": 0,
      "balance_after": 550,
      "payment_transaction_id": "uuid",
      "description": "Nap 550 coin tu giao dich ...",
      "created_at": "2026-07-08T09:25:13.020Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

Hiển thị UI:

| Type | Gợi ý text |
|---|---|
| `deposit` | Nạp coin |
| `spend` | Tiêu coin |
| `refund` | Hoàn coin |
| `admin_adjust` | Điều chỉnh thủ công |

### 2.3. Tiêu Coin

```http
POST /api/v1/wallet/spend
Authorization: Bearer <user_token>
Content-Type: application/json
```

Request:

```json
{
  "amount": 100,
  "description": "Mua khóa học Java"
}
```

Response thành công:

```json
{
  "success": true,
  "code": "SPEND_COINS_SUCCESS",
  "message": "Tieu coin thanh cong",
  "data": {
    "wallet": {
      "balance": 450,
      "total_deposit": 550,
      "total_spent": 100
    },
    "transaction": {
      "type": "spend",
      "amount": -100,
      "balance_before": 550,
      "balance_after": 450
    }
  }
}
```

Lỗi thường gặp:

| HTTP | Code | Ý nghĩa |
|---:|---|---|
| 400 | `INVALID_COIN_AMOUNT` | Số coin không hợp lệ |
| 409 | `INSUFFICIENT_BALANCE` | Không đủ coin |

## 3. Coin Package API

### 3.1. User Lấy Danh Sách Gói Coin

```http
GET /api/v1/coin-packages
```

Response:

```json
{
  "success": true,
  "code": "GET_COIN_PACKAGES_SUCCESS",
  "data": [
    {
      "package_id": "uuid",
      "name": "Gói 500 coin",
      "coin_amount": 500,
      "bonus_coin": 50,
      "total_coin": 550,
      "price": 50000,
      "currency": "VND",
      "is_active": true,
      "created_at": "2026-07-08T09:00:00.000Z",
      "updated_at": "2026-07-08T09:00:00.000Z"
    }
  ]
}
```

UI nên hiển thị:

| Field | Ý nghĩa |
|---|---|
| `name` | Tên gói |
| `coin_amount` | Coin gốc |
| `bonus_coin` | Coin khuyến mãi |
| `total_coin` | Tổng coin nhận |
| `price` | Giá tiền |
| `currency` | Đơn vị tiền |

## 4. Payment API Cho User

### 4.1. Tạo Giao Dịch Thanh Toán

```http
POST /api/v1/payments/create
Authorization: Bearer <user_token>
Content-Type: application/json
```

Request:

```json
{
  "packageId": "d256ab4d-8061-4726-adba-f911020953f7",
  "paymentMethod": "vnpay"
}
```

`paymentMethod` hỗ trợ:

```txt
vnpay, momo, bank_transfer, stripe, paypal
```

Hiện tại flow VNPay đã được triển khai.

Response:

```json
{
  "success": true,
  "code": "CREATE_PAYMENT_SUCCESS",
  "message": "Tao giao dich thanh toan thanh cong",
  "data": {
    "transactionId": "4406eee9-4926-4d11-9f47-6fa9c5385488",
    "transaction_id": "4406eee9-4926-4d11-9f47-6fa9c5385488",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "payment": {
      "transaction_id": "4406eee9-4926-4d11-9f47-6fa9c5385488",
      "user_id": "uuid",
      "package_id": "uuid",
      "amount": 50000,
      "currency": "VND",
      "coin_amount": 500,
      "bonus_coin": 50,
      "total_coin": 550,
      "payment_method": "vnpay",
      "payment_status": "pending",
      "provider_transaction_code": null,
      "note": null,
      "created_at": "2026-07-08T09:25:13.020Z",
      "paid_at": null
    }
  }
}
```

UI xử lý:

```js
window.location.href = response.data.paymentUrl;
```

Lỗi thường gặp:

| HTTP | Code | Ý nghĩa |
|---:|---|---|
| 400 | `INVALID_PACKAGE_ID` | Package ID sai định dạng |
| 400 | `INVALID_PAYMENT_METHOD` | Phương thức thanh toán không hợp lệ |
| 404 | `COIN_PACKAGE_NOT_FOUND` | Gói coin không tồn tại hoặc đã bị tắt |
| 500 | `VNPAY_CONFIG_MISSING` | Backend thiếu cấu hình VNPay |

### 4.2. Xem Trạng Thái Giao Dịch

```http
GET /api/v1/payments/{transactionId}
Authorization: Bearer <user_token>
```

Response:

```json
{
  "success": true,
  "code": "GET_PAYMENT_SUCCESS",
  "data": {
    "transaction_id": "uuid",
    "user_id": "uuid",
    "package_id": "uuid",
    "package_name": "Gói 500 coin",
    "amount": 50000,
    "currency": "VND",
    "coin_amount": 500,
    "bonus_coin": 50,
    "total_coin": 550,
    "payment_method": "vnpay",
    "payment_status": "success",
    "provider_transaction_code": "14123456",
    "note": "VNPay IPN confirmed payment success",
    "created_at": "2026-07-08T09:25:13.020Z",
    "paid_at": "2026-07-08T09:30:00.000Z"
  }
}
```

Payment status:

| Status | Ý nghĩa UI |
|---|---|
| `pending` | Đang chờ thanh toán/xác nhận |
| `success` | Thanh toán thành công |
| `failed` | Thanh toán thất bại |
| `cancelled` | Đã hủy |
| `refunded` | Đã hoàn tiền |

### 4.3. Lịch Sử Nạp Tiền Của Tôi

```http
GET /api/v1/payments/me?page=1&limit=50&status=success
Authorization: Bearer <user_token>
```

Query params:

| Param | Bắt buộc | Mô tả |
|---|---:|---|
| `page` | Không | Trang hiện tại |
| `limit` | Không | Số bản ghi mỗi trang |
| `status` | Không | `pending`, `success`, `failed`, `cancelled`, `refunded` |

Response:

```json
{
  "success": true,
  "code": "GET_MY_PAYMENTS_SUCCESS",
  "data": [
    {
      "transaction_id": "uuid",
      "package_name": "Gói 500 coin",
      "amount": 50000,
      "currency": "VND",
      "total_coin": 550,
      "payment_method": "vnpay",
      "payment_status": "success",
      "created_at": "2026-07-08T09:25:13.020Z",
      "paid_at": "2026-07-08T09:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

## 5. Payment Callback API

Các API này không cần UI gọi trong production. Cổng thanh toán sẽ gọi về backend.

### 5.1. VNPay Return URL

```http
GET /api/v1/payments/vnpay/return?...vnpay_query
```

Mục đích:

- VNPay redirect user về sau khi thanh toán.
- Backend kiểm tra chữ ký và trả thông tin giao dịch.
- Chưa cộng coin tại bước này.

Response:

```json
{
  "success": true,
  "code": "VNPAY_RETURN_RECEIVED",
  "message": "Da nhan ket qua thanh toan VNPay, vui long cho IPN xac nhan",
  "data": {
    "isValidSignature": true,
    "transactionId": "uuid",
    "gatewayResponseCode": "00",
    "gatewayTransactionStatus": "00",
    "payment": {
      "payment_status": "pending"
    }
  }
}
```

### 5.2. VNPay IPN

```http
GET /api/v1/payments/vnpay/ipn?...vnpay_query
POST /api/v1/payments/vnpay/ipn
```

Mục đích:

- Xác thực chữ ký VNPay.
- Kiểm tra số tiền.
- Cập nhật `payment_status = success`.
- Cộng coin vào ví.
- Tạo `wallet_transaction`.
- Idempotent: gọi lại không cộng coin trùng.

Response thành công:

```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

> Khi test local, vì VNPay không gọi được `localhost`, có thể copy URL return và đổi `/return` thành `/ipn` để giả lập IPN.

### 5.3. MoMo IPN

```http
POST /api/v1/payments/momo/ipn
```

Request mẫu:

```json
{
  "orderId": "uuid",
  "requestId": "uuid",
  "amount": 50000,
  "resultCode": 0,
  "transId": "momo-transaction-code",
  "signature": "signature"
}
```

Response:

```json
{
  "success": true,
  "code": "CONFIRMED_SUCCESS_PAYMENT",
  "message": "Payment success confirmed"
}
```

## 6. Admin API

Tất cả Admin API cần:

```http
Authorization: Bearer <admin_token>
```

Role trong token phải là:

```txt
ADMINISTRATOR
```

### 6.1. Admin Lấy Danh Sách Gói Coin

```http
GET /api/v1/admin/coin-packages?page=1&limit=50&isActive=true
```

### 6.2. Admin Tạo Gói Coin

```http
POST /api/v1/admin/coin-packages
Content-Type: application/json
```

Request:

```json
{
  "name": "Gói 500 coin",
  "coin_amount": 500,
  "bonus_coin": 50,
  "price": 50000,
  "currency": "VND",
  "is_active": true
}
```

### 6.3. Admin Cập Nhật Gói Coin

```http
PUT /api/v1/admin/coin-packages/{packageId}
Content-Type: application/json
```

Request:

```json
{
  "name": "Gói 500 coin khuyến mãi",
  "bonus_coin": 100,
  "price": 50000,
  "is_active": true
}
```

### 6.4. Admin Vô Hiệu Hóa Gói Coin

```http
DELETE /api/v1/admin/coin-packages/{packageId}
```

API này không xóa cứng, chỉ set:

```txt
is_active = false
```

### 6.5. Admin Danh Sách Giao Dịch Thanh Toán

```http
GET /api/v1/admin/payments?page=1&limit=50&status=success&paymentMethod=vnpay&userId=uuid
```

Query params:

| Param | Bắt buộc | Mô tả |
|---|---:|---|
| `page` | Không | Trang |
| `limit` | Không | Số bản ghi |
| `status` | Không | Trạng thái thanh toán |
| `paymentMethod` | Không | `vnpay`, `momo`, ... |
| `userId` | Không | Lọc theo user |

### 6.6. Admin Danh Sách Lịch Sử Coin

```http
GET /api/v1/admin/wallet-transactions?page=1&limit=50&type=deposit&userId=uuid
```

### 6.7. Admin Cộng/Trừ Coin Thủ Công

```http
POST /api/v1/admin/wallets/{userId}/adjust
Content-Type: application/json
```

Cộng coin:

```json
{
  "amount": 500,
  "description": "Tặng coin khuyến mãi"
}
```

Trừ coin:

```json
{
  "amount": -100,
  "description": "Điều chỉnh sai lệch"
}
```

Lỗi thường gặp:

| HTTP | Code | Ý nghĩa |
|---:|---|---|
| 400 | `INVALID_ADJUST_AMOUNT` | Amount không hợp lệ |
| 404 | `USER_NOT_FOUND` | Không tìm thấy user |
| 409 | `INSUFFICIENT_BALANCE` | Trừ coin vượt quá số dư |

## 7. Gợi Ý Màn Hình UI

### User

| Màn hình | API nên gọi |
|---|---|
| Ví của tôi | `GET /wallet/me` |
| Lịch sử coin | `GET /wallet/me/transactions` |
| Nạp coin | `GET /coin-packages` |
| Thanh toán | `POST /payments/create` |
| Kết quả thanh toán | `GET /payments/{transactionId}` và `GET /wallet/me` |
| Lịch sử nạp tiền | `GET /payments/me` |

### Admin

| Màn hình | API nên gọi |
|---|---|
| Quản lý gói coin | `GET/POST/PUT/DELETE /admin/coin-packages` |
| Quản lý thanh toán | `GET /admin/payments` |
| Quản lý biến động coin | `GET /admin/wallet-transactions` |
| Điều chỉnh ví user | `POST /admin/wallets/{userId}/adjust` |

## 8. Cấu Hình Môi Trường VNPay

File `.env` cần có:

```env
BASE_URL=http://localhost:8000

VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_RETURN_URL=http://localhost:8000/api/v1/payments/vnpay/return
VNPAY_IPN_URL=http://localhost:8000/api/v1/payments/vnpay/ipn
```

Khi deploy production, đổi `BASE_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL` sang domain thật.

## 9. Checklist Tích Hợp UI

- [ ] Có token user khi gọi ví/thanh toán.
- [ ] Trang nạp coin gọi `GET /coin-packages`.
- [ ] Khi bấm mua, gọi `POST /payments/create`.
- [ ] Redirect sang `paymentUrl`.
- [ ] Sau khi quay về từ VNPay, lấy `transactionId` và gọi `GET /payments/{transactionId}`.
- [ ] Nếu `payment_status = success`, gọi `GET /wallet/me`.
- [ ] Nếu `pending`, hiển thị đang xác nhận và poll lại vài lần.
- [ ] Nếu `failed`, hiển thị thanh toán thất bại.
- [ ] Admin có màn CRUD gói coin.
- [ ] Admin có màn xem payment và wallet transaction.

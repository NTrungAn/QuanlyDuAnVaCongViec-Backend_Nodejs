# QuanlyDuAnVaCongViec-Backend_Nodejs





# Hướng Dẫn Test API bằng Postman (QuanlyDuAnVaCongViec-Backend_Nodejs)

Tài liệu này hướng dẫn chi tiết cách sử dụng [Postman](https://www.postman.com/) để kiểm thử toàn bộ các API của dự án. 

## 1. Môi trường (Environment Setup)
Trước tiên, bạn nên tạo một Environment trong Postman với các biến số sau để dùng chung cho các request:
- `base_url`: `http://localhost:3000` (hoặc port bạn đang chạy backend)
- `access_token`: Giá trị này sẽ được điền tự động hoặc bạn tự copy sau khi gọi API Đăng nhập.

---

## 2. Các API Xác thực (Authentication)

### 2.1. Đăng ký tài khoản (Register)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/users/register`
- **Body** (raw - JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyen Van A"
  }
  ```
- **Lưu ý**: email phải đúng chuẩn, password tối thiểu 6 ký tự, fullName từ 3-50 ký tự. Mặc định user mới sinh ra sẽ có role là `USER`.

### 2.2. Đăng nhập (Login)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/users/login`
- **Body** (raw - JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Kết quả trả về**: Chú ý copy trường `accessToken` trong JSON response để sử dụng cho các API yêu cầu xác thực bên dưới.

---

## 3. Các API Người dùng (User Management)
**QUAN TRỌNG:** Tất cả các API dưới đây đều yêu cầu Authentication.
Trong Postman, chọn tab **Authorization**, chọn **Type: Bearer Token** và dán `accessToken` (hoặc dùng biến `{{access_token}}`) đã lấy được ở bước Đăng nhập.

### 3.1. Lấy thông tin cá nhân (Get Me)
- **Method**: `GET`
- **URL**: `{{base_url}}/api/users/me`
- **Mô tả**: Lấy thông tin của chính user đang đăng nhập (dựa vào token).
- **Phân quyền**: Yêu cầu Đăng nhập (Role bất kỳ).

### 3.2. Lấy danh sách tất cả Users
- **Method**: `GET`
- **URL**: `{{base_url}}/api/users/`
- **Phân quyền**: Chỉ **ADMIN** mới có quyền gọi API này.

### 3.3. Gán Role cho User (Assign Role)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/users/assign-role`
- **Phân quyền**: Chỉ **ADMIN** mới có quyền.
- **Body** (raw - JSON):
  ```json
  {
    "userId": "6xxxxxxxxxxxxxxx",
    "roleNames": ["ADMIN", "USER", "MANAGER"]
  }
  ```
- **Lưu ý**: `userId` lấy từ ObjectId của MongoDB. `roleNames` là mảng các quyền muốn gán.

### 3.4. Cập nhật thông tin User
- **Method**: `PUT`
- **URL**: `{{base_url}}/api/users/:userId` (Thay `:userId` bằng ID thật của user)
- **Phân quyền**: User chỉ được cập nhật thông tin của mình. **ADMIN** được cập nhật thông tin của tất cả user.
- **Body** (raw - JSON):
  ```json
  {
    "fullName": "Ten Moi Cua Toi",
    "avatarUrl": "/api/users/avatars/new_avatar.png"
  }
  ```
- **Lưu ý**: Các trường trong Body đều không bắt buộc, chỉ gửi lên những trường muốn update.

### 3.5. Tải lên Avatar (Upload Avatar)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/users/:userId/upload-avatar` (Thay `:userId` bằng ID thật)
- **Phân quyền**: User chỉ được upload cho mình. **ADMIN** được upload cho tất cả.
- **Body**: Chọn thẻ **Body** -> Chọn **form-data**
  - Cột Key: nhập `file`
  - Cột Value: (Rê chuột lên dòng key `file`, ở góc phải hiện chữ Text, click đổi thành **File**). Sau đó một nút "Select Files" hiện ra để bạn upload ảnh từ máy tính.
- **Mô tả**: API này sẽ upload ảnh lưu vào server và cập nhật `avatarUrl` cho user. Bạn có thể truy cập ảnh tĩnh tại `{{base_url}}/api/users/avatars/{tên_file_ảnh}`.

### 3.6. Xóa User (Delete User)
- **Method**: `DELETE`
- **URL**: `{{base_url}}/api/users/:userId`
- **Phân quyền**: Chỉ **ADMIN** mới có quyền gọi API này.
- **Lưu ý**: Hệ thống không cho phép xóa user ADMIN cuối cùng.



CHẠY PROJECT


 node src/server   or  npm run dev
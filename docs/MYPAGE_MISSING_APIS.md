# 마이페이지 관련 추가 API 요청

마이페이지 화면에서 필요한 API 중 Swagger에 없는 항목들을 정리했습니다.

## 현재 Swagger에 있는 API
- ✅ `POST /me/report` - 이용자 신고 (이미 구현됨)

## 추가로 필요한 API

### 1. 사용자 프로필 조회
```
GET /me/profile
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "userId": 1,
  "username": "홍길동",
  "email": "user@kangnam.ac.kr",
  "studentId": "20240001",
  "createdAt": "2024-01-01T10:00:00"
}
```
**사용 화면**: MyPageScreen.js, ProfileScreen.js

---

### 2. 프로필 수정
```
PUT /me/profile
인증: 필요 (Bearer Token)
Request Body:
{
  "username": "홍길동"  // 선택적
}
응답: 200 OK
{
  "message": "프로필이 수정되었습니다."
}
```
**사용 화면**: ProfileScreen.js

---

### 3. 비밀번호 변경
```
PUT /me/password
인증: 필요 (Bearer Token)
Request Body:
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
응답: 200 OK
{
  "message": "비밀번호가 변경되었습니다."
}
```
**사용 화면**: ProfileScreen.js

---

### 4. 계좌 등록
```
POST /me/account
인증: 필요 (Bearer Token)
Request Body:
{
  "bank": "국민은행",
  "accountNumber": "1234567890"
}
응답: 200 OK 또는 201 Created
{
  "message": "계좌가 등록되었습니다.",
  "accountId": 1
}
```
**사용 화면**: AccountRegisterScreen.js

---

### 5. 계좌 조회
```
GET /me/account
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "bank": "국민은행",
  "accountNumber": "1234567890",
  "accountId": 1
}
```
**사용 화면**: MyPageScreen.js, AccountRegisterScreen.js

---

### 6. 계좌 수정
```
PUT /me/account
인증: 필요 (Bearer Token)
Request Body:
{
  "bank": "신한은행",
  "accountNumber": "9876543210"
}
응답: 200 OK
{
  "message": "계좌 정보가 수정되었습니다."
}
```
**사용 화면**: AccountRegisterScreen.js (수정 기능 추가 시)

---

### 7. 계좌 삭제
```
DELETE /me/account
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "message": "계좌가 삭제되었습니다."
}
```
**사용 화면**: AccountRegisterScreen.js (삭제 기능 추가 시)

---

### 8. 보증금 조회
```
GET /me/deposit
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "depositAmount": 10000,
  "status": "ACTIVE",  // ACTIVE, REFUNDED, PENDING
  "depositedAt": "2024-01-01T10:00:00",
  "refundedAt": null
}
```
**사용 화면**: DepositScreen.js

---

### 9. 보증금 입금
```
POST /me/deposit
인증: 필요 (Bearer Token)
Request Body:
{
  "amount": 10000
}
응답: 200 OK 또는 201 Created
{
  "message": "보증금이 입금되었습니다.",
  "depositId": 1,
  "totalAmount": 10000
}
```
**사용 화면**: DepositScreen.js

---

### 10. 보증금 환불 요청
```
POST /me/deposit/refund
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "message": "환불 요청이 접수되었습니다.",
  "refundRequestId": 1
}
```
**사용 화면**: DepositScreen.js

---

### 11. 알림 설정 조회
```
GET /me/notifications
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "pushEnabled": true,
  "marketingEnabled": false,
  "emailEnabled": true,
  "vibrationEnabled": true
}
```
**사용 화면**: NotificationSettingScreen.js

---

### 12. 알림 설정 수정
```
PUT /me/notifications
인증: 필요 (Bearer Token)
Request Body:
{
  "pushEnabled": true,
  "marketingEnabled": false,
  "emailEnabled": true,
  "vibrationEnabled": true
}
응답: 200 OK
{
  "message": "알림 설정이 저장되었습니다."
}
```
**사용 화면**: NotificationSettingScreen.js

---

### 13. 고객센터 문의 등록
```
POST /me/inquiries
인증: 필요 (Bearer Token)
Request Body:
{
  "title": "문의 제목",
  "content": "문의 내용"
}
응답: 200 OK 또는 201 Created
{
  "message": "문의가 접수되었습니다.",
  "inquiryId": 1
}
```
**사용 화면**: CustomerSupportScreen.js

---

### 14. 내 문의 내역 조회
```
GET /me/inquiries
인증: 필요 (Bearer Token)
Query Parameters:
  - page (optional): 페이지 번호
  - size (optional): 페이지 크기
응답: 200 OK
{
  "inquiries": [
    {
      "inquiryId": 1,
      "title": "문의 제목",
      "content": "문의 내용",
      "status": "PENDING",  // PENDING, ANSWERED
      "createdAt": "2024-01-01T10:00:00",
      "answeredAt": null
    }
  ],
  "total": 10,
  "page": 1,
  "size": 10
}
```
**사용 화면**: CustomerSupportScreen.js (문의 내역 조회 기능 추가 시)

---

### 15. 문의 상세 조회
```
GET /me/inquiries/{inquiryId}
인증: 필요 (Bearer Token)
Path Parameter: inquiryId (Long)
응답: 200 OK
{
  "inquiryId": 1,
  "title": "문의 제목",
  "content": "문의 내용",
  "status": "ANSWERED",
  "createdAt": "2024-01-01T10:00:00",
  "answer": {
    "content": "답변 내용",
    "answeredAt": "2024-01-02T10:00:00"
  }
}
```
**사용 화면**: CustomerSupportScreen.js (문의 상세 조회 기능 추가 시)

---

## 우선순위

### 🔴 높음 (즉시 필요)
1. 사용자 프로필 조회 (`GET /me/profile`)
2. 계좌 등록/조회 (`POST/GET /me/account`)
3. 비밀번호 변경 (`PUT /me/password`)

### 🟡 중간 (곧 필요)
4. 프로필 수정 (`PUT /me/profile`)
5. 알림 설정 조회/수정 (`GET/PUT /me/notifications`)
6. 고객센터 문의 등록 (`POST /me/inquiries`)

### 🟢 낮음 (추후 필요)
7. 보증금 관련 API (`GET/POST /me/deposit`)
8. 계좌 수정/삭제 (`PUT/DELETE /me/account`)
9. 문의 내역 조회 (`GET /me/inquiries`)

---

## 참고사항

- 모든 API는 Bearer 토큰 인증이 필요합니다.
- 에러 응답은 일관된 형식으로 반환해주세요 (예: `{ "message": "에러 메시지" }`).
- Swagger 문서에 추가해주시면 프론트엔드에서 바로 사용할 수 있습니다.


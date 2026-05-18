# 로그인 기능 확장 PRD
## v1.0 | 기술 구현 명세

> **연관 PRD**: 로그인_회원가입_구현_PRD.md (기존 이메일 로그인) / 로그인,인증 UI_PRD.md (UI 명세)
> **현황**: 이메일/비밀번호 + JWT 인증 구현 완료. 비밀번호 찾기·소셜 로그인 버튼은 stub("준비 중인 기능") 상태.
> **목표**: 비밀번호 찾기·카카오 소셜 로그인·비밀번호 변경·회원 탈퇴 추가 구현

---

## 1. 현황 및 목표

### 현재 구현 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| 이메일/비밀번호 로그인 | ✅ 완료 | JWT 발급, 24h 유효 |
| 회원가입 (5단계) | ✅ 완료 | 이메일·닉네임 중복확인 포함 |
| 거주지 인증 (VERIFIED) | ✅ 완료 | POST /api/auth/verify |
| 비밀번호 찾기 | ❌ stub | LoginPage 버튼만 존재 |
| 카카오 로그인 | ❌ stub | LoginPage·SignupPage 버튼만 존재 |
| 비밀번호 변경 | ❌ 미구현 | 마이페이지에 없음 |
| 회원 탈퇴 | ❌ 미구현 | 마이페이지에 없음 |

### 추가 구현 기능 (우선순위 순)

| # | 기능 | 우선순위 |
|---|------|---------|
| 1 | 비밀번호 찾기/재설정 | P0 |
| 2 | 카카오 소셜 로그인 | P0 |
| 3 | 비밀번호 변경 | P1 |
| 4 | 회원 탈퇴 | P1 |

---

## 2. 기능 1 — 비밀번호 찾기/재설정

### 2.1 사용자 흐름

```
[LoginPage] "비밀번호를 잊으셨나요?" 클릭
  → [ForgotPasswordPage] 가입 이메일 입력
  → POST /api/auth/password-reset/request
      → DB에 6자리 인증코드 저장 (15분 유효)
      → 이메일로 인증코드 발송
  → [ResetPasswordPage] 인증코드 6자리 입력
  → POST /api/auth/password-reset/verify
      → 코드 유효성 검증
  → [ResetPasswordPage] 새 비밀번호 설정
  → POST /api/auth/password-reset/confirm
      → 비밀번호 변경, 토큰 무효화
  → [LoginPage] "비밀번호가 변경되었어요" 토스트
```

### 2.2 DB 스키마 (Flyway V10)

```sql
CREATE TABLE password_reset_tokens (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(6)   NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);
```

### 2.3 백엔드 구현

#### 의존성 추가 (`build.gradle`)
```groovy
implementation 'org.springframework.boot:spring-boot-starter-mail'
```

#### application.yml 추가
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}    # Gmail 앱 비밀번호
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

#### 새 파일

| 파일 | 내용 |
|------|------|
| `web/dto/PasswordResetRequestDto.java` | `{ String email }` |
| `web/dto/PasswordResetVerifyDto.java` | `{ String email, String token }` |
| `web/dto/PasswordResetConfirmDto.java` | `{ String email, String token, String newPassword }` |
| `domain/entity/PasswordResetToken.java` | 위 테이블 엔티티 |
| `domain/repository/PasswordResetTokenRepository.java` | `findByUserIdAndTokenAndUsedFalse()` |
| `service/PasswordResetService.java` | 코드 생성·발송·검증·변경 |
| `web/controller/PasswordResetController.java` | 3개 엔드포인트 |

#### API 엔드포인트
```
POST /api/auth/password-reset/request   - public
POST /api/auth/password-reset/verify    - public
POST /api/auth/password-reset/confirm   - public
```

#### SecurityConfig 추가
```java
"/api/auth/password-reset/**"  →  permitAll()
```

#### PasswordResetService 핵심 로직
```java
// request: 6자리 랜덤 코드 생성, 기존 미사용 토큰 삭제 후 저장, 이메일 발송
// verify:  token 존재·만료·사용여부 검증 (검증 성공 시 삭제하지 않고 유지)
// confirm: token 재검증 후 User.passwordHash 업데이트, token.used=true
```

### 2.4 프론트엔드 구현

#### 새 파일
| 파일 | 내용 |
|------|------|
| `pages/ForgotPasswordPage.tsx` | 이메일 입력 → request API 호출 |
| `pages/ResetPasswordPage.tsx` | 코드 입력 + 새 비밀번호 설정 (2단계) |

#### 수정 파일
| 파일 | 변경 내용 |
|------|---------|
| `services/authService.ts` | `requestPasswordReset()`, `verifyResetToken()`, `confirmPasswordReset()` 추가 |
| `App.tsx` | `/forgot-password`, `/reset-password` 라우트 추가 |
| `pages/LoginPage.tsx` | "비밀번호를 잊으셨나요?" → `navigate('/forgot-password')` |

---

## 3. 기능 2 — 카카오 소셜 로그인

### 3.1 사용자 흐름 (Authorization Code Flow)

```
[LoginPage / SignupPage] "카카오로 시작하기" 클릭
  → 카카오 OAuth 인가 페이지로 리다이렉트
      URL: https://kauth.kakao.com/oauth/authorize
           ?client_id={KAKAO_REST_API_KEY}
           &redirect_uri={FRONTEND_URL}/auth/kakao/callback
           &response_type=code
  → 카카오 로그인·동의 완료
  → [KakaoCallbackPage] (?code=xxx)
  → POST /api/auth/oauth/kakao { code, redirectUri }
      → 카카오 API: code → access_token 교환
      → 카카오 API: access_token → 사용자 정보 (kakao_id, email, nickname)
      → 분기:
          ① 신규 카카오 유저     → User 생성 (password_hash=null) → JWT 발급
          ② 기존 카카오 유저     → 로그인 → JWT 발급
          ③ 동일 이메일 일반계정 → 409 Conflict (이메일 계정으로 로그인 안내)
  → 프론트엔드: JWT 저장 → store 업데이트 → "/" 이동
```

### 3.2 DB 스키마 (Flyway V11)

```sql
-- users 테이블 컬럼 추가
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20),    -- 'KAKAO' | NULL
    ADD COLUMN IF NOT EXISTS oauth_id       VARCHAR(100),   -- 카카오 회원번호
    ALTER COLUMN password_hash DROP NOT NULL;               -- 소셜 로그인은 비밀번호 없음

CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
```

### 3.3 백엔드 구현

#### application.yml 추가
```yaml
kakao:
  rest-api-key: ${KAKAO_REST_API_KEY}    # 기존 설정 활용
  redirect-uri: ${KAKAO_REDIRECT_URI}    # 예: http://localhost:5173/auth/kakao/callback
  token-url: https://kauth.kakao.com/oauth/token
  user-info-url: https://kapi.kakao.com/v2/user/me
```

#### User 엔티티 수정
```java
// User.java
@Column(name = "oauth_provider", length = 20)
private String oauthProvider;          // "KAKAO" or null

@Column(name = "oauth_id", length = 100)
private String oauthId;                // 카카오 회원번호

@Column(name = "password_hash")        // nullable = true 로 변경
private String passwordHash;

// 팩토리 메서드 추가
public static User createOAuthUser(String email, String nickname,
                                   String oauthProvider, String oauthId) { ... }
```

#### 새 파일
| 파일 | 내용 |
|------|------|
| `web/dto/KakaoLoginRequest.java` | `{ String code, String redirectUri }` |
| `service/KakaoOAuthService.java` | token 교환, 사용자 정보 조회 (RestTemplate) |
| `web/controller/OAuthController.java` | `POST /api/auth/oauth/kakao` |

#### SecurityConfig 추가
```java
"/api/auth/oauth/**"  →  permitAll()
```

#### KakaoOAuthService 핵심 로직
```java
// 1. POST kauth.kakao.com/oauth/token → access_token 획득
// 2. GET  kapi.kakao.com/v2/user/me   → kakao_id, email, nickname 획득
// 3. UserRepository.findByOauthProviderAndOauthId() 로 기존 유저 확인
// 4. 없으면 신규 생성, 있으면 기존 유저 반환 → JWT 발급
```

### 3.4 프론트엔드 구현

#### 새 파일
| 파일 | 내용 |
|------|------|
| `pages/KakaoCallbackPage.tsx` | URL params에서 code 추출 → `/api/auth/oauth/kakao` 호출 → store 저장 → "/" 이동 |

#### 수정 파일
| 파일 | 변경 내용 |
|------|---------|
| `services/authService.ts` | `kakaoLogin(code, redirectUri)` 추가 |
| `App.tsx` | `/auth/kakao/callback` 라우트 추가 |
| `pages/LoginPage.tsx` | 카카오 버튼 onClick → 카카오 OAuth URL 이동 |
| `pages/SignupPage.tsx` | 카카오 버튼 (Step 1) onClick → 카카오 OAuth URL 이동 |

#### 카카오 버튼 클릭 로직
```typescript
const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${import.meta.env.VITE_KAKAO_REST_API_KEY}` +
  `&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/kakao/callback')}` +
  `&response_type=code`

window.location.href = KAKAO_AUTH_URL
```

#### 환경변수 추가 (`frontend/.env`)
```
VITE_KAKAO_REST_API_KEY=...
```

---

## 4. 기능 3 — 비밀번호 변경

### 4.1 사용자 흐름

```
[MyPage] "비밀번호 변경" 버튼 클릭
  → [ChangePasswordPage] 현재 비밀번호 + 새 비밀번호 + 새 비밀번호 확인 입력
  → PUT /api/auth/password (JWT 인증 필요)
      → 현재 비밀번호 검증
      → 새 비밀번호 BCrypt 해싱 후 저장
  → "비밀번호가 변경되었어요" 토스트 → MyPage로 이동
```

> **카카오 유저 처리**: `oauth_provider = 'KAKAO'` 이면 "소셜 계정은 비밀번호를 변경할 수 없어요" 안내

### 4.2 백엔드 구현

#### 새 파일
| 파일 | 내용 |
|------|------|
| `web/dto/ChangePasswordRequest.java` | `{ String currentPassword, String newPassword }` |

#### 수정 파일
| 파일 | 변경 내용 |
|------|---------|
| `service/AuthService.java` | `changePassword(User, currentPw, newPw)` 추가 |
| `web/controller/AuthController.java` | `PUT /api/auth/password` (authenticated) 추가 |

### 4.3 프론트엔드 구현

#### 새 파일
| 파일 | 내용 |
|------|------|
| `pages/ChangePasswordPage.tsx` | 3개 input + 유효성 검사 + API 호출 |

#### 수정 파일
| 파일 | 변경 내용 |
|------|---------|
| `services/authService.ts` | `changePassword(currentPw, newPw)` 추가 |
| `App.tsx` | `/change-password` 라우트 추가 |
| `pages/MyPage.tsx` | "비밀번호 변경" 버튼 추가 (카카오 유저는 비활성화) |

---

## 5. 기능 4 — 회원 탈퇴

### 5.1 사용자 흐름

```
[MyPage] "회원 탈퇴" 버튼 클릭
  → ConfirmDialog "정말 탈퇴하시겠습니까? 작성한 게시글과 댓글은 익명으로 처리됩니다."
  → [확인] DELETE /api/auth/account (JWT 인증 필요)
      → posts.author_nickname    → "탈퇴한 사용자" 일괄 업데이트
      → comments.author_nickname → "탈퇴한 사용자" 일괄 업데이트
      → User 삭제
  → 로그아웃 처리 (token 삭제 + store 초기화)
  → "/" 이동 + "탈퇴 처리가 완료되었어요" 토스트
```

### 5.2 백엔드 구현

#### 수정 파일
| 파일 | 변경 내용 |
|------|---------|
| `service/AuthService.java` | `deleteAccount(User)` 추가 |
| `web/controller/AuthController.java` | `DELETE /api/auth/account` (authenticated) 추가 |
| `domain/repository/CommunityPostRepository.java` | `updateAuthorNickname(oldNick, newNick)` JPQL 추가 |
| `domain/repository/CommentRepository.java` | `updateAuthorNickname(oldNick, newNick)` JPQL 추가 |

#### AuthService.deleteAccount 로직
```java
@Transactional
public void deleteAccount(User user) {
    String nickname = user.getNickname();
    communityPostRepository.updateAuthorNickname(nickname, "탈퇴한 사용자");
    commentRepository.updateAuthorNickname(nickname, "탈퇴한 사용자");
    userRepository.delete(user);  // ON DELETE CASCADE → password_reset_tokens 자동 삭제
}
```

#### JPQL 예시
```java
@Modifying
@Query("UPDATE CommunityPost p SET p.authorNickname = :newNick WHERE p.authorNickname = :oldNick")
void updateAuthorNickname(@Param("oldNick") String oldNick, @Param("newNick") String newNick);
```

### 5.3 프론트엔드 구현

#### 수정 파일
| 파일 | 변경 내용 |
|------|---------|
| `services/authService.ts` | `deleteAccount()` 추가 |
| `pages/MyPage.tsx` | "회원 탈퇴" 버튼 + ConfirmDialog 연결 (기존 ConfirmDialog 재사용) |

---

## 6. DB 변경 요약

| Flyway | 내용 |
|--------|------|
| V10 | `password_reset_tokens` 테이블 생성 |
| V11 | `users`에 `oauth_provider`, `oauth_id` 컬럼 추가 / `password_hash` nullable 변경 |

---

## 7. API 명세 전체

| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/password-reset/request` | 없음 | 인증코드 이메일 발송 |
| POST | `/api/auth/password-reset/verify` | 없음 | 인증코드 검증 |
| POST | `/api/auth/password-reset/confirm` | 없음 | 새 비밀번호 저장 |
| POST | `/api/auth/oauth/kakao` | 없음 | 카카오 OAuth 로그인/회원가입 |
| PUT | `/api/auth/password` | JWT | 비밀번호 변경 |
| DELETE | `/api/auth/account` | JWT | 회원 탈퇴 |

---

## 8. 구현 순서 (Phase)

```
Phase 1 — 비밀번호 찾기/재설정
  ├── [BE] Flyway V10, Spring Mail 설정, PasswordResetToken 엔티티
  ├── [BE] PasswordResetService + PasswordResetController
  └── [FE] ForgotPasswordPage + ResetPasswordPage + 라우트 연결

Phase 2 — 카카오 소셜 로그인
  ├── [BE] Flyway V11, User 엔티티 수정 (oauth 필드 추가)
  ├── [BE] KakaoOAuthService + OAuthController
  └── [FE] KakaoCallbackPage + 카카오 버튼 동작 연결

Phase 3 — 비밀번호 변경 + 회원 탈퇴
  ├── [BE] AuthService 메서드 추가, 엔드포인트 추가
  ├── [FE] ChangePasswordPage + MyPage 버튼 추가
  └── [FE] 회원탈퇴 ConfirmDialog 연결
```

---

## 9. 환경 변수 추가 목록

### 백엔드 (`.env`)
```
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
```

### 프론트엔드 (`.env`)
```
VITE_KAKAO_REST_API_KEY=...   # 기존 application.yml의 KAKAO_REST_API_KEY와 동일
```

---

## 10. 참고 파일

| 파일 | 목적 |
|------|------|
| `backend/.../AuthController.java` | 기존 엔드포인트 패턴 참고 |
| `backend/.../AuthService.java` | 기존 서비스 로직 참고 |
| `backend/.../User.java` | 엔티티 수정 대상 |
| `backend/.../SecurityConfig.java` | permitAll 목록 확장 |
| `backend/resources/db/migration/V7__create_users_table.sql` | 기존 users 스키마 참고 |
| `frontend/src/pages/LoginPage.tsx` | stub 버튼 교체 대상 |
| `frontend/src/services/authService.ts` | API 메서드 추가 위치 |
| `frontend/src/components/common/ConfirmDialog.tsx` | 회원탈퇴 재사용 |
| `frontend/src/stores/userStore.ts` | 로그아웃/store 초기화 로직 |

# 로그인/인증 보안 보완 PRD
## v1.0 | HomeBlind 인증 확장 후속 개선

> 기준일: 2026-05-13
> 대상 프로젝트: HomeBlind (backend + frontend)
> 목적: 현재 구현된 로그인 확장 기능의 보안/운영 리스크를 제거하고 검증 체계를 강화한다.

---

## 1. 배경 및 문제 정의

현재 `로그인_기능확장_PRD` 기능은 구현되어 있으나, 다음 보완이 필요하다.

1. 비밀번호 재설정 API에서 사용자 존재 여부가 노출됨 (계정 유추 가능)
2. 비밀번호 재설정 코드(6자리)에 대한 시도 제한/레이트리밋 부재
3. 카카오 OAuth `redirectUri`를 클라이언트 입력값 그대로 사용
4. 비밀번호 재설정 토큰 평문 저장
5. 인증 핵심 플로우 테스트 부족

---

## 2. 목표

### 2.1 기능 목표

1. 비밀번호 재설정 플로우에서 계정 존재 노출 차단
2. 인증 관련 공개 엔드포인트 레이트리밋 적용
3. OAuth Redirect URI 화이트리스트 검증
4. 비밀번호 재설정 토큰 해시 저장 전환
5. 인증 도메인 테스트 체계 확립

### 2.2 비기능 목표

1. 보안 사고 가능성 감소 (브루트포스/계정 유추/우회 요청)
2. 운영 안정성 향상 (오탐 최소화된 방어 로직)
3. 회귀 방지 (자동 테스트로 배포 신뢰도 확보)

---

## 3. 범위

### 포함

1. Backend 인증/보안 로직 보강
2. DB 마이그레이션(Flyway)
3. 인증 API 응답 정책 조정
4. 인증 관련 테스트 코드 작성
5. 최소한의 프론트 문구/흐름 조정

### 제외

1. 신규 소셜 로그인 공급자 추가
2. MFA(2단계 인증) 도입
3. CAPTCHA 도입 (차기 PRD 후보)

---

## 4. 상세 요구사항

## 4.1 비밀번호 재설정 계정 존재 노출 제거 (P0)

### 요구사항

1. `POST /api/auth/password-reset/request`는 이메일 존재 여부와 무관하게 동일한 성공 응답을 반환한다.
2. 응답 메시지는 고정한다.
   - 예: "입력한 이메일로 재설정 안내를 보냈습니다."
3. 존재하지 않는 이메일은 메일 발송/토큰 생성 없이 조용히 종료한다.
4. 로그에는 추적 가능한 이벤트를 남기되(보안 로그), 외부 응답은 동일하게 유지한다.

### 구현 포인트

1. `PasswordResetService.requestReset`의 `NOT_FOUND` 예외 제거
2. Controller는 현재처럼 `204 No Content` 유지 또는 `200 + 고정 메시지`로 통일
3. 모니터링용 내부 로그 필드:
   - `email_hash`, `ip`, `user_agent`, `result_type(existing|non_existing)`

---

## 4.2 비밀번호 재설정/인증 엔드포인트 레이트리밋 (P0)

### 대상 엔드포인트

1. `POST /api/auth/password-reset/request`
2. `POST /api/auth/password-reset/verify`
3. `POST /api/auth/password-reset/confirm`
4. `POST /api/auth/login`
5. `POST /api/auth/oauth/kakao`

### 정책(초안)

1. `password-reset/request`: IP 기준 분당 5회, 이메일 기준 10분 3회
2. `password-reset/verify`: IP 기준 분당 20회, 이메일 기준 15분 10회
3. `password-reset/confirm`: IP 기준 분당 10회
4. `login`: IP 기준 분당 30회, 이메일 기준 5분 10회
5. 초과 시 `429 Too Many Requests`

### 구현 방식

1. Spring `OncePerRequestFilter` 또는 `HandlerInterceptor` 기반 RateLimit 컴포넌트
2. 키 전략:
   - 비로그인: `IP + endpoint`
   - 이메일 기반: `normalized_email + endpoint`
3. 저장소:
   - 단기: in-memory(Caffeine) + TTL
   - 운영: Redis 전환 가능하도록 인터페이스 분리

### 추가 요구

1. 실패 응답 body 표준화:
   - `code: RATE_LIMITED`
   - `message: 잠시 후 다시 시도해주세요.`
2. `Retry-After` 헤더 제공

---

## 4.3 카카오 OAuth redirectUri 화이트리스트 검증 (P0)

### 요구사항

1. 백엔드는 허용된 Redirect URI 목록과 요청 `redirectUri`를 비교 검증한다.
2. 불일치 시 `400 Bad Request` 반환
3. `application.yml`에서 허용 URI 목록 관리

### 설정 예시

```yaml
kakao:
  allowed-redirect-uris:
    - http://localhost:5173/auth/kakao/callback
    - https://homeblind.com/auth/kakao/callback
```

### 구현 포인트

1. `KakaoOAuthService`에서 token 교환 전 검증
2. 문자열 비교는 정규화 후 정확 일치(스킴/호스트/포트/패스)
3. 쿼리 파라미터 임의 부착 URL은 불허

---

## 4.4 비밀번호 재설정 토큰 해시 저장 전환 (P1)

### 요구사항

1. DB에는 토큰 원문 대신 해시를 저장한다.
2. 사용자 입력 코드도 동일 해시 후 비교한다.
3. 기존 평문 토큰 컬럼은 마이그레이션으로 대체한다.

### DB 변경(Flyway 신규)

1. `password_reset_tokens.token` -> `token_hash`로 전환
2. 필요 시 길이 확장(`VARCHAR(255)`)
3. 인덱스 재검토

### 구현 포인트

1. 해시 알고리즘: SHA-256 (서버 고정 salt 또는 pepper 추가)
2. 코드 검증 시 타이밍 공격 완화 비교 사용
3. 메일에는 기존처럼 원문 코드 발송

---

## 4.5 테스트 체계 보강 (P0)

### 테스트 대상

1. `PasswordResetService`
2. `AuthService`(login/changePassword/deleteAccount)
3. `KakaoOAuthService`
4. `AuthController`/`OAuthController` WebMvc 테스트

### 필수 시나리오

1. 재설정 요청: 가입/미가입 이메일 모두 동일 응답
2. 재설정 검증: 만료/불일치/사용완료 토큰 케이스
3. 레이트리밋 초과 시 429
4. 카카오 redirectUri 불일치 시 400
5. 카카오 기존 계정 로그인/신규 생성/이메일 충돌 409
6. 회원탈퇴 시 익명화 + 좋아요 로그 삭제

### 품질 게이트

1. 인증 모듈 라인 커버리지 70% 이상
2. 핵심 서비스 브랜치 커버리지 60% 이상

---

## 5. API/응답 정책 변경 요약

| API | 기존 | 변경 |
|---|---|---|
| POST `/api/auth/password-reset/request` | 미가입 시 에러 가능 | 항상 동일 성공 응답 |
| 인증 관련 공개 API | 제한 없음 | 정책 기반 429 레이트리밋 |
| POST `/api/auth/oauth/kakao` | redirectUri 무검증 | 화이트리스트 검증 |

---

## 6. 기술 설계 요약

1. `security` 패키지에 `RateLimitService`, `RateLimitFilter` 추가
2. `auth` 서비스 계층에 `RedirectUriValidator` 추가
3. `PasswordResetToken` 엔티티 및 리포지토리 해시 컬럼 반영
4. 예외 응답 표준화를 위한 `@RestControllerAdvice` 보강

---

## 7. 구현 단계(Phase)

### Phase 1 (P0) - 보안 차단 우선

1. 재설정 계정 노출 제거
2. Redirect URI 화이트리스트 검증
3. 레이트리밋 1차(in-memory) 적용
4. 컨트롤러/서비스 테스트 우선 작성

### Phase 2 (P1) - 저장 보안 강화

1. 토큰 해시 저장 마이그레이션
2. 관련 서비스/리포지토리 로직 전환
3. 회귀 테스트 보강

### Phase 3 (P1) - 운영 안정화

1. 보안 로그 필드 정리
2. 레이트리밋 파라미터 환경변수화
3. 운영 대시보드 지표(429, reset 요청량) 정의

---

## 8. 환경변수/설정 추가

### Backend

```env
# Rate limit
AUTH_RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_BACKEND=memory

# Kakao
KAKAO_ALLOWED_REDIRECT_URIS=http://localhost:5173/auth/kakao/callback,https://homeblind.com/auth/kakao/callback

# Password reset token
PASSWORD_RESET_TOKEN_PEPPER=change-me
```

---

## 9. 리스크 및 대응

1. 레이트리밋 오탐으로 정상 사용자 차단 가능
   - 대응: endpoint별 기준치 분리, 모니터링 후 튜닝
2. 토큰 해시 전환 중 구버전 토큰 불일치
   - 대응: 점진 전환 또는 배포 시점 기존 토큰 무효화 공지
3. OAuth redirectUri 운영 도메인 누락
   - 대응: 배포 체크리스트에 도메인 등록 단계 추가

---

## 10. 완료 기준(Definition of Done)

1. P0 항목 100% 반영
2. 인증 보안 테스트 모두 통과
3. 회귀 테스트 및 프론트 빌드 성공
4. 로컬/스테이징에서 로그인/재설정/OAuth/탈퇴 시나리오 수동 점검 완료
5. 운영 설정값 문서화 완료

# 로그인 / 회원가입 실제 구현 PRD
## v1.0 | 기술 구현 명세

> **연관 PRD**: 로그인,인증 UI_PRD.md (UI 명세) / 프로젝트_개선계획_PRD.md (우선순위 5)
> **현황**: Frontend mock 인증만 구현됨. Backend 인증 서버 없음.
> **목표**: Spring Security + JWT 기반 실제 인증 구현 및 Frontend 연동

---

## 1. 현황 및 목표

### 현재 상태

| 영역 | 현황 |
|------|------|
| Frontend 로그인 | `mockAuthData.ts` 기반 가짜 인증 |
| Frontend 회원가입 | 5단계 UI 구현됨, mock 중복 확인만 |
| Backend 인증 | 엔드포인트 없음 (`/api/auth/*` 전무) |
| 사용자 식별 | `authorNickname` 파라미터 (비인증) |
| 토큰 | 없음 |

### 구현 목표

```
POST /api/auth/signup          → 회원가입 + JWT 발급
POST /api/auth/login           → 로그인 + JWT 발급
POST /api/auth/logout          → 로그아웃
GET  /api/auth/me              → 현재 사용자 정보
GET  /api/auth/check-email     → 이메일 중복 확인
GET  /api/auth/check-nickname  → 닉네임 중복 확인
```

---

## 2. DB 스키마

### users 테이블

```sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(50)  NOT NULL UNIQUE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    apartment_id  BIGINT       REFERENCES apartments(id),
    apartment_name VARCHAR(255),
    marketing_agreed BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- status: 'MEMBER' | 'VERIFIED'
-- (GUEST는 DB에 저장하지 않음 — 프론트엔드 상태만)
```

### Flyway 마이그레이션 파일

```
backend/src/main/resources/db/migration/V{다음번호}__create_users_table.sql
```

---

## 3. 백엔드 구현

### 3.1 의존성 추가 (`build.gradle`)

```groovy
dependencies {
    // 기존 의존성 유지...

    // Spring Security
    implementation 'org.springframework.boot:spring-boot-starter-security'

    // JWT (jjwt 0.12.x)
    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    runtimeOnly    'io.jsonwebtoken:jjwt-impl:0.12.3'
    runtimeOnly    'io.jsonwebtoken:jjwt-jackson:0.12.3'

    // Validation
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```

### 3.2 환경변수 (`.env` 및 `application.properties`)

```env
# .env에 추가
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
JWT_EXPIRATION_MS=86400000
```

```properties
# application.properties에 추가
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION_MS:86400000}
```

### 3.3 파일 구조

```
backend/src/main/java/com/realestate/
├── auth/
│   ├── AuthController.java          ← REST 엔드포인트
│   ├── AuthService.java             ← 비즈니스 로직
│   ├── JwtUtil.java                 ← JWT 생성/검증
│   ├── JwtAuthenticationFilter.java ← Security 필터
│   └── SecurityConfig.java          ← Spring Security 설정
├── domain/
│   ├── entity/
│   │   └── User.java                ← 신규 JPA 엔티티
│   └── repository/
│       └── UserRepository.java      ← 신규 JPA 리포지토리
└── web/dto/
    ├── SignupRequest.java            ← 회원가입 요청 DTO
    ├── LoginRequest.java             ← 로그인 요청 DTO
    └── AuthResponse.java             ← 인증 응답 DTO
```

### 3.4 User 엔티티

```java
// domain/entity/User.java
@Entity
@Table(name = "users")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.MEMBER;

    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "apartment_name")
    private String apartmentName;

    @Column(name = "marketing_agreed")
    private boolean marketingAgreed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum UserStatus { MEMBER, VERIFIED }

    @Builder
    public User(String email, String passwordHash, String nickname, boolean marketingAgreed) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.marketingAgreed = marketingAgreed;
    }

    public void verify(Long apartmentId, String apartmentName) {
        this.status = UserStatus.VERIFIED;
        this.apartmentId = apartmentId;
        this.apartmentName = apartmentName;
        this.updatedAt = LocalDateTime.now();
    }
}
```

### 3.5 UserRepository

```java
// domain/repository/UserRepository.java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
}
```

### 3.6 DTO 명세

```java
// SignupRequest.java
public record SignupRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8) String password,
    @NotBlank @Size(min = 2, max = 10) String nickname,
    boolean serviceAgreed,
    boolean privacyAgreed,
    boolean marketingAgreed
) {}

// LoginRequest.java
public record LoginRequest(
    @Email @NotBlank String email,
    @NotBlank String password
) {}

// AuthResponse.java
public record AuthResponse(
    String token,
    Long userId,
    String nickname,
    String status,           // "MEMBER" | "VERIFIED"
    Long apartmentId,        // null if not verified
    String apartmentName     // null if not verified
) {}
```

### 3.7 JwtUtil

```java
// auth/JwtUtil.java
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expirationMs;

    public String generateToken(User user) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("nickname", user.getNickname())
            .claim("status", user.getStatus().name())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getKey())
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(getKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isValid(String token) {
        try { parseToken(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
```

### 3.8 JwtAuthenticationFilter

```java
// auth/JwtAuthenticationFilter.java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isValid(token)) {
                Claims claims = jwtUtil.parseToken(token);
                Long userId = Long.parseLong(claims.getSubject());
                userRepository.findById(userId).ifPresent(user -> {
                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(user, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }
        chain.doFilter(request, response);
    }
}
```

### 3.9 SecurityConfig

```java
// auth/SecurityConfig.java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 인증 없이 허용
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/signup",
                    "/api/auth/check-email",
                    "/api/auth/check-nickname"
                ).permitAll()
                // 커뮤니티 조회는 비인증 허용
                .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/**").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 3.10 AuthService

```java
// auth/AuthService.java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일이에요");
        if (userRepository.existsByNickname(req.nickname()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 닉네임이에요");
        if (!req.serviceAgreed() || !req.privacyAgreed())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 약관에 동의해주세요");

        User user = User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .nickname(req.nickname())
            .marketingAgreed(req.marketingAgreed())
            .build();

        userRepository.save(user);
        return toAuthResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않아요"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "이메일 또는 비밀번호가 올바르지 않아요");

        return toAuthResponse(user);
    }

    public AuthResponse getMe(User user) {
        return toAuthResponse(user);
    }

    public boolean checkEmail(String email) {
        return !userRepository.existsByEmail(email);
    }

    public boolean checkNickname(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(
            jwtUtil.generateToken(user),
            user.getId(),
            user.getNickname(),
            user.getStatus().name(),
            user.getApartmentId(),
            user.getApartmentName()
        );
    }
}
```

### 3.11 AuthController

```java
// auth/AuthController.java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest req) {
        return authService.signup(req);
    }

    // 로그인
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    // 로그아웃 (서버 측 처리 없음 — 클라이언트 토큰 삭제)
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {}

    // 현재 사용자 정보
    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return authService.getMe(user);
    }

    // 이메일 중복 확인
    @GetMapping("/check-email")
    public Map<String, Boolean> checkEmail(@RequestParam String email) {
        return Map.of("available", authService.checkEmail(email));
    }

    // 닉네임 중복 확인
    @GetMapping("/check-nickname")
    public Map<String, Boolean> checkNickname(@RequestParam String nickname) {
        return Map.of("available", authService.checkNickname(nickname));
    }
}
```

### 3.12 CORS 업데이트 (`WebMvcConfig.java`)

```java
// 기존 allowedMethods에 인증 관련 메서드 확인 (이미 POST/DELETE 있으면 OK)
// allowedHeaders에 Authorization 추가
configuration.addAllowedHeader("Authorization");
configuration.addAllowedHeader("Content-Type");
configuration.addExposedHeader("Authorization");
```

---

## 4. 프론트엔드 구현

### 4.1 authService.ts (신규 생성)

```typescript
// frontend/src/services/authService.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export interface AuthResponse {
  token: string
  userId: number
  nickname: string
  status: 'MEMBER' | 'VERIFIED'
  apartmentId: number | null
  apartmentName: string | null
}

// JWT 토큰 관리
export const tokenStorage = {
  get: () => localStorage.getItem('auth_token'),
  set: (token: string) => localStorage.setItem('auth_token', token),
  remove: () => localStorage.removeItem('auth_token'),
}

const authRequest = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Auth request failed')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const authApi = {
  signup: (body: {
    email: string
    password: string
    nickname: string
    serviceAgreed: boolean
    privacyAgreed: boolean
    marketingAgreed: boolean
  }) =>
    authRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (email: string, password: string) =>
    authRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    authRequest<void>('/api/auth/logout', { method: 'POST' }),

  checkEmail: (email: string) =>
    authRequest<{ available: boolean }>(
      `/api/auth/check-email?email=${encodeURIComponent(email)}`
    ),

  checkNickname: (nickname: string) =>
    authRequest<{ available: boolean }>(
      `/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`
    ),
}
```

### 4.2 userStore.ts 수정

```typescript
// 추가할 내용
import { tokenStorage } from '@/services/authService'

// 로그아웃 시 토큰도 삭제
logout: () => {
  tokenStorage.remove()
  set({ userId: null, nickname: null, status: 'GUEST',
        apartmentId: null, apartmentName: null })
},

// 로그인 성공 시 토큰 저장은 authService 호출부에서 처리
```

### 4.3 LoginPage.tsx 수정

```typescript
// 변경 전 (mock)
import { mockLoginUser, mockWrongCredentials } from '@/data/mockAuthData'

// 변경 후 (실제 API)
import { authApi, tokenStorage } from '@/services/authService'

// handleSubmit 내부
const handleSubmit = async () => {
  setIsLoading(true)
  try {
    const res = await authApi.login(email, password)
    tokenStorage.set(res.token)
    userStore.setUser({
      userId: res.userId,
      nickname: res.nickname,
      status: res.status,
      apartmentId: res.apartmentId,
      apartmentName: res.apartmentName,
    })
    navigate(redirectTo || '/', { replace: true })
    // Toast: "로그인 되었어요 👋"
  } catch (e) {
    setServerError('이메일 또는 비밀번호가 올바르지 않아요')
  } finally {
    setIsLoading(false)
  }
}
```

### 4.4 SignupPage.tsx 수정

```typescript
// Step 1 이메일 중복 확인 (mock → 실제 API)
// 변경 전: mockUsedEmails.includes(email)
// 변경 후:
const { available } = await authApi.checkEmail(email)
if (!available) setEmailError('이미 사용 중인 이메일이에요')

// Step 3 닉네임 중복 확인 (mock → 실제 API)
// 변경 전: mockUsedNicknames.includes(nickname)
// 변경 후:
const { available } = await authApi.checkNickname(nickname)
if (!available) setNicknameError('이미 사용 중인 닉네임이에요')

// Step 4~5 완료 후 회원가입 API 호출
// StepNavigation의 Step 4 '다음' 클릭 시 또는 Step 5 진입 시
const handleSignup = async () => {
  const res = await authApi.signup({
    email, password, nickname,
    serviceAgreed: terms.service,
    privacyAgreed: terms.privacy,
    marketingAgreed: terms.marketing,
  })
  tokenStorage.set(res.token)
  userStore.setUser({
    userId: res.userId,
    nickname: res.nickname,
    status: 'MEMBER',
    apartmentId: null,
    apartmentName: null,
  })
  setStep(5)  // 거주지 인증 안내 단계로
}
```

### 4.5 communityService.ts 수정

```typescript
// requestJson 함수에 JWT 헤더 추가
import { tokenStorage } from '@/services/authService'

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = tokenStorage.get()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'API request failed')
  }
  return (await response.json()) as T
}
```

---

## 5. 기존 기능과의 연동

### 닉네임 기반 식별 유지 전략

현재 댓글/좋아요는 `authorNickname`으로 사용자 식별. JWT 도입 후에도 **닉네임 방식 유지** (하위 호환).
JWT는 선택적으로 검증 — 없으면 닉네임만으로 처리, 있으면 서버에서 토큰 유저와 닉네임 일치 검증 가능.

```
단기 전략: 기존 communityService API는 nickname 파라미터 유지
           JWT 헤더는 추가되지만 백엔드 커뮤니티 API는 검증 선택적
장기 전략: 커뮤니티 API도 JWT 기반 사용자 식별로 전환 (별도 스프린트)
```

### 거주지 인증(VerifyPage) 연동

현재 VerifyPage는 프론트엔드 store만 업데이트. JWT 도입 후:
1. VerifyPage에서 아파트 선택 완료 시 → `PATCH /api/auth/me/verify` 호출
2. 백엔드 User 엔티티 `status → VERIFIED`, `apartmentId/Name` 저장
3. 새 토큰 발급 또는 store만 업데이트 (선택)

```java
// AuthController에 추가 (별도 구현)
@PatchMapping("/me/verify")
public AuthResponse verify(
    Authentication auth,
    @RequestBody VerifyRequest req
) {
    User user = (User) auth.getPrincipal();
    user.verify(req.apartmentId(), req.apartmentName());
    userRepository.save(user);
    return authService.getMe(user);
}
```

---

## 6. 보안 고려사항

| 항목 | 적용 방법 |
|------|----------|
| 비밀번호 해싱 | BCryptPasswordEncoder (기본 strength 10) |
| JWT 비밀키 | 환경변수 `JWT_SECRET` (32자 이상 랜덤 문자열) |
| JWT 만료 | 24시간 (`86400000ms`), 리프레시 토큰은 v2에서 |
| HTTPS | 운영 환경에서 반드시 적용 (Render.com 자동 제공) |
| SQL Injection | Spring Data JPA + Parameterized Query (자동) |
| XSS | React 기본 이스케이프 처리 |
| CORS | `WebMvcConfig`에서 허용 Origin 명시 (`localhost:5173`, 운영 도메인) |

---

## 7. 환경변수 전체

### 백엔드 `.env` 추가분

```env
JWT_SECRET=change-this-to-a-secure-random-256bit-key-in-production
JWT_EXPIRATION_MS=86400000
```

### 프론트엔드 `.env` (변경 없음)

```env
VITE_API_BASE_URL=http://localhost:8081
```

---

## 8. API 전체 목록 (인증)

| Method | URL | 인증 필요 | 설명 |
|--------|-----|:-------:|------|
| POST | `/api/auth/signup` | ❌ | 회원가입 + JWT 발급 |
| POST | `/api/auth/login` | ❌ | 로그인 + JWT 발급 |
| POST | `/api/auth/logout` | ❌ | 로그아웃 (클라이언트 토큰 삭제) |
| GET | `/api/auth/me` | ✅ | 현재 사용자 정보 |
| GET | `/api/auth/check-email?email=` | ❌ | 이메일 중복 확인 |
| GET | `/api/auth/check-nickname?nickname=` | ❌ | 닉네임 중복 확인 |
| PATCH | `/api/auth/me/verify` | ✅ | 거주지 인증 (별도 구현) |

---

## 9. 구현 순서 (스프린트 계획)

### Phase 1 — 백엔드 기반 구축

```
1. build.gradle 의존성 추가
2. V{n}__create_users_table.sql 마이그레이션 작성
3. User.java, UserRepository.java 생성
4. JwtUtil.java 구현
5. SecurityConfig.java 구현 (공개 엔드포인트 열기)
6. JwtAuthenticationFilter.java 구현
7. SignupRequest, LoginRequest, AuthResponse DTO 생성
8. AuthService.java 구현 (signup, login, checkEmail, checkNickname)
9. AuthController.java 구현
10. WebMvcConfig.java Authorization 헤더 허용 추가
```

### Phase 2 — 프론트엔드 연동

```
11. authService.ts 생성 (tokenStorage + authApi)
12. userStore.ts 수정 (logout 시 tokenStorage.remove)
13. LoginPage.tsx — mock 제거, 실제 API 연동
14. SignupPage.tsx — 중복 확인 + 회원가입 API 연동
15. communityService.ts — Authorization 헤더 추가
```

### Phase 3 — 거주지 인증 연동 (선택)

```
16. PATCH /api/auth/me/verify 엔드포인트 추가
17. VerifyPage.tsx — 선택 완료 시 API 호출 추가
```

---

## 10. 검증 방법

### 백엔드 단위 검증

```bash
# 회원가입
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234","nickname":"테스터","serviceAgreed":true,"privacyAgreed":true,"marketingAgreed":false}'

# 로그인
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}'

# 이메일 중복 확인
curl http://localhost:8081/api/auth/check-email?email=test@example.com

# 인증 필요 API 테스트 (토큰 없이 → 401)
curl http://localhost:8081/api/auth/me
```

### 프론트엔드 통합 테스트 시나리오

| 시나리오 | 예상 결과 |
|----------|----------|
| 회원가입 → Step 1~5 완료 | DB에 users 레코드 생성, localStorage에 JWT 저장, status=MEMBER |
| 중복 이메일 입력 | "이미 사용 중인 이메일이에요" 에러 메시지 |
| 로그인 성공 | JWT 저장, userStore 업데이트, redirectTo 페이지로 이동 |
| 잘못된 비밀번호 | "이메일 또는 비밀번호가 올바르지 않아요" 에러 |
| 새로고침 후 로그인 상태 | userStore persist + tokenStorage에서 상태 복원 |
| 로그아웃 | JWT 삭제, status=GUEST, / 이동 |
| GUEST로 /mypage 접근 | /login 리디렉션 (MemberRoute 정상 동작) |
| 커뮤니티 API 호출 | Authorization 헤더 포함 확인 (Network 탭) |

---

## 11. 향후 개선사항 (v2)

| 항목 | 설명 |
|------|------|
| 리프레시 토큰 | `/api/auth/refresh` — 만료 전 자동 갱신 |
| 소셜 로그인 | 카카오 OAuth2 연동 |
| 이메일 인증 | 회원가입 시 이메일 인증 링크 발송 |
| 비밀번호 찾기 | 이메일 기반 재설정 링크 |
| 커뮤니티 API 보안 강화 | 글쓰기/좋아요/댓글 API에 JWT 필수 적용 |

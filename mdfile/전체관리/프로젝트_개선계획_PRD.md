# 프로젝트 전체 개선 계획 PRD

> **대상**: 부동산 커뮤니티 + 실거래가 웹앱 (동네톡)
> **스택**: Spring Boot 3 + React 18 + Supabase(PostgreSQL)
> **작성일**: 2026-04-24

---

## 현재 구현 현황

| 기능 | 상태 |
|------|------|
| 아파트 검색 / 지도 | 완성 |
| 실거래가 통계 | 완성 |
| 커뮤니티 게시글 CRUD | 완성 |
| 사이드바 위젯 (인기글 / 키워드) | 완성 |
| 키워드 클릭 필터링 | 완성 |
| 댓글 기능 | 완성 |
| 좋아요 기능 | 완성 |
| 마이페이지 | 완성 |
| CORS (DELETE) | 완성 |
| 버그 수정 (우선순위 4 전체) | 완성 |
| **로그인 / 회원가입** | Mock 데이터만 (API 없음) — 미완성 |

---

## 우선순위 1: 댓글 기능 — 완료

### 백엔드 변경 내역

| 파일 | 변경 내용 |
|------|----------|
| `config/WebMvcConfig.java` | `.allowedMethods("GET", "POST", "DELETE")` 추가 |
| `web/controller/CommunityController.java` | 댓글 엔드포인트 3개 추가 |
| `service/CommunityService.java` | `getComments`, `createComment`, `deleteComment` 추가 |
| `domain/repository/CommentRepository.java` | `findByPostIdOrderByCreatedAtDesc`, `findByIdAndAuthorNickname`, `findByAuthorNicknameOrderByCreatedAtDesc` 추가 |
| `domain/repository/CommunityPostRepository.java` | `incrementCommentCount`, `decrementCommentCount` 추가 |
| `web/dto/CommentDto.java` | 신규 생성 — `record(id, postId, authorNickname, content, createdAt)` |
| `web/dto/CreateCommentRequest.java` | 신규 생성 — `record(authorNickname, content)` |

**추가된 API 엔드포인트**

```
GET    /api/community/posts/{postId}/comments   댓글 목록 조회
POST   /api/community/posts/{postId}/comments   댓글 작성
DELETE /api/community/comments/{commentId}?authorNickname=xxx   댓글 삭제
```

**댓글 삭제 정책**
- `authorNickname` 파라미터와 DB의 댓글 작성자가 일치해야만 삭제 허용
- 불일치 시 403 Forbidden 반환

**댓글 카운트 동기화**
- 댓글 작성 시 `posts.comment_count + 1` (JPQL UPDATE)
- 댓글 삭제 시 `posts.comment_count - 1` (GREATEST(count-1, 0) 적용, 음수 방지)

### 프론트엔드 변경 내역

| 파일 | 변경 내용 |
|------|----------|
| `types/index.ts` | `Comment` 타입에서 `complexName` 제거, `postId` 추가 |
| `services/communityService.ts` | `fetchComments`, `createComment`, `deleteComment` 추가 |
| `pages/PostDetailPage.tsx` | `useQuery`로 댓글 목록 실시간 조회, `useMutation`으로 작성/삭제 |
| `components/features/post/CommentInput.tsx` | `onSubmit` prop 받아 부모에서 API 호출 처리 |
| `components/features/post/CommentItem.tsx` | 작성자 본인 댓글에만 삭제 버튼 노출 |
| `components/features/post/CommentList.tsx` | `currentNickname`, `onDelete` prop 추가 |

---

## 우선순위 2: 좋아요 기능 — 완료

### 백엔드 변경 내역

| 파일 | 변경 내용 |
|------|----------|
| `web/controller/CommunityController.java` | 좋아요 토글 엔드포인트 추가 |
| `service/CommunityService.java` | `toggleLike` 추가 |
| `domain/repository/PostLikeLogRepository.java` | `existsByPostIdAndAuthorNickname`, `deleteByPostIdAndAuthorNickname` 추가 |
| `domain/repository/CommunityPostRepository.java` | `incrementLikeCount`, `decrementLikeCount` 추가 |
| `web/dto/LikeToggleResponse.java` | 신규 생성 — `record(boolean liked, int likeCount)` |

**추가된 API 엔드포인트**

```
POST /api/community/posts/{postId}/like
Body: { "authorNickname": "닉네임" }
Response: { "liked": true, "likeCount": 5 }
```

**좋아요 토글 정책**
- `post_like_logs`에 이미 존재하면 → 삭제 (취소) + `likeCount - 1`
- 존재하지 않으면 → 추가 (등록) + `likeCount + 1`
- 음수 방지: `GREATEST(likeCount - 1, 0)` 적용

### 프론트엔드 변경 내역

| 파일 | 변경 내용 |
|------|----------|
| `services/communityService.ts` | `toggleLike` 추가 |
| `pages/PostDetailPage.tsx` | `useMutation`으로 좋아요 API 호출, 서버 응답값으로 liked/likeCount 업데이트 |

---

## 우선순위 3: 마이페이지 — 완료

### 백엔드 변경 내역

| 파일 | 변경 내용 |
|------|----------|
| `web/controller/CommunityController.java` | 마이페이지 엔드포인트 2개 추가 |
| `service/CommunityService.java` | `getMyPosts`, `getMyComments` 추가 |
| `domain/repository/CommunityPostRepository.java` | `findByAuthorNicknameOrderByCreatedAtDesc` 추가 |
| `domain/repository/CommentRepository.java` | `findByAuthorNicknameOrderByCreatedAtDesc` 추가 |

**추가된 API 엔드포인트**

```
GET /api/community/my/posts?nickname=xxx     내가 쓴 게시글 목록
GET /api/community/my/comments?nickname=xxx  내가 쓴 댓글 목록
```

### 프론트엔드 변경 내역

| 파일 | 변경 내용 |
|------|----------|
| `services/communityService.ts` | `fetchMyPosts`, `fetchMyComments` 추가 |
| `components/features/mypage/MyPostList.tsx` | "준비 중" → 실제 API 데이터 렌더링, 게시글 클릭 시 상세 이동 |
| `components/features/mypage/MyCommentList.tsx` | "준비 중" → 실제 API 데이터 렌더링 |

---

## 우선순위 4: 버그 수정

### 완료된 항목

| 파일 | 버그 | 수정 |
|------|------|------|
| `config/WebMvcConfig.java` | DELETE CORS 미허용 | `allowedMethods`에 `"DELETE"` 추가 |
| `ApartmentTradePage.tsx` | `sale[sale.length-2]` 배열 길이 체크 없음 | `if (sale.length < 2) return 0` 분기 이미 존재 — 해당 없음 |
| `service/ApartmentService.java` | `keyword.trim()` 이중 호출 | 변수 추출로 중복 제거 |
| `domain/entity/CommunityPost.java` | `@PrePersist` 중복 null 체크 | 불필요한 null 체크 제거 |
| `domain/repository/PostViewLogRepository.java` | 미사용 메서드 잔존 | `existsByPostIdAndAptIdAndCreatedAtAfter` 제거 |

### 추가 완료 항목

| 파일 | 버그 | 수정 |
|------|------|------|
| `collect/RealTradeCollector.java` | WebClient 타임아웃 예외 미처리 | try-catch + log.error 추가, 실패 시 해당 월 수집 중단 후 계속 진행 |
| `MapView.tsx` | 지도 idle 이벤트 리스너 미제거 (메모리 누수) | 핸들러 함수를 ref에 저장, 언마운트 시 `removeListener` 호출 |
| `SignupPage.tsx` | `userId` 항상 1로 하드코딩 | `Date.now()`로 교체 (실 인증 구현 전 임시) |

---

## 우선순위 5: 로그인 / 회원가입 (미착수 — 별도 스프린트)

> **선행 조건**: Supabase Auth 또는 Spring Security + JWT 서버 구현이 먼저 필요.
> 현재 Spring Boot 백엔드에 인증 서버 없음.

### 필요 작업

**백엔드**
1. Spring Security + JWT 의존성 추가
2. `UserEntity` + `UserRepository` 생성
3. 엔드포인트 구현
   - `POST /api/auth/signup` — 회원가입
   - `POST /api/auth/login` — 로그인 (JWT 발급)
   - `POST /api/auth/logout` — 로그아웃
4. JWT 검증 필터 (`JwtAuthenticationFilter`) 등록
5. 이메일 인증 여부에 따라 `status: MEMBER / VERIFIED` 구분

**프론트엔드**
1. `LoginPage.tsx` / `SignupPage.tsx` mock 코드 제거
2. 실제 API 호출로 교체
3. JWT 토큰 `localStorage` 저장 및 `Authorization: Bearer` 헤더 포함
4. `useUserStore` — 서버 응답 기반으로 `userId`, `nickname`, `status` 업데이트

---

## 전체 수정 파일 목록

### 백엔드

```
config/WebMvcConfig.java                        DELETE CORS 추가
web/controller/CommunityController.java          댓글/좋아요/마이페이지 엔드포인트
service/CommunityService.java                    댓글/좋아요/마이페이지 로직
domain/repository/CommentRepository.java         쿼리 메서드 추가
domain/repository/PostLikeLogRepository.java     쿼리 메서드 추가
domain/repository/CommunityPostRepository.java   작성자 조회 + 카운트 UPDATE
web/dto/CommentDto.java                          신규
web/dto/CreateCommentRequest.java                신규
web/dto/LikeToggleResponse.java                  신규
```

### 프론트엔드

```
types/index.ts                                   Comment 타입 수정
services/communityService.ts                     댓글/좋아요/마이페이지 API 함수
pages/PostDetailPage.tsx                         댓글/좋아요 실제 연동
components/features/post/CommentInput.tsx         댓글 작성 API 호출
components/features/post/CommentItem.tsx          댓글 삭제 버튼 (본인만)
components/features/post/CommentList.tsx          currentNickname/onDelete prop
components/features/mypage/MyPostList.tsx         실제 데이터 연동
components/features/mypage/MyCommentList.tsx      실제 데이터 연동
```

---

## 기능 검증 방법

| 기능 | 검증 절차 |
|------|----------|
| 댓글 작성 | 게시글 상세 진입 → 댓글 입력 → 전송 → 새로고침 후 댓글 유지 확인 |
| 댓글 삭제 | 본인 댓글에 삭제 버튼 노출 확인 → 클릭 후 목록에서 제거 확인 |
| 댓글 권한 | 타인 댓글에 삭제 버튼 없음 확인 |
| 좋아요 토글 | 좋아요 클릭 → likeCount +1 → 재클릭 시 -1 → 새로고침 후 상태 유지 |
| 마이페이지 | 게시글/댓글 작성 후 마이페이지 접근 → 목록에 표시 확인 |
| CORS | 브라우저 Network 탭에서 DELETE/POST 요청에 CORS 에러 없음 확인 |

---

## API 전체 목록 (커뮤니티)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/community/posts?aptId={id}&category={}&sortType={}` | 게시글 목록 |
| POST | `/api/community/posts` | 게시글 작성 |
| GET | `/api/community/posts/{id}` | 게시글 상세 |
| GET | `/api/community/posts/popular?aptId={id}` | 인기 게시글 |
| GET | `/api/community/posts/hot-comments?aptId={id}` | 댓글 많은 게시글 |
| GET | `/api/community/{aptId}/keywords` | 인기 키워드 |
| GET | `/api/community/posts/{postId}/comments` | 댓글 목록 |
| POST | `/api/community/posts/{postId}/comments` | 댓글 작성 |
| DELETE | `/api/community/comments/{commentId}?authorNickname={}` | 댓글 삭제 |
| POST | `/api/community/posts/{postId}/like` | 좋아요 토글 |
| GET | `/api/community/my/posts?nickname={}` | 내가 쓴 게시글 |
| GET | `/api/community/my/comments?nickname={}` | 내가 쓴 댓글 |

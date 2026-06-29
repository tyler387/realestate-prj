# 📄 Supabase 기반 데이터 전환 및 통합 관리 PRD
## v4.0 | 검증 완료 | React + Supabase 구현용

> **범위**: 프로젝트 전체 더미 데이터 → Supabase(PostgreSQL) 전환
> **연관 PRD**: 인증 v2 / 커뮤니티 컨텍스트 v3 / 사이드바 v3 / 실거래 v2 / 광고 v3
>
> **v4 검증 변경 요약**:
> - 스키마 실행 순서 순환 참조 위험 → `apartments` 먼저, `users`에서 apartments FK는 ALTER TABLE로 분리
> - `comment_count` 트리거 누락 → 추가
> - `toggleLike` `.single()` 에러 처리 버그 → `maybeSingle()` 으로 교체
> - `users: read own` RLS가 PostCard 닉네임 표시를 막음 → 닉네임은 공개 조회 허용 정책 분리
> - `fetchPosts` 반환 타입과 기존 `Post.nickname` 구조 불일치 → 매핑 함수 추가
> - `handle_new_user` 카카오 닉네임 필드명 차이 → 다중 fallback 처리
> - seed UUID 형식 비표준 → `gen_random_uuid()` 방식으로 교체
> - `supabase gen types` 커맨드 구버전 → 최신 CLI 명령어로 수정
> - `onAuthStateChange` 초기 세션 미감지 → `getSession()` 초기화 추가

---

# 1. 개요

## 목적

프로젝트 전체의 더미 데이터(Mock Data)를 제거하고
모든 데이터를 Supabase(PostgreSQL) 기반으로 통합 관리.

## 기대 효과

- 단일 데이터 소스 (Single Source of Truth)
- 실제 서비스 데이터 기반 개발
- 커뮤니티 / 지도 / 인증 기능 확장 대응
- 기존 더미 데이터 의존 구조 완전 제거

---

# 2. 시스템 아키텍처

## MVP 구조 (이 PRD 범위)

```
Frontend (React)
      ↓
Supabase Client SDK (@supabase/supabase-js)
      ↓
Supabase (PostgreSQL + Auth + Storage + RLS)
```

## Spring 연동 구조 (Phase 3 이후, 별도 PRD)

```
Frontend (React)
      ↓
Spring Boot API
      ↓
Supabase DB (직접 연결)
```

## 기존 Spring API 전환 관계

| 기존 API | 전환 방식 |
|---------|---------|
| `GET /api/community/posts` | Supabase `posts` 직접 쿼리 |
| `GET /api/apartments/search` | Supabase `apartments` 직접 쿼리 |
| `GET /api/apartments/popular` | Supabase 쿼리 또는 RPC |
| `GET /api/map/apartments` | Supabase 좌표 범위 쿼리 |
| `POST /api/ads/*` | **유지** — 광고 트래킹은 별도 서버 |

> `/api/ads` 트래킹은 Supabase 미전환. 광고는 외부 시스템 연동 예정.

---

# 3. 타입 불일치 해결

## 3.1 userStore 타입 변경 (number → string)

> Supabase PK는 `uuid` = `string`. 기존 `userStore.userId`, `userStore.apartmentId`는 `number | null`.
> **userStore 타입 전체를 `string | null`로 변경하는 것이 첫 번째 작업.**

```ts
// stores/userStore.ts

type UserState = {
  userId:                string | null   // uuid
  nickname:              string | null
  status:                'GUEST' | 'MEMBER' | 'VERIFIED'
  apartmentId:           string | null   // uuid — 현재 탐색 아파트
  apartmentName:         string | null
  verifiedApartmentId:   string | null   // uuid — 인증된 거주 아파트 (신규)
  verifiedApartmentName: string | null   // (신규)

  setUser: (user: Partial<Omit<UserState, 'setUser' | 'logout'>>) => void
  logout:  () => void
}
```

## 3.2 AppLayout 변환 제거

```tsx
// 기존 (커뮤니티 컨텍스트 PRD v3)
const aptIdStr = apartmentId != null ? String(apartmentId) : 'apt-001'

// 변경 후 — 이미 string이므로 변환 불필요
const aptIdStr = apartmentId ?? ''
```

## 3.3 toApartmentId 유틸 제거

```
아파트 검색 팝업 v3의 toApartmentId() 함수 제거.
Supabase aptId는 uuid string 그대로 사용.
userStore.setUser({ apartmentId: apt.id })
```

---

# 4. 데이터베이스 스키마 및 실행 순서

> ⚠️ **[수정]** v3에서 `users` 테이블 DDL 내부에 `REFERENCES apartments(id)`가 있어
> `apartments` 테이블이 없으면 실패.
> 해결: `users`에서 apartments FK를 `ALTER TABLE`로 분리해 순환 참조 방지.

## 실행 순서

```
1. apartments   (다른 테이블에 의존 없음)
2. users        (auth.users 참조만, apartments FK는 ALTER로 분리)
3. ALTER TABLE users ADD FOREIGN KEY  (apartments 생성 후)
4. posts        (apartments + users 참조)
5. comments     (posts + users 참조)
6. likes        (posts + users 참조)
7. 트리거 함수 및 트리거
8. RLS 정책
```

---

## 4.1 apartments

```sql
CREATE TABLE apartments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  lat         NUMERIC(10, 7) NOT NULL,
  lng         NUMERIC(10, 7) NOT NULL,
  households  INTEGER,
  built_year  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apartments_location ON apartments(lat, lng);
CREATE INDEX idx_apartments_name     ON apartments(name);
```

---

## 4.2 users

```sql
-- auth.users 참조만 먼저 생성
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'MEMBER'
                CHECK (status IN ('MEMBER', 'VERIFIED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- apartments 생성 후 FK 추가
ALTER TABLE users
  ADD COLUMN apartment_id          UUID REFERENCES apartments(id) ON DELETE SET NULL,
  ADD COLUMN verified_apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL;
```

> `GUEST` = Supabase Auth 세션 없는 상태. DB에 저장 안 함.

---

## 4.3 posts

```sql
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'FREE'
                  CHECK (category IN ('FREE', 'QNA', 'INFO', 'COMPLAINT', 'TRADE')),
  like_count    INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_apartment ON posts(apartment_id);
CREATE INDEX idx_posts_user      ON posts(user_id);
CREATE INDEX idx_posts_created   ON posts(apartment_id, created_at DESC);
CREATE INDEX idx_posts_popular   ON posts(apartment_id, like_count DESC);
```

> `like_count` / `comment_count`: denormalize 방식.
> 좋아요·댓글 insert/delete 시 트리거로 자동 업데이트.
> 이유: 목록 조회 시 매번 집계 쿼리를 실행하면 성능 저하.

---

## 4.4 comments

```sql
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
```

---

## 4.5 likes

```sql
CREATE TABLE likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);
```

---

## 4.6 트리거 — like_count 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION fn_increment_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_like_insert
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION fn_increment_like_count();

-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_decrement_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_like_delete
AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION fn_decrement_like_count();
```

---

## 4.7 트리거 — comment_count 자동 업데이트

> ⚠️ **[추가]** v3에서 누락됨.

```sql
CREATE OR REPLACE FUNCTION fn_increment_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_insert
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION fn_increment_comment_count();

-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_decrement_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_comment_delete
AFTER DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION fn_decrement_comment_count();
```

---

# 5. Row Level Security (RLS) 전체

## 5.1 users

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ⚠️ [수정] v3의 "본인만 조회" 정책은 PostCard 닉네임 표시를 막음.
-- 닉네임은 공개 조회 허용, 민감 정보(apartment_id 등)는 본인만 허용.

-- 닉네임 공개 조회 (비로그인 포함)
CREATE POLICY "users: read nickname public"
ON users FOR SELECT
USING (true);
-- 단, 실제 서비스에서는 필요한 컬럼만 SELECT 제한 권장.
-- 민감 컬럼 보호는 컬럼 레벨 보안 또는 View로 처리.

-- 본인 프로필 수정
CREATE POLICY "users: update own"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 회원가입 시 insert (auth 트리거로 자동 처리 — 직접 insert 차단)
CREATE POLICY "users: insert own"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

## 5.2 apartments

```sql
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

-- 전체 조회 허용 (비로그인 포함)
CREATE POLICY "apartments: read all"
ON apartments FOR SELECT
USING (true);

-- insert/update/delete: service_role 키로만 (RLS 정책 없음 = service_role만 가능)
```

## 5.3 posts

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts: read all"
ON posts FOR SELECT USING (true);

CREATE POLICY "posts: insert authenticated"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: update own"
ON posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "posts: delete own"
ON posts FOR DELETE
USING (auth.uid() = user_id);
```

## 5.4 comments

```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments: read all"
ON comments FOR SELECT USING (true);

CREATE POLICY "comments: insert authenticated"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments: delete own"
ON comments FOR DELETE
USING (auth.uid() = user_id);
```

## 5.5 likes

```sql
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes: read all"
ON likes FOR SELECT USING (true);

CREATE POLICY "likes: insert authenticated"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes: delete own"
ON likes FOR DELETE
USING (auth.uid() = user_id);
```

---

# 6. Supabase Auth 연동

## 6.1 인증 방식 매핑

| 기존 인증 PRD v2 | Supabase Auth |
|--------------|--------------|
| 이메일 + 비밀번호 | `supabase.auth.signUp()` / `signInWithPassword()` |
| 카카오 소셜 로그인 | `supabase.auth.signInWithOAuth({ provider: 'kakao' })` |
| Apple 소셜 로그인 | `supabase.auth.signInWithOAuth({ provider: 'apple' })` |
| 로그아웃 | `supabase.auth.signOut()` |

## 6.2 회원가입 시 users 테이블 자동 생성 트리거

> ⚠️ **[수정]** v3에서 카카오 소셜 로그인 시 닉네임 필드명이
> `raw_user_meta_data->>'nickname'`이 아닐 수 있음.
> 카카오는 `kakao_account.profile.nickname` 구조.
> 다중 fallback으로 처리.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nickname TEXT;
BEGIN
  -- 닉네임 fallback: full_name → name → nickname → 자동 생성
  v_nickname := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nickname',
    '익명_' || substr(replace(NEW.id::text, '-', ''), 1, 6)
  );

  INSERT INTO public.users (id, nickname, status)
  VALUES (NEW.id, v_nickname, 'MEMBER')
  ON CONFLICT (id) DO NOTHING;   -- 중복 방지

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 6.3 초기 세션 + 세션 변경 감지

> ⚠️ **[수정]** v3에서 `onAuthStateChange`만 등록하면
> 앱 진입 시 이미 로그인된 세션을 감지 못함.
> `getSession()`으로 초기 세션을 별도 확인.

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)
```

```ts
// 세션 → userStore 동기화 유틸
const syncUserFromSession = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('users')
    .select('nickname, status, apartment_id, verified_apartment_id')
    .eq('id', userId)
    .single()

  if (error || !profile) return

  // apartments 이름 조회
  let aptName: string | null = null
  if (profile.apartment_id) {
    const { data: apt } = await supabase
      .from('apartments')
      .select('name')
      .eq('id', profile.apartment_id)
      .single()
    aptName = apt?.name ?? null
  }

  useUserStore.getState().setUser({
    userId:                userId,
    nickname:              profile.nickname,
    status:                (profile.status as AuthStatus) ?? 'MEMBER',
    apartmentId:           profile.apartment_id ?? null,
    apartmentName:         aptName,
    verifiedApartmentId:   profile.verified_apartment_id ?? null,
    verifiedApartmentName: null,   // 필요 시 동일 방식으로 조회
  })
}
```

```ts
// App.tsx 또는 AuthProvider

// 1. 앱 진입 시 기존 세션 확인 (onAuthStateChange 보다 먼저)
const { data: { session } } = await supabase.auth.getSession()
if (session?.user) {
  await syncUserFromSession(session.user.id)
}

// 2. 이후 세션 변경 감지
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await syncUserFromSession(session.user.id)
  }
  if (event === 'SIGNED_OUT') {
    useUserStore.getState().logout()
  }
})
```

---

# 7. React Query + Supabase Client 패턴

## 7.1 supabase 클라이언트 생성

```ts
// lib/supabase.ts (위 섹션 6.3 동일)
```

## 7.2 fetchPosts + 반환 타입 매핑

> ⚠️ **[수정]** Supabase가 반환하는 `users(nickname)` 중첩 객체는
> 기존 `Post.nickname: string` 구조와 다름.
> 매핑 함수로 변환.

```ts
// services/communityService.ts

const fetchPosts = async (
  aptId:    string,
  category: string,
  sortType: 'latest' | 'popular'
): Promise<Post[]> => {
  if (!aptId) return []

  let query = supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      category,
      like_count,
      comment_count,
      created_at,
      apartment_id,
      users ( nickname )
    `)
    .eq('apartment_id', aptId)

  if (category !== 'ALL') query = query.eq('category', category)

  query = sortType === 'popular'
    ? query.order('like_count', { ascending: false })
    : query.order('created_at', { ascending: false })

  const { data, error } = await query.range(0, 19)
  if (error) throw error

  // ⚠️ Supabase 중첩 객체 → Post 타입 매핑
  return (data ?? []).map(row => ({
    id:           row.id,
    title:        row.title,
    content:      row.content,
    category:     mapCategory(row.category),   // DB 영문값 → UI 한글값
    likeCount:    row.like_count,
    commentCount: row.comment_count,
    createdAt:    formatRelativeTime(row.created_at),
    apartmentId:  row.apartment_id,
    nickname:     Array.isArray(row.users)
                    ? row.users[0]?.nickname ?? '익명'
                    : (row.users as any)?.nickname ?? '익명',
    apartmentName: '',   // 필요 시 apartments join으로 추가
  }))
}

// 카테고리 DB값 → UI 한글값 매핑
const mapCategory = (dbCategory: string): string => {
  const map: Record<string, string> = {
    FREE:      '자유',
    QNA:       '질문',
    INFO:      '정보',
    COMPLAINT: '민원',
    TRADE:     '거래',
  }
  return map[dbCategory] ?? dbCategory
}
```

## 7.3 아파트 검색

```ts
// services/apartmentService.ts

const searchApartments = async (keyword: string) => {
  const { data, error } = await supabase
    .from('apartments')
    .select('id, name, address, lat, lng')
    .or(`name.ilike.%${keyword}%,address.ilike.%${keyword}%`)
    .limit(10)

  if (error) throw error
  return data ?? []
}
```

## 7.4 지도 범위 아파트 조회

```ts
const fetchMapApartments = async (bounds: MapBounds) => {
  const { data, error } = await supabase
    .from('apartments')
    .select('id, name, lat, lng')
    .gte('lat', bounds.minLat)
    .lte('lat', bounds.maxLat)
    .gte('lng', bounds.minLng)
    .lte('lng', bounds.maxLng)
    .limit(100)

  if (error) throw error
  return data ?? []
}
```

## 7.5 좋아요 토글

> ⚠️ **[수정]** v3에서 `.single()`은 결과가 0개면 에러를 throw.
> 좋아요가 없는 경우를 정상으로 처리해야 하므로 **`.maybeSingle()`** 사용.

```ts
// services/likeService.ts

const toggleLike = async (postId: string, userId: string) => {
  // maybeSingle(): 0개이면 null 반환 (에러 없음)
  const { data: existing, error: checkError } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (checkError) throw checkError

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw error
    return { liked: false }
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId })
    if (error) throw error
    return { liked: true }
  }
}
```

## 7.6 게시글 작성

```ts
const createPost = async (params: {
  apartmentId: string
  userId:      string
  title:       string
  content:     string
  category:    string
}) => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      apartment_id: params.apartmentId,
      user_id:      params.userId,
      title:        params.title,
      content:      params.content,
      category:     params.category,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

# 8. 환경변수

```bash
# .env.local (반드시 .gitignore에 추가)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# ⚠️ SERVICE_ROLE 키는 절대 프론트엔드에 노출 금지
# 서버 사이드(Spring) 전용
```

```
# .gitignore에 추가
.env.local
.env.*.local
```

---

# 9. Supabase 타입 자동 생성

> ⚠️ **[수정]** v3의 `supabase gen types typescript --project-id` 는 구버전 CLI.
> 최신 CLI 명령어로 수정.

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 타입 생성 (최신 CLI)
supabase gen types --lang typescript \
  --project-id YOUR_PROJECT_REF \
  > src/types/database.ts

# 또는 로컬 Supabase 인스턴스 사용 시
supabase gen types --lang typescript --local > src/types/database.ts
```

---

# 10. 초기 데이터 SQL (seed)

> ⚠️ **[수정]** v3의 seed UUID `a1b2c3d4-0000-...` 형식은 비표준.
> `gen_random_uuid()`로 교체. 단, FK 참조를 위해 변수로 저장.

```sql
-- seed.sql
-- apartments 초기 데이터
INSERT INTO apartments (name, address, lat, lng, households, built_year) VALUES
('잠실엘스',          '서울 송파구 잠실동',  37.5110000, 127.0870000, 1678, 2008),
('헬리오시티',         '서울 송파구 가락동',  37.4980000, 127.1210000, 9510, 2018),
('래미안퍼스티지',     '서울 서초구 반포동',  37.5050000, 126.9980000, 2444, 2009),
('아크로리버파크',     '서울 서초구 반포동',  37.5060000, 126.9970000, 1612, 2016),
('마포래미안푸르지오', '서울 마포구 아현동',  37.5490000, 126.9540000, 3885, 2014);

-- posts 초기 데이터 — 실제 auth 계정 생성 후 아래 쿼리 실행
-- (Supabase Dashboard > Authentication에서 테스트 계정 생성 후 uuid 대체)
--
-- DO $$
-- DECLARE
--   v_user_id  UUID := '실제_테스트_유저_UUID';
--   v_apt_id   UUID := (SELECT id FROM apartments WHERE name = '잠실엘스' LIMIT 1);
-- BEGIN
--   INSERT INTO posts (apartment_id, user_id, title, content, category) VALUES
--     (v_apt_id, v_user_id, '헬스장 이용 시간 변경되었나요?',
--      '최근 운영 시간이 바뀐 것 같은데 공지 확인하신 분 계신가요?', 'QNA'),
--     (v_apt_id, v_user_id, '관리비 고지서 확인하세요',
--      '이번 달 관리비가 인상되었습니다.', 'INFO'),
--     (v_apt_id, v_user_id, '주차 문제 어떻게 생각하세요?',
--      '방문 차량이 많아서 거주자 주차 공간이 부족한 것 같아요.', 'FREE');
-- END $$;
```

---

# 11. mock 플래그 제거 전략

## 현재 플래그 목록

| 플래그 | 파일 | 전환 Phase |
|--------|------|----------|
| `USE_MOCK_POSTS` | `featureFlags.ts` | Phase 1 |
| `USE_MOCK_SEARCH` | `featureFlags.ts` | Phase 1 |
| `USE_KAKAO_MAP` | `featureFlags.ts` | Phase 2 |
| `USE_MOCK_AD` | `featureFlags.ts` | Phase 3 이후 유지 |

## Phase별 전환 순서

```
Phase 1 (커뮤니티 기반):
  USE_MOCK_POSTS  → false   communityService.ts → Supabase
  USE_MOCK_SEARCH → false   apartmentService.ts → Supabase

Phase 2 (지도):
  USE_KAKAO_MAP   → true    KakaoMap SDK 설치 + Supabase 마커 쿼리

Phase 3 (완전 전환):
  더미 파일 전체 삭제
  USE_MOCK_AD는 외부 광고 시스템 연동 시점에 별도 결정
```

---

# 12. 마이그레이션 실행 순서

## Phase 1

```
Step 1.  Supabase 프로젝트 생성
Step 2.  .env.local 환경변수 설정
Step 3.  userStore string 타입 전환 (섹션 3)
Step 4.  스키마 실행 (섹션 4 — 순서 준수)
Step 5.  트리거 실행 (섹션 4.6, 4.7, 6.2)
Step 6.  RLS 실행 (섹션 5 전체)
Step 7.  seed.sql 실행 (apartments)
Step 8.  lib/supabase.ts 생성
Step 9.  supabase.auth.getSession() 초기화 추가 (섹션 6.3)
Step 10. communityService.ts → Supabase 쿼리 교체
Step 11. apartmentService.ts → Supabase 쿼리 교체
Step 12. USE_MOCK_POSTS = false, USE_MOCK_SEARCH = false
Step 13. 타입 자동 생성 (섹션 9)
```

## Phase 2

```
Step 14. KakaoMap JS SDK 설치
Step 15. USE_KAKAO_MAP = true
Step 16. 지도 마커 API → Supabase 좌표 범위 쿼리 (섹션 7.4)
```

## Phase 3

```
Step 17. 좋아요 Supabase 연동 (섹션 7.5)
Step 18. 댓글 Supabase 연동
Step 19. 사용자 인증 Supabase Auth 완전 전환
Step 20. mock 파일 전체 삭제
Step 21. 실거래 데이터 → 외부 API 또는 Supabase 테이블
```

---

# 13. 파일 구조

```
src/
├── lib/
│   └── supabase.ts                    ← createClient + 세션 초기화
├── services/
│   ├── communityService.ts            ← posts CRUD
│   ├── apartmentService.ts            ← apartments 검색/조회
│   ├── commentService.ts              ← comments CRUD
│   ├── likeService.ts                 ← likes 토글 (maybeSingle)
│   └── userService.ts                 ← users 프로필
├── config/
│   └── featureFlags.ts                ← USE_MOCK_* 플래그 중앙 관리
└── types/
    └── database.ts                    ← supabase gen types 자동 생성
```

---

# 14. 성능 전략

| 항목 | 방법 |
|------|------|
| 게시글 목록 | `.range(0, 19)` pagination |
| 좌표 범위 | `idx_apartments_location` (lat, lng 복합) |
| 게시글 조회 | `idx_posts_created` (apartment_id + created_at) |
| 인기글 조회 | `idx_posts_popular` (apartment_id + like_count) |
| like_count / comment_count | denormalize + 트리거 자동 업데이트 |
| 사이드바 쿼리 | React Query `staleTime: 5분` |
| 아파트 검색 | `.ilike()` + `idx_apartments_name` |

---

# 15. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| RLS 오류 → 데이터 노출 | Phase 1에서 RLS 검증 필수, service_role 키 서버 외 금지 |
| uuid vs number 타입 혼재 | userStore string 전환(섹션 3)을 스키마 적용 전에 완료 |
| like_count 트리거 실패 | fallback: `COUNT(*) FROM likes` 집계 쿼리 |
| comment_count 트리거 실패 | fallback: `COUNT(*) FROM comments` 집계 쿼리 |
| ANON_KEY 노출 | `.env.local` `.gitignore` 필수, RLS로 권한 제한 |
| 닉네임 조회 차단 | users RLS를 공개 조회 허용으로 유지 (섹션 5.1) |
| seed posts user_id | 테스트 계정 uuid 확보 후 posts seed 실행 |

---

# 16. Definition of Done

```
Phase 1 완료:
  ✅ 스키마 전체 생성 (순서 준수)
  ✅ 트리거 4개 적용 (like +/- , comment +/-)
  ✅ RLS 5개 테이블 적용
  ✅ apartments seed 데이터 insert
  ✅ userStore string 타입 전환 완료
  ✅ getSession() 초기화 적용
  ✅ CommunityPage 게시글 Supabase 조회
  ✅ ApartmentSearchModal 검색 Supabase 조회
  ✅ USE_MOCK_POSTS = false, USE_MOCK_SEARCH = false

Phase 2 완료:
  ✅ KakaoMap SDK 연동 (USE_KAKAO_MAP = true)
  ✅ 지도 마커 Supabase 쿼리

Phase 3 완료:
  ✅ 좋아요 / 댓글 Supabase 연동
  ✅ Supabase Auth 완전 전환
  ✅ mock 파일 전체 삭제
  ✅ database.ts 타입 최신화
```

---

# 17. 최종 생성 요구사항

1. **타입 먼저** — userStore `string | null` 전환, `toApartmentId()` 제거
2. **스키마 순서** — `apartments` → `users(FK 없이)` → `ALTER TABLE users ADD COLUMN` → `posts` → `comments` → `likes`
3. **트리거 4개** — `like_count` +/- , `comment_count` +/- (모두 필수)
4. **RLS 전체** — 5개 테이블 빠짐없이 적용
5. **`users` 닉네임 공개 조회** — `USING (true)` 정책 필수 (PostCard 표시용)
6. **`handle_new_user` 트리거** — 닉네임 다중 fallback (full_name → name → nickname → 자동)
7. **`getSession()` 초기화** — `onAuthStateChange` 등록 전에 먼저 실행
8. **`.maybeSingle()`** — `toggleLike` 에서 반드시 사용 (`.single()` 사용 금지)
9. **`mapCategory()`** — DB 영문값 → UI 한글값 변환 함수
10. **Supabase 반환 타입 매핑** — `users(nickname)` 중첩 객체 → `Post.nickname: string` 변환
11. **`supabase gen types --lang typescript`** — 최신 CLI 명령어 사용
12. **seed UUID** — `gen_random_uuid()` 방식, 직접 지정 금지
13. **광고 API 유지** — `/api/ads` Supabase 미전환
14. **Phase 순서 준수** — 타입 → 스키마 → RLS → Auth → Phase 1 플래그

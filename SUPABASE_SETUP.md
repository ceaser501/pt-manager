# Supabase 설정 가이드

이 문서는 PT 운동일지 시스템을 Supabase와 연결하는 방법을 단계별로 안내합니다.

## 필요한 정보

Supabase 연동을 위해 다음 두 가지 정보가 필요합니다:

1. **SUPABASE_URL** - 프로젝트 URL
2. **SUPABASE_ANON_KEY** - Anonymous (공개) API 키

---

## 1단계: Supabase 프로젝트 생성

### 1.1 회원가입 및 로그인
1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 버튼 클릭
3. GitHub 계정으로 로그인 (또는 이메일로 회원가입)

### 1.2 새 프로젝트 생성
1. 대시보드에서 "New Project" 버튼 클릭
2. 프로젝트 정보 입력:
   - **Name**: `pt-workout-assistant` (원하는 이름 입력)
   - **Database Password**: 강력한 비밀번호 생성 (꼭 저장해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서버)
   - **Pricing Plan**: `Free` 선택
3. "Create new project" 버튼 클릭
4. 프로젝트 생성 완료까지 약 2분 대기

---

## 2단계: API 키 확인

### 2.1 프로젝트 설정으로 이동
1. 왼쪽 사이드바에서 **⚙️ Settings** 클릭
2. **API** 메뉴 선택

### 2.2 필요한 정보 복사
다음 정보를 복사해둡니다:

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
- **Configuration > URL** 항목에 있습니다
- `xxxxxxxxxxxxx`는 프로젝트마다 다른 고유 ID입니다

#### anon public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...
```
- **Project API keys > anon public** 항목에 있습니다
- 매우 긴 문자열입니다 (복사 버튼 사용)
- ⚠️ **주의**: `service_role` 키는 절대 사용하지 마세요! (보안 위험)

---

## 3단계: 데이터베이스 테이블 생성

### 3.1 SQL Editor 열기
1. 왼쪽 사이드바에서 **🔧 SQL Editor** 클릭
2. "+ New query" 버튼 클릭

### 3.2 SQL 스크립트 실행
1. 프로젝트 폴더의 `supabase-schema.sql` 파일을 엽니다
2. 전체 내용을 복사합니다
3. SQL Editor에 붙여넣기
4. 오른쪽 하단의 **"Run"** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
5. 성공 메시지 확인: "Success. No rows returned"

### 3.3 테이블 생성 확인
1. 왼쪽 사이드바에서 **📊 Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `members` (회원)
   - ✅ `workout_logs` (운동일지)
   - ✅ `exercises` (운동 종목)
   - ✅ `exercise_sets` (운동 세트)
   - ✅ `workout_references` (참고자료)

---

## 4단계: 환경설정 파일에 API 키 입력

### 4.1 config.js 파일 생성

**한 곳에서만 수정하면 모든 페이지에 적용됩니다!**

1. 프로젝트 폴더에서 `config.example.js` 파일을 찾습니다
2. 이 파일을 복사하여 `config.js`로 이름을 변경합니다
   - Windows: 파일 우클릭 > 복사 > 붙여넣기 > 이름을 `config.js`로 변경
   - Mac: 파일 선택 > Cmd+D (복제) > 이름을 `config.js`로 변경

### 4.2 config.js 파일 수정

생성한 `config.js` 파일을 엽니다:

```javascript
// 수정 전
const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    ...
};
```

2단계에서 복사한 정보로 변경합니다:

```javascript
// 수정 후
const CONFIG = {
    SUPABASE_URL: 'https://xxxxxxxxxxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    ...
};
```

⚠️ **주의사항:**
- `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 값만 변경하세요
- 작은따옴표('')를 삭제하지 마세요
- 줄 끝의 쉼표(,)를 삭제하지 마세요

### 4.3 저장 및 확인
1. `config.js` 파일 저장
2. 브라우저에서 `index.html` 열기
3. 개발자 도구 (F12) > Console 탭 확인
4. 에러가 없으면 성공!

💡 **참고:**
- `config.js` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다 (보안)
- 다른 컴퓨터에서 작업할 때는 `config.example.js`를 복사하여 다시 설정하면 됩니다

---

## 5단계: 첫 회원 등록

### 5.1 회원 관리 페이지 접속
1. 브라우저에서 `member-management.html` 열기
2. 또는 메인 페이지에서 "회원 관리" 버튼 클릭

### 5.2 회원 정보 입력
필수 항목만 입력해도 됩니다:
- **이름**: 홍길동 (필수)
- **나이**: 30
- **키**: 175.5
- **체중**: 75.0
- 나머지 항목은 선택사항

### 5.3 등록 완료
1. "회원 등록" 버튼 클릭
2. 성공 메시지 확인
3. 아래 회원 목록에 추가된 것 확인

---

## 6단계: 운동일지 저장 테스트

### 6.1 메인 페이지로 이동
1. `index.html` 열기
2. 또는 "운동일지 작성" 버튼 클릭

### 6.2 운동일지 입력
1. **회원 선택** 드롭다운에서 등록한 회원 선택
2. 왼쪽 텍스트 영역에 운동일지 붙여넣기:

```
25년 10월 27일

☑️ 아침에 일어나니, 팔꿈치 안쪽 불편감 발생

📌오늘의 운동
1. 숄더 프레스 (15kg x 12회, 25kg x 12회, 35kg x 12회, 40kg x 12회) - 4세트
2. 시티드 밀리터리 프레스 (30kg x 12회) - 4세트

💬 코멘트
어깨 힘이 많이 좋아지셨습니다.
```

3. 오른쪽에서 파싱 결과 확인
4. "저장하기" 버튼 클릭
5. 성공 메시지 확인!

### 6.3 데이터베이스에서 확인
1. Supabase 대시보드 > Table Editor 이동
2. `workout_logs` 테이블 선택
3. 저장된 데이터 확인
4. `exercises`, `exercise_sets` 테이블도 확인

---

## 보안 설정 (선택사항)

### Row Level Security (RLS) 활성화

현재는 테스트를 위해 RLS가 비활성화되어 있습니다. 실제 운영 시에는 RLS를 활성화하는 것을 권장합니다.

#### RLS 활성화 방법
1. SQL Editor에서 다음 실행:

```sql
-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_references ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기 권한 부여 (POC용)
CREATE POLICY "Enable read access for all users" ON members FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON workout_logs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON exercises FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON exercise_sets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON workout_references FOR SELECT USING (true);

-- 모든 사용자에게 쓰기 권한 부여 (POC용)
CREATE POLICY "Enable insert for all users" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON workout_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON exercise_sets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON workout_references FOR INSERT WITH CHECK (true);

-- 업데이트 및 삭제 권한
CREATE POLICY "Enable update for all users" ON members FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON members FOR DELETE USING (true);
```

---

## 문제 해결

### ❌ "Failed to fetch" 에러
- **원인**: SUPABASE_URL이 잘못되었거나 인터넷 연결 문제
- **해결**: URL 확인, 인터넷 연결 확인

### ❌ "Invalid API key" 에러
- **원인**: SUPABASE_ANON_KEY가 잘못됨
- **해결**: anon public 키를 다시 복사 (service_role 키가 아님!)

### ❌ "relation does not exist" 에러
- **원인**: 테이블이 생성되지 않음
- **해결**: 3단계 SQL 스크립트 다시 실행

### ❌ "permission denied" 에러
- **원인**: RLS가 활성화되어 있지만 정책이 없음
- **해결**: 위의 RLS 정책 SQL 실행 또는 RLS 비활성화

### ❌ 회원 목록이 안 보임
- **원인**: API 키가 설정되지 않았거나 회원이 없음
- **해결**:
  1. 개발자 도구(F12) Console에서 에러 확인
  2. API 키 재확인
  3. 회원 등록 먼저 진행

---

## 유용한 링크

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

## 다음 단계

✅ Supabase 연동 완료!

이제 다음 기능을 추가할 수 있습니다:
- 운동일지 조회 및 수정 기능
- 회원별 운동 히스토리 분석
- OpenAI GPT-4o 연동하여 AI 어시스턴트 추가

---

문제가 있으면 개발자 도구(F12) Console 탭을 확인하세요!

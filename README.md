# PT 운동일지 AI 어시스턴트

PT 선생님의 업무를 지원하는 지능형 AI 어시스턴트 시스템 (POC)

## 주요 기능

- 카카오톡 운동일지 자동 파싱
- 회원 등록 및 관리 (UI 제공)
- 회원별 운동 데이터 저장 및 관리
- 운동 종목, 무게, 횟수 자동 정리
- 컨디션 체크 및 코멘트 기록
- 참고자료(유튜브 링크 등) 관리
- 달력 형태로 운동일지 조회

## 화면 구성

### 1. 운동일지 작성 페이지 (index.html)
- 카카오톡 운동일지 입력 및 자동 파싱
- 회원 선택 후 데이터 저장

### 2. 회원 관리 페이지 (member-management.html)
- 회원 등록/수정/삭제
- 회원 목록 조회
- 체성분 정보 관리

### 3. 운동일지 조회 페이지 (workout-history.html)
- 달력 형태로 운동일지 조회
- 회원별 운동한 날짜 표시
- 날짜 클릭 시 운동일지 상세 보기
- 월/년도별 이동 기능

## 설치 방법

> 자세한 Supabase 설정 방법은 **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** 문서를 참고하세요.

### 빠른 시작 (3단계)

1. **Supabase 프로젝트 생성** 및 API 키 확보
2. **데이터베이스 테이블 생성** (`supabase-schema.sql` 실행)
3. **환경설정 파일에 API 키 입력** (`config.js` 파일 하나만 수정)

각 단계별 자세한 방법은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 문서를 확인하세요.

#### config.js 파일 생성 및 수정

1. `config.example.js` 파일을 복사하여 `config.js`로 이름 변경
2. `config.js` 파일을 열고 Supabase 정보를 입력:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://xxxxxxxxxxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    ...
};
```

**이 파일 하나만 수정하면 모든 페이지에서 사용됩니다!**

⚠️ `config.js` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다 (보안)

## 사용 방법

### 1. 회원 등록 (최초 1회)

1. 브라우저에서 `member-management.html` 파일을 엽니다.
2. 회원 정보를 입력합니다:
   - **이름** (필수)
   - 나이, 키, 체중
   - 골격근량, 체지방률 등 (선택사항)
3. "회원 등록" 버튼을 클릭합니다.
4. 등록된 회원이 목록에 표시됩니다.

### 2. 운동일지 입력

1. 브라우저에서 `index.html` 파일을 엽니다.
2. **회원 선택** 드롭다운에서 해당 회원을 선택합니다.
3. 왼쪽 텍스트 영역에 카카오톡 운동일지를 붙여넣습니다.
4. 오른쪽 화면에서 파싱된 결과를 확인합니다.
5. "저장하기" 버튼을 클릭하여 데이터베이스에 저장합니다.

### 3. 회원 정보 관리

- **수정**: 회원 목록에서 "수정" 버튼 클릭 → 정보 수정 → 저장
- **삭제**: 회원 목록에서 "삭제" 버튼 클릭 (관련 운동일지도 함께 삭제됨)

### 4. 운동일지 조회

1. 브라우저에서 `workout-history.html` 파일을 엽니다.
2. **회원 선택** 드롭다운에서 조회할 회원을 선택합니다.
3. 달력에서 💪 이모지가 있는 날짜가 운동한 날입니다.
4. 운동한 날짜를 클릭하면 오른쪽에 운동일지가 표시됩니다.
5. ◀ ▶ 버튼으로 이전/다음 달로 이동할 수 있습니다.

**달력 기능:**
- 💪 표시: 운동일지가 있는 날
- 날짜 클릭: 운동일지 상세 보기
- 황금색 테두리: 현재 선택된 날짜

### 운동일지 형식 예시

```
25년 10월 27일

☑️ 아침에 일어나니, 팔꿈치 안쪽 불편감 발생

📌오늘의 운동
1. 숄더 프레스 (15kg x 12회, 25kg x 12회, 35kg x 12회, 40kg x 12회) - 4세트
2. 시티드 밀리터리 프레스 (30kg x 12회) - 4세트
3. 케이블 사레레 (5kg x 12회) - 4세트

💬 코멘트
어깨 힘이 많이 좋아지셨습니다.
어깨가 좋아지면 분명 다른 상체 부위들도 좋아지기 마련입니다.

📍 링크
누워서 하는 동작
https://youtube.com/shorts/9IZbGzT_mLc?si=XKzvTtuIRtO7qHjd

서서하는 동작
https://youtube.com/shorts/w0zdj_Ey1-Y?si=VWmJ9IHfoT2yPSd8
```

## 데이터베이스 구조

### members 테이블
- 회원번호 (자동채번)
- 이름, 나이, 키, 체중
- 골격근량, 체지방량, 체지방률
- 복부지방률, 내장지방레벨
- 체수분, 기초대사량

### workout_logs 테이블
- 운동일지 ID
- 회원번호 (FK)
- 날짜
- 상태체크
- 코멘트

### exercises 테이블
- 운동 종목 ID
- 운동일지 ID (FK)
- 운동명
- 순서

### exercise_sets 테이블
- 세트 ID
- 운동 종목 ID (FK)
- 세트 번호
- 무게 (kg)
- 횟수

### workout_references 테이블
- 참고자료 ID
- 운동일지 ID (FK)
- 제목
- 설명
- URL
- 순서

## 🌐 GitHub Pages 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 배포됩니다.

### 배포 설정 방법

#### 1. GitHub 저장소 생성 및 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init

# 첫 커밋
git add .
git commit -m "Initial commit"

# GitHub 저장소에 연결
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

#### 2. GitHub Pages 활성화

1. GitHub 저장소 페이지에서 **Settings** 클릭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Source**에서 **GitHub Actions** 선택

#### 3. 자동 배포

- `main` 브랜치에 push하면 자동으로 배포됩니다
- **Actions** 탭에서 배포 진행 상황 확인
- 배포 완료 후 `https://YOUR_USERNAME.github.io/YOUR_REPO` 에서 확인

### ⚠️ 배포 시 중요 사항

**보안 주의:**
- `config.js` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- API 키는 절대 공개 저장소에 올리지 마세요
- 배포된 사이트에서는 `config.js`를 별도로 설정해야 합니다

**배포 후 설정:**
1. 배포된 사이트의 브라우저 콘솔에서 `config.js` 로드 오류 확인
2. 로컬 `config.js` 파일을 안전한 방법으로 배포 환경에 추가
3. 또는 환경 변수를 사용한 별도의 설정 방법 고려

## 향후 개발 계획

- [x] OpenAI GPT-4o 연동하여 AI 어시스턴트 기능 추가
- [x] 회원별 운동 히스토리 조회 기능 (달력 형태)
- [x] 회원 정보 관리 UI 추가
- [x] AI 상담 기능 (회원 데이터 기반)
- [ ] 운동 진척도 차트 및 분석 기능
- [ ] 운동일지 수정/삭제 기능
- [ ] 운동 부위별 카테고리 필터링 (어깨, 가슴, 다리 등)
- [ ] 운동 진행률 통계 (주간/월간)
- [ ] 무게/횟수 변화 추세 그래프

## 기술 스택

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o API
- **Deployment**: GitHub Pages (GitHub Actions)

## 라이선스

POC (Proof of Concept) - 개인 프로젝트

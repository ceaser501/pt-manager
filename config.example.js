// PT 운동일지 시스템 환경설정 파일 (예제)
// 이 파일을 'config.js'로 복사한 후 실제 값을 입력하세요
//
// 복사 방법:
// 1. 이 파일을 복사하여 'config.js'로 이름 변경
// 2. 아래 값들을 실제 Supabase 프로젝트 정보로 변경

const CONFIG = {
    // Supabase 설정
    // 아래 값들을 실제 Supabase 프로젝트 정보로 변경하세요
    //
    // 1. Supabase 대시보드 접속: https://supabase.com/dashboard
    // 2. 프로젝트 선택 > Settings > API 메뉴로 이동
    // 3. 아래 값들을 복사하여 입력:
    //    - Project URL → SUPABASE_URL
    //    - anon public key → SUPABASE_ANON_KEY

    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

    // OpenAI 설정 (AI 상담 기능에 필요)
    // 1. OpenAI Platform 접속: https://platform.openai.com/api-keys
    // 2. 'Create new secret key' 버튼 클릭
    // 3. 생성된 API 키를 아래에 입력
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY',

    // 애플리케이션 설정
    APP_NAME: 'PT 운동일지 AI 어시스턴트',
    VERSION: '1.0.0'
};

// CONFIG 객체를 전역으로 노출 (다른 파일에서 접근 가능)
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}

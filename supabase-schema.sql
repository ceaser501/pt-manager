-- ============================================================
-- PT 관리 시스템 데이터베이스 DDL (스키마 없는 버전)
-- Version: 1.3 (개선사항 반영)
-- Database: PostgreSQL 14+
-- Note: 모든 테이블이 public 스키마에 생성됩니다
-- ============================================================


-- ============================================================
-- MEDIA 영역
-- ============================================================

-- 미디어 파일 테이블
CREATE TABLE media (
    media_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_media PRIMARY KEY (media_id)
);

COMMENT ON TABLE media IS '이미지 파일 및 미디어 파일 정보';
COMMENT ON COLUMN media.media_id IS '미디어 ID';
COMMENT ON COLUMN media.file_name IS '파일명';
COMMENT ON COLUMN media.file_path IS '파일 경로';
COMMENT ON COLUMN media.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN media.file_extension IS '파일 확장자';


-- ============================================================
-- CORE 영역
-- ============================================================

-- 사용자 테이블
CREATE TABLE users (
    user_id VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    age INTEGER,
    birth_date DATE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address VARCHAR(200) NOT NULL,
    detail_address VARCHAR(200),
    zip_code VARCHAR(10) NOT NULL,
    profile_image_id VARCHAR(50),
    is_active VARCHAR(1) NOT NULL DEFAULT 'N',
    last_login_at TIMESTAMP,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT fk_users_profile_image FOREIGN KEY (profile_image_id) REFERENCES media(media_id),
    CONSTRAINT chk_users_role CHECK (role IN ('admin', 'trainer', 'member')),
    CONSTRAINT chk_users_gender CHECK (gender IN ('남', '여')),
    CONSTRAINT chk_users_is_active CHECK (is_active IN ('Y', 'N', 'H')),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone_number)
);

COMMENT ON TABLE users IS '사용자 테이블 (관리자, 트레이너, 회원 통합)';
COMMENT ON COLUMN users.user_id IS '사용자 ID (사용자 입력)';
COMMENT ON COLUMN users.password IS '비밀번호 (암호화 저장 필수)';
COMMENT ON COLUMN users.role IS '사용자 역할 (admin: 관리자, trainer: 트레이너, member: 회원)';
COMMENT ON COLUMN users.name IS '이름';
COMMENT ON COLUMN users.age IS '나이';
COMMENT ON COLUMN users.birth_date IS '생년월일';
COMMENT ON COLUMN users.phone_number IS '휴대폰 번호';
COMMENT ON COLUMN users.email IS '이메일';
COMMENT ON COLUMN users.gender IS '성별 (남, 여, 기타)';
COMMENT ON COLUMN users.address IS '주소 (건물까지의 주소)';
COMMENT ON COLUMN users.detail_address IS '상세주소 (동, 호수)';
COMMENT ON COLUMN users.zip_code IS '우편번호';
COMMENT ON COLUMN users.profile_image_id IS '프로필 사진 ID';
COMMENT ON COLUMN users.is_active IS '계정 활성화 상태 (Y: 활성화, N: 비활성화, H: 홀딩)';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 시각';


-- 트레이너 테이블
CREATE TABLE trainer (
    trainer_id VARCHAR(50) NOT NULL,
    specialty TEXT NOT NULL,
    introduction TEXT,
    hire_date DATE NOT NULL,
    exp_years INTEGER NOT NULL DEFAULT 0,
    hash_tag1 VARCHAR(100),
    hash_tag2 VARCHAR(100),
    hash_tag3 VARCHAR(100),
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_trainer PRIMARY KEY (trainer_id),
    CONSTRAINT fk_trainer_user FOREIGN KEY (trainer_id) REFERENCES users(user_id),
    CONSTRAINT chk_trainer_exp_years CHECK (exp_years >= 0)
);

COMMENT ON TABLE trainer IS '트레이너의 상세 프로필 정보';
COMMENT ON COLUMN trainer.trainer_id IS '트레이너 ID (users.user_id와 동일)';
COMMENT ON COLUMN trainer.specialty IS '전문 분야 (예: 체중감량, 근력강화, 재활)';
COMMENT ON COLUMN trainer.introduction IS '자기소개';
COMMENT ON COLUMN trainer.hire_date IS '입사일';
COMMENT ON COLUMN trainer.exp_years IS '경력 (년차)';
COMMENT ON COLUMN trainer.hash_tag1 IS '짧은 소개 해쉬태그1';
COMMENT ON COLUMN trainer.hash_tag2 IS '짧은 소개 해쉬태그2';
COMMENT ON COLUMN trainer.hash_tag3 IS '짧은 소개 해쉬태그3';


-- 회원 테이블 (개선: PK를 member_id로 변경, trainer_id는 FK로)
CREATE TABLE member (
    member_id VARCHAR(50) NOT NULL,
    trainer_id VARCHAR(50) NOT NULL,
    goal TEXT,
    physical_info TEXT,
    session_start_date DATE NOT NULL,
    session_end_date DATE NOT NULL,
    session_total_count INTEGER DEFAULT 0,
    session_used_count INTEGER DEFAULT 0,
    session_holding_count INTEGER DEFAULT 0,
    session_holding_start_date DATE,
    session_holding_end_date DATE,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_member PRIMARY KEY (member_id),
    CONSTRAINT fk_member_user FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT fk_member_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id),
    CONSTRAINT uq_member_trainer UNIQUE (member_id, trainer_id),
    CONSTRAINT chk_member_session_count CHECK (session_total_count >= 0),
    CONSTRAINT chk_member_used_count CHECK (session_used_count >= 0),
    CONSTRAINT chk_member_date_range CHECK (session_end_date >= session_start_date)
);

COMMENT ON TABLE member IS '회원의 상세 프로필 및 기본 정보';
COMMENT ON COLUMN member.member_id IS '회원 ID (users.user_id와 동일)';
COMMENT ON COLUMN member.trainer_id IS '담당 트레이너 ID';
COMMENT ON COLUMN member.goal IS '운동 목표 (예: 체중감량 10kg, 근력향상)';
COMMENT ON COLUMN member.physical_info IS '신체 정보 및 특이사항 (질병, 부상 이력 등)';
COMMENT ON COLUMN member.session_start_date IS '세션 시작 일자';
COMMENT ON COLUMN member.session_end_date IS '세션 종료 일자';
COMMENT ON COLUMN member.session_total_count IS '총 세션 횟수';
COMMENT ON COLUMN member.session_used_count IS '사용한 세션 횟수';
COMMENT ON COLUMN member.session_holding_count IS '홀딩한 횟수';
COMMENT ON COLUMN member.session_holding_start_date IS '홀딩 시작일';
COMMENT ON COLUMN member.session_holding_end_date IS '홀딩 종료일';


-- 남은 세션 횟수를 계산하는 뷰
CREATE VIEW v_member_session_summary AS
SELECT
    m.*,
    (m.session_total_count - m.session_used_count) AS session_remain_count,
    CASE
        WHEN m.session_end_date < CURRENT_DATE THEN 'expired'
        WHEN m.session_used_count >= m.session_total_count THEN 'completed'
        WHEN m.session_holding_start_date IS NOT NULL AND m.session_holding_end_date IS NULL THEN 'holding'
        ELSE 'active'
    END AS session_status
FROM member m;

COMMENT ON VIEW v_member_session_summary IS '회원 세션 정보 요약 (남은 횟수 및 상태 포함)';


-- ============================================================
-- HEALTH 영역
-- ============================================================

-- 체성분 측정 테이블
CREATE TABLE body_compositions (
    inbody_id UUID NOT NULL DEFAULT gen_random_uuid(),
    member_id VARCHAR(50) NOT NULL,
    measured_at TIMESTAMP NOT NULL DEFAULT NOW(),
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    skeletal_muscle_mass NUMERIC(5,2),
    body_fat_mass NUMERIC(5,2),
    body_fat_percentage NUMERIC(5,2),
    abdominal_fat_percentage NUMERIC(5,2),
    visceral_fat_level INTEGER,
    body_water NUMERIC(5,2),
    basal_metabolic_rate INTEGER,
    notes TEXT,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_body_compositions PRIMARY KEY (inbody_id),
    CONSTRAINT fk_body_compositions_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT chk_body_height CHECK (height > 0 AND height < 300),
    CONSTRAINT chk_body_weight CHECK (weight > 0 AND weight < 500)
);

-- 시계열 데이터 조회를 위한 인덱스
CREATE INDEX idx_body_compositions_member_measured ON body_compositions(member_id, measured_at DESC);

COMMENT ON TABLE body_compositions IS '회원의 체성분 측정 기록 (시계열 데이터)';
COMMENT ON COLUMN body_compositions.inbody_id IS '체성분 측정 ID (자동 생성)';
COMMENT ON COLUMN body_compositions.member_id IS '회원 ID';
COMMENT ON COLUMN body_compositions.measured_at IS '측정 일시';
COMMENT ON COLUMN body_compositions.height IS '신장 (cm)';
COMMENT ON COLUMN body_compositions.weight IS '체중 (kg)';
COMMENT ON COLUMN body_compositions.skeletal_muscle_mass IS '골격근량 (kg)';
COMMENT ON COLUMN body_compositions.body_fat_mass IS '체지방량 (kg)';
COMMENT ON COLUMN body_compositions.body_fat_percentage IS '체지방률 (%)';
COMMENT ON COLUMN body_compositions.abdominal_fat_percentage IS '복부지방률 (%)';
COMMENT ON COLUMN body_compositions.visceral_fat_level IS '내장지방 레벨';
COMMENT ON COLUMN body_compositions.body_water IS '체수분 (kg)';
COMMENT ON COLUMN body_compositions.basal_metabolic_rate IS '기초대사량 (kcal)';
COMMENT ON COLUMN body_compositions.notes IS '측정 메모';


-- ============================================================
-- COMMERCE 영역
-- ============================================================

-- 패키지 상품 테이블
CREATE TABLE packages (
    package_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    sessions_count INTEGER NOT NULL,
    sessions_days INTEGER NOT NULL DEFAULT 0,
    total_price NUMERIC(10,2),
    per_price NUMERIC(10,2),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_packages PRIMARY KEY (package_id),
    CONSTRAINT chk_packages_sessions_count CHECK (sessions_count > 0),
    CONSTRAINT chk_packages_sessions_days CHECK (sessions_days >= 0),
    CONSTRAINT chk_packages_total_price CHECK (total_price >= 0),
    CONSTRAINT chk_packages_per_price CHECK (per_price >= 0)
);

COMMENT ON TABLE packages IS 'PT 및 회원권 상품 테이블';
COMMENT ON COLUMN packages.package_id IS '패키지 ID (사용자 입력)';
COMMENT ON COLUMN packages.package_name IS '패키지 명';
COMMENT ON COLUMN packages.sessions_count IS '패키지에 포함된 PT 횟수';
COMMENT ON COLUMN packages.sessions_days IS '패키지 유효기간 (일)';
COMMENT ON COLUMN packages.total_price IS '패키지 가격 (원)';
COMMENT ON COLUMN packages.per_price IS '회당 패키지 가격 (원)';
COMMENT ON COLUMN packages.description IS '패키지 설명';
COMMENT ON COLUMN packages.is_active IS '패키지 활성 상태';


-- 패키지 구매 이력 테이블 (개선: package_id FK 추가)
CREATE TABLE packages_history (
    purchase_history_id UUID NOT NULL DEFAULT gen_random_uuid(),
    member_id VARCHAR(50) NOT NULL,
    trainer_id VARCHAR(50) NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_price NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20),
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_packages_history PRIMARY KEY (purchase_history_id),
    CONSTRAINT fk_packages_history_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT fk_packages_history_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id),
    CONSTRAINT fk_packages_history_package FOREIGN KEY (package_id) REFERENCES packages(package_id),
    CONSTRAINT chk_packages_history_price CHECK (purchase_price >= 0),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('card', 'cash', 'transfer', 'other'))
);

-- 구매 이력 조회를 위한 인덱스
CREATE INDEX idx_packages_history_member ON packages_history(member_id, purchase_date DESC);
CREATE INDEX idx_packages_history_trainer ON packages_history(trainer_id, purchase_date DESC);

COMMENT ON TABLE packages_history IS '패키지 구매 이력';
COMMENT ON COLUMN packages_history.purchase_history_id IS '구매 이력 ID (자동 생성)';
COMMENT ON COLUMN packages_history.member_id IS '구매 회원 ID';
COMMENT ON COLUMN packages_history.trainer_id IS '담당 트레이너 ID';
COMMENT ON COLUMN packages_history.package_id IS '구매한 패키지 ID';
COMMENT ON COLUMN packages_history.purchase_date IS '구매 일자';
COMMENT ON COLUMN packages_history.purchase_price IS '구매 가격 (원)';
COMMENT ON COLUMN packages_history.payment_method IS '결제 수단 (card: 카드, cash: 현금, transfer: 계좌이체, other: 기타)';


-- ============================================================
-- TRAINING 영역
-- ============================================================

-- PT 세션 테이블
CREATE TABLE training_sessions (
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    member_id VARCHAR(50) NOT NULL,
    trainer_id VARCHAR(50) NOT NULL,
    session_date DATE NOT NULL,
    session_day_of_week VARCHAR(10),
    session_start_time TIME NOT NULL,
    session_end_time TIME NOT NULL,
    session_duration_minutes INTEGER,
    main_training_area VARCHAR(50),
    sub_training_area VARCHAR(50),
    session_notes TEXT,
    session_status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_training_sessions PRIMARY KEY (session_id),
    CONSTRAINT fk_training_sessions_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT fk_training_sessions_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id),
    CONSTRAINT chk_training_session_status CHECK (session_status IN ('scheduled', 'completed', 'cancelled')),
    CONSTRAINT chk_training_session_time CHECK (session_end_time > session_start_time),
    CONSTRAINT chk_session_duration CHECK (session_duration_minutes > 0 AND session_duration_minutes <= 300)
);

-- 세션 조회를 위한 인덱스
CREATE INDEX idx_training_sessions_member ON training_sessions(member_id, session_date DESC);
CREATE INDEX idx_training_sessions_trainer ON training_sessions(trainer_id, session_date DESC);
CREATE INDEX idx_training_sessions_date ON training_sessions(session_date DESC);
CREATE INDEX idx_training_sessions_status ON training_sessions(session_status, session_date);

COMMENT ON TABLE training_sessions IS 'PT 세션 기록 (예약 관리, 이력 관리)';
COMMENT ON COLUMN training_sessions.session_id IS '세션 ID (자동 생성)';
COMMENT ON COLUMN training_sessions.member_id IS '회원 ID';
COMMENT ON COLUMN training_sessions.trainer_id IS '담당 트레이너 ID';
COMMENT ON COLUMN training_sessions.session_date IS '세션 예정/완료 일자';
COMMENT ON COLUMN training_sessions.session_day_of_week IS '세션 요일 (월, 화, 수, 목, 금, 토, 일)';
COMMENT ON COLUMN training_sessions.session_start_time IS '세션 시작 시간';
COMMENT ON COLUMN training_sessions.session_end_time IS '세션 종료 시간';
COMMENT ON COLUMN training_sessions.session_duration_minutes IS '세션 소요 시간 (분)';
COMMENT ON COLUMN training_sessions.main_training_area IS '메인 운동 부위';
COMMENT ON COLUMN training_sessions.sub_training_area IS '서브 운동 부위';
COMMENT ON COLUMN training_sessions.session_notes IS '세션 특이사항';
COMMENT ON COLUMN training_sessions.session_status IS '세션 상태 (scheduled: 예약됨, completed: 완료, cancelled: 취소)';


-- 세션별 운동 상세 테이블
CREATE TABLE training_session_workout (
    workout_id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    category_name VARCHAR(50) NOT NULL,
    category_code VARCHAR(3) NOT NULL,
    training_type VARCHAR(1),
    exercise_name VARCHAR(100) NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight_kg NUMERIC(6,2),
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_training_session_workout PRIMARY KEY (workout_id),
    CONSTRAINT fk_workout_session FOREIGN KEY (session_id) REFERENCES training_sessions(session_id),
    CONSTRAINT chk_workout_category_name CHECK (category_name IN ('가슴', '등', '어깨', '팔(이두)', '팔(삼두)', '하체', '복근', '유산소', '스트레칭', '기타')),
    CONSTRAINT chk_workout_category_code CHECK (category_code IN ('CHS', 'BCK', 'SHD', 'BYC', 'TRI', 'LEG', 'ABS', 'CAR', 'STR', 'OTH')),
    CONSTRAINT chk_workout_training_type CHECK (training_type IN ('M', 'S')),
    CONSTRAINT chk_workout_sets CHECK (sets > 0 AND sets <= 100),
    CONSTRAINT chk_workout_reps CHECK (reps > 0 AND reps <= 1000),
    CONSTRAINT chk_workout_weight CHECK (weight_kg >= 0 AND weight_kg <= 1000),
    CONSTRAINT chk_workout_rest CHECK (rest_seconds >= 0 AND rest_seconds <= 600)
);

-- 세션별 운동 조회를 위한 인덱스
CREATE INDEX idx_workout_session ON training_session_workout(session_id);

COMMENT ON TABLE training_session_workout IS 'PT 세션별 운동 상세 기록 (training_sessions와 1:N 관계)';
COMMENT ON COLUMN training_session_workout.workout_id IS '운동 기록 ID (자동 생성)';
COMMENT ON COLUMN training_session_workout.session_id IS '세션 ID';
COMMENT ON COLUMN training_session_workout.category_name IS '운동 카테고리 (가슴/등/어깨/팔(이두)/팔(삼두)/하체/복근/유산소/스트레칭/기타)';
COMMENT ON COLUMN training_session_workout.category_code IS '운동 카테고리 코드 (CHS: 가슴, BCK: 등, SHD: 어깨, BYC: 팔(이두), TRI: 팔(삼두), LEG: 하체, ABS: 복근, CAR: 유산소, STR: 스트레칭, OTH: 기타)';
COMMENT ON COLUMN training_session_workout.training_type IS '트레이닝 타입 (M: 메인, S: 서브)';
COMMENT ON COLUMN training_session_workout.exercise_name IS '운동 이름 (예: 벤치프레스, 스쿼트)';
COMMENT ON COLUMN training_session_workout.sets IS '세트 수';
COMMENT ON COLUMN training_session_workout.reps IS '반복 횟수 (1세트당)';
COMMENT ON COLUMN training_session_workout.weight_kg IS '중량 (kg)';
COMMENT ON COLUMN training_session_workout.rest_seconds IS '세트 간 휴식 시간 (초)';
COMMENT ON COLUMN training_session_workout.notes IS '운동별 메모 (자세 교정사항 등)';


-- ============================================================
-- CREDENTIAL 영역
-- ============================================================

-- 트레이너 자격증 테이블 (개선: credential_type에 CHECK 제약조건 추가)
CREATE TABLE trainer_credentials (
    credential_id UUID NOT NULL DEFAULT gen_random_uuid(),
    trainer_id VARCHAR(50) NOT NULL,
    credential_type VARCHAR(20) NOT NULL,
    credential_name VARCHAR(200) NOT NULL,
    certification_image_id VARCHAR(50),
    acquired_date DATE NOT NULL,
    expiry_date DATE,
    issued_authority TEXT,
    created_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_trainer_credentials PRIMARY KEY (credential_id),
    CONSTRAINT fk_credentials_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id),
    CONSTRAINT fk_credentials_image FOREIGN KEY (certification_image_id) REFERENCES media(media_id),
    CONSTRAINT chk_credential_type CHECK (credential_type IN ('certification', 'award', 'education', 'other')),
    CONSTRAINT chk_credential_expiry CHECK (expiry_date IS NULL OR expiry_date >= acquired_date)
);

-- 트레이너별 자격증 조회를 위한 인덱스
CREATE INDEX idx_credentials_trainer ON trainer_credentials(trainer_id, acquired_date DESC);

COMMENT ON TABLE trainer_credentials IS '트레이너 자격증 및 수상 이력';
COMMENT ON COLUMN trainer_credentials.credential_id IS '자격증 ID (자동 생성)';
COMMENT ON COLUMN trainer_credentials.trainer_id IS '트레이너 ID';
COMMENT ON COLUMN trainer_credentials.credential_type IS '자격증 타입 (certification: 자격증, award: 수상, education: 교육이수, other: 기타)';
COMMENT ON COLUMN trainer_credentials.credential_name IS '자격증/수상 명칭';
COMMENT ON COLUMN trainer_credentials.certification_image_id IS '자격증 이미지 ID';
COMMENT ON COLUMN trainer_credentials.acquired_date IS '취득일자';
COMMENT ON COLUMN trainer_credentials.expiry_date IS '만료일자 (해당되는 경우)';
COMMENT ON COLUMN trainer_credentials.issued_authority IS '발급/수상 기관';


-- ============================================================
-- 트리거 함수: updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER trigger_update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_trainer_updated_at BEFORE UPDATE ON trainer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_member_updated_at BEFORE UPDATE ON member FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_body_compositions_updated_at BEFORE UPDATE ON body_compositions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_packages_history_updated_at BEFORE UPDATE ON packages_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_workout_updated_at BEFORE UPDATE ON training_session_workout FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_credentials_updated_at BEFORE UPDATE ON trainer_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 샘플 데이터 (선택사항)
-- ============================================================

-- 관리자 계정
INSERT INTO users (user_id, password, role, name, birth_date, phone_number, email, gender, address, zip_code, created_id, updated_id)
VALUES ('admin', '123456!', 'admin', '관리자', '1980-01-01', '010-0000-0000', 'admin@ptcenter.com', '남', '서울시 강남구', '06000', 'system', 'system');


-- 패키지 샘플
INSERT INTO packages (package_id, package_name, sessions_count, sessions_days, total_price, per_price, is_active, created_id, updated_id)
VALUES
    ('PKG001', '10회 1개월 패키지', 10, 30, 500000, 50000, true, 'admin', 'admin'),
    ('PKG002', '20회 2개월 패키지', 20, 60, 900000, 45000, true, 'admin', 'admin'),
    ('PKG003', '30회 3개월 패키지', 30, 90, 1200000, 40000, true, 'admin', 'admin');

-- 트레이너 계정 (5명)
INSERT INTO users (user_id, password, role, name, birth_date, phone_number, email, gender, address, zip_code, created_id, updated_id)
VALUES
    ('trainer01', '123456!', 'trainer', '김철수', '1985-03-15', '010-1111-1111', 'trainer01@ptcenter.com', '남', '서울시 강남구 테헤란로 123', '06000', 'admin', 'admin'),
    ('trainer02', '123456!', 'trainer', '이영희', '1988-07-20', '010-2222-2222', 'trainer02@ptcenter.com', '여', '서울시 서초구 서초대로 456', '06500', 'admin', 'admin'),
    ('trainer03', '123456!', 'trainer', '박민수', '1990-11-05', '010-3333-3333', 'trainer03@ptcenter.com', '남', '서울시 송파구 올림픽로 789', '05500', 'admin', 'admin'),
    ('trainer04', '123456!', 'trainer', '최지은', '1987-05-25', '010-4444-4444', 'trainer04@ptcenter.com', '여', '서울시 강동구 천호대로 321', '05300', 'admin', 'admin'),
    ('trainer05', '123456!', 'trainer', '정승호', '1992-09-10', '010-5555-5555', 'trainer05@ptcenter.com', '남', '서울시 광진구 능동로 654', '05000', 'admin', 'admin');

-- 트레이너 상세 정보
INSERT INTO trainer (trainer_id, specialty, introduction, hire_date, exp_years, hash_tag1, hash_tag2, hash_tag3, created_id, updated_id)
VALUES
    ('trainer01', '체중감량, 근력강화', '10년 경력의 베테랑 트레이너입니다. 체계적인 식단 관리와 운동 프로그램으로 목표 달성을 도와드립니다.', '2015-01-15', 10, '#체중감량전문가', '#식단관리마스터', '#10년경력', 'admin', 'admin'),
    ('trainer02', '재활, 코어강화', '물리치료사 자격증을 보유한 재활 전문 트레이너입니다. 부상 후 회복과 예방에 특화되어 있습니다.', '2017-03-01', 8, '#재활전문', '#물리치료사', '#부상회복', 'admin', 'admin'),
    ('trainer03', '근력강화, 바디프로필', '보디빌딩 대회 수상 경력이 있으며, 근성장과 바디프로필 촬영 준비에 강점이 있습니다.', '2018-06-20', 7, '#바디프로필', '#보디빌더', '#근성장전문', 'admin', 'admin'),
    ('trainer04', '체중감량, 유산소', '여성 회원 전문 트레이너로, 산후 다이어트와 체형 교정에 뛰어난 노하우를 가지고 있습니다.', '2019-09-01', 6, '#여성전문', '#산후다이어트', '#체형교정', 'admin', 'admin'),
    ('trainer05', '기능성 운동, 크로스핏', '크로스핏 레벨2 자격증 보유, 고강도 인터벌 트레이닝과 기능성 운동 전문가입니다.', '2020-02-10', 5, '#크로스핏', '#고강도훈련', '#기능성운동', 'admin', 'admin');

-- 회원 계정 (10명)
INSERT INTO users (user_id, password, role, name, birth_date, phone_number, email, gender, address, zip_code, created_id, updated_id)
VALUES
    ('member01', '123456!', 'member', '강민준', '1995-04-12', '010-1001-1001', 'member01@gmail.com', '남', '서울시 강남구 역삼동 123-45', '06234', 'admin', 'admin'),
    ('member02', '123456!', 'member', '김서연', '1998-08-23', '010-1002-1002', 'member02@gmail.com', '여', '서울시 서초구 반포동 678-90', '06543', 'admin', 'admin'),
    ('member03', '123456!', 'member', '이도윤', '1993-02-17', '010-1003-1003', 'member03@naver.com', '남', '서울시 송파구 잠실동 234-56', '05567', 'admin', 'admin'),
    ('member04', '123456!', 'member', '박서준', '1996-11-30', '010-1004-1004', 'member04@naver.com', '남', '서울시 강동구 천호동 789-12', '05321', 'admin', 'admin'),
    ('member05', '123456!', 'member', '정하은', '1999-06-08', '010-1005-1005', 'member05@gmail.com', '여', '서울시 광진구 자양동 345-67', '05012', 'admin', 'admin'),
    ('member06', '123456!', 'member', '최지우', '1994-12-25', '010-1006-1006', 'member06@daum.net', '여', '서울시 마포구 상암동 901-23', '03900', 'admin', 'admin'),
    ('member07', '123456!', 'member', '윤준서', '1997-03-14', '010-1007-1007', 'member07@naver.com', '남', '서울시 용산구 이촌동 456-78', '04300', 'admin', 'admin'),
    ('member08', '123456!', 'member', '한예린', '2000-09-05', '010-1008-1008', 'member08@gmail.com', '여', '서울시 성동구 성수동 123-45', '04700', 'admin', 'admin'),
    ('member09', '123456!', 'member', '조민호', '1992-07-19', '010-1009-1009', 'member09@naver.com', '남', '서울시 동대문구 장안동 678-90', '02500', 'admin', 'admin'),
    ('member10', '123456!', 'member', '신유진', '1996-01-28', '010-1010-1010', 'member10@gmail.com', '여', '서울시 중랑구 면목동 234-56', '02100', 'admin', 'admin');

-- 회원 상세 정보 (트레이너 배정)
INSERT INTO member (member_id, trainer_id, goal, physical_info, session_start_date, session_end_date, session_total_count, session_used_count, created_id, updated_id)
VALUES
    ('member01', 'trainer01', '체중감량 10kg', '허리 디스크 주의', '2025-01-01', '2025-03-31', 30, 8, 'admin', 'admin'),
    ('member02', 'trainer04', '산후 다이어트', '제왕절개 6개월 경과', '2025-01-15', '2025-03-14', 20, 5, 'admin', 'admin'),
    ('member03', 'trainer03', '근력 강화 및 벌크업', '단백질 섭취량 증가 필요', '2024-12-01', '2025-02-28', 30, 22, 'admin', 'admin'),
    ('member04', 'trainer02', '무릎 재활 운동', '반월상연골 수술 후 재활', '2025-02-01', '2025-04-30', 30, 3, 'admin', 'admin'),
    ('member05', 'trainer05', '체력 향상', '크로스핏 입문', '2025-01-10', '2025-02-09', 10, 6, 'admin', 'admin'),
    ('member06', 'trainer01', '체지방 감량', '저녁 식사 조절 중', '2025-01-20', '2025-04-19', 30, 4, 'admin', 'admin'),
    ('member07', 'trainer03', '바디프로필 촬영 준비', '3월 촬영 예정', '2025-01-05', '2025-03-05', 20, 12, 'admin', 'admin'),
    ('member08', 'trainer04', '체형 교정', '골반 불균형 교정 중', '2025-02-10', '2025-04-09', 20, 2, 'admin', 'admin'),
    ('member09', 'trainer02', '허리 통증 개선', '만성 요통 관리', '2024-12-15', '2025-03-14', 30, 18, 'admin', 'admin'),
    ('member10', 'trainer05', '전신 체력 향상', '마라톤 준비', '2025-01-25', '2025-02-24', 10, 3, 'admin', 'admin');


-- ============================================================
-- 유용한 뷰 추가
-- ============================================================

-- 트레이너별 회원 현황 뷰
CREATE VIEW v_trainer_member_summary AS
SELECT
    t.trainer_id,
    t.specialty,
    t.exp_years,
    COUNT(m.member_id) AS total_members,
    COUNT(CASE WHEN u.is_active = 'Y' THEN 1 END) AS active_members,
    COUNT(CASE WHEN u.is_active = 'H' THEN 1 END) AS holding_members
FROM trainer t
LEFT JOIN member m ON t.trainer_id = m.trainer_id
LEFT JOIN users u ON m.member_id = u.user_id
GROUP BY t.trainer_id, t.specialty, t.exp_years;

COMMENT ON VIEW v_trainer_member_summary IS '트레이너별 회원 현황 요약';


-- 금일 세션 일정 뷰
CREATE VIEW v_today_sessions AS
SELECT
    ts.session_id,
    ts.session_date,
    ts.session_start_time,
    ts.session_end_time,
    ts.session_status,
    m_user.name AS member_name,
    m_user.phone_number AS member_phone,
    t_user.name AS trainer_name,
    ts.main_training_area,
    ts.session_notes
FROM training_sessions ts
JOIN member m ON ts.member_id = m.member_id
JOIN users m_user ON m.member_id = m_user.user_id
JOIN trainer t ON ts.trainer_id = t.trainer_id
JOIN users t_user ON t.trainer_id = t_user.user_id
WHERE ts.session_date = CURRENT_DATE
ORDER BY ts.session_start_time;


COMMENT ON VIEW v_today_sessions IS '금일 PT 세션 일정';


-- ============================================================
-- 완료
-- ============================================================
-- 모든 테이블이 public 스키마에 생성되는 버전입니다.
-- 실행 전 검토 후 사용하시기 바랍니다.
-- ============================================================

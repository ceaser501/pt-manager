-- 회원 테이블
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    height DECIMAL(5,2), -- 키 (cm)
    weight DECIMAL(5,2), -- 체중 (kg)
    skeletal_muscle_mass DECIMAL(5,2), -- 골격근량 (kg)
    body_fat_mass DECIMAL(5,2), -- 체지방량 (kg)
    body_fat_percentage DECIMAL(5,2), -- 체지방률 (%)
    abdominal_fat_percentage DECIMAL(5,2), -- 복부지방률 (%)
    visceral_fat_level INTEGER, -- 내장지방레벨
    body_water DECIMAL(5,2), -- 체수분 (L 또는 %)
    basal_metabolic_rate INTEGER, -- 기초대사량 (kcal)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 운동일지 테이블
CREATE TABLE IF NOT EXISTS workout_logs (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    status_check TEXT, -- 컨디션 체크 내용
    comment TEXT, -- 코멘트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 운동 종목 테이블
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    workout_log_id INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL,
    exercise_order INTEGER NOT NULL, -- 운동 순서
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 운동 세트 테이블
CREATE TABLE IF NOT EXISTS exercise_sets (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight DECIMAL(6,2) NOT NULL, -- 무게 (kg)
    reps INTEGER NOT NULL, -- 횟수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 참고자료 테이블
CREATE TABLE IF NOT EXISTS workout_references (
    id SERIAL PRIMARY KEY,
    workout_log_id INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url TEXT,
    reference_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_workout_logs_member_id ON workout_logs(member_id);
CREATE INDEX idx_workout_logs_log_date ON workout_logs(log_date);
CREATE INDEX idx_exercises_workout_log_id ON exercises(workout_log_id);
CREATE INDEX idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX idx_workout_references_workout_log_id ON workout_references(workout_log_id);

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON workout_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화 (선택사항)
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_references ENABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO members (name, age, height, weight, skeletal_muscle_mass, body_fat_mass, body_fat_percentage, abdominal_fat_percentage, visceral_fat_level, body_water, basal_metabolic_rate)
VALUES
('홍길동', 30, 175.5, 75.0, 35.2, 15.5, 20.6, 0.85, 8, 45.3, 1650),
('김철수', 28, 180.0, 82.5, 38.5, 18.2, 22.0, 0.90, 10, 48.1, 1750);

COMMENT ON TABLE members IS '회원 정보 테이블';
COMMENT ON TABLE workout_logs IS '운동일지 테이블';
COMMENT ON TABLE exercises IS '운동 종목 테이블';
COMMENT ON TABLE exercise_sets IS '운동 세트 상세 테이블';
COMMENT ON TABLE workout_references IS '참고자료 테이블';

-- ============================================
-- 2025-11-04: 회원 테이블에 추가 컬럼 추가
-- ============================================
-- 성별, 연락처, 운동 목표, 특이사항 컬럼 추가

ALTER TABLE members ADD COLUMN IF NOT EXISTS gender VARCHAR(10); -- 성별: 'male' 또는 'female'
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone VARCHAR(20); -- 연락처
ALTER TABLE members ADD COLUMN IF NOT EXISTS goal TEXT; -- 운동 목표
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT; -- 특이사항 (부상 이력, 건강 상태 등)

COMMENT ON COLUMN members.gender IS '성별 (male/female)';
COMMENT ON COLUMN members.phone IS '연락처';
COMMENT ON COLUMN members.goal IS '운동 목표';
COMMENT ON COLUMN members.notes IS '특이사항 (부상 이력, 건강 상태 등)';

-- ============================================
-- 2025-11-07: 예약 테이블 추가
-- ============================================
-- 회원 PT 예약 관리 테이블
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    notes TEXT, -- 예약 특이사항
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_reservations_member_id ON reservations(member_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_date_time ON reservations(reservation_date, reservation_time);

-- updated_at 트리거 생성
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE reservations IS '회원 PT 예약 테이블';
COMMENT ON COLUMN reservations.status IS '예약 상태: scheduled(예약됨), completed(완료), cancelled(취소), no_show(노쇼)';

-- 샘플 예약 데이터 삽입 (테스트용)
INSERT INTO reservations (member_id, reservation_date, reservation_time, status, notes)
VALUES
((SELECT id FROM members WHERE name = '홍길동' LIMIT 1), CURRENT_DATE, '09:00:00', 'scheduled', '상체 집중 운동'),
((SELECT id FROM members WHERE name = '김철수' LIMIT 1), CURRENT_DATE, '10:00:00', 'scheduled', '하체 + 유산소'),
((SELECT id FROM members WHERE name = '홍길동' LIMIT 1), CURRENT_DATE, '15:00:00', 'scheduled', '상체 집중'),
((SELECT id FROM members WHERE name = '김철수' LIMIT 1), CURRENT_DATE, '16:00:00', 'scheduled', '재활 운동'),
((SELECT id FROM members WHERE name = '홍길동' LIMIT 1), CURRENT_DATE + 1, '09:00:00', 'scheduled', NULL),
((SELECT id FROM members WHERE name = '김철수' LIMIT 1), CURRENT_DATE + 1, '10:00:00', 'scheduled', NULL),
((SELECT id FROM members WHERE name = '홍길동' LIMIT 1), CURRENT_DATE + 2, '09:00:00', 'scheduled', NULL);

-- ============================================
-- 2025-11-07: 회원 테이블에 세션 관리 컬럼 추가
-- ============================================
-- 전체 신청 세션과 잔여 세션 관리

ALTER TABLE members ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0; -- 전체 신청 세션 수
ALTER TABLE members ADD COLUMN IF NOT EXISTS remaining_sessions INTEGER DEFAULT 0; -- 잔여 세션 수
ALTER TABLE members ADD COLUMN IF NOT EXISTS session_start_date DATE; -- 세션 시작일
ALTER TABLE members ADD COLUMN IF NOT EXISTS session_end_date DATE; -- 세션 종료일

COMMENT ON COLUMN members.total_sessions IS '전체 신청한 PT 세션 수';
COMMENT ON COLUMN members.remaining_sessions IS '남은 PT 세션 수';
COMMENT ON COLUMN members.session_start_date IS 'PT 등록 시작일';
COMMENT ON COLUMN members.session_end_date IS 'PT 등록 종료일';

-- 기존 회원 데이터에 샘플 세션 정보 업데이트
UPDATE members SET
    total_sessions = 20,
    remaining_sessions = 15,
    session_start_date = CURRENT_DATE - INTERVAL '10 days',
    session_end_date = CURRENT_DATE + INTERVAL '50 days'
WHERE name = '홍길동';

UPDATE members SET
    total_sessions = 30,
    remaining_sessions = 3,
    session_start_date = CURRENT_DATE - INTERVAL '20 days',
    session_end_date = CURRENT_DATE + INTERVAL '40 days'
WHERE name = '김철수';

-- ============================================
-- 2025-11-07: 일일 메모(리마인더) 테이블 추가
-- ============================================
-- 트레이너가 날짜별로 메모를 작성할 수 있는 테이블

CREATE TABLE IF NOT EXISTS daily_notes (
    id SERIAL PRIMARY KEY,
    note_date DATE NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_daily_notes_date ON daily_notes(note_date);

-- updated_at 트리거 생성
CREATE TRIGGER update_daily_notes_updated_at BEFORE UPDATE ON daily_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE daily_notes IS '일일 메모/리마인더 테이블';

-- 샘플 메모 데이터
INSERT INTO daily_notes (note_date, content)
VALUES
(CURRENT_DATE, '오늘 할 일:\n- 김철수 회원 세션 갱신 상담\n- 신규 회원 상담 예정 (오후 2시)\n- 운동 기구 점검'),
(CURRENT_DATE - 1, '어제 완료:\n- 홍길동 회원 체성분 측정\n- 월간 보고서 작성')
ON CONFLICT (note_date) DO NOTHING;

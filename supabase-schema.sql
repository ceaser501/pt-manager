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

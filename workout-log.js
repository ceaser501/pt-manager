// Config
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY;

let supabase = null;
let allMembers = [];

// Initialize Supabase
if (SUPABASE_URL && SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    loadMembers();
} else {
    console.warn('Supabase configuration required');
}

// DOM elements
const memberSelect = document.getElementById('memberSelect');
const dateInput = document.getElementById('dateInput');
const logInput = document.getElementById('logInput');
const previewButton = document.getElementById('previewButton');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const resultDiv = document.getElementById('result');

// Set today's date as default
dateInput.valueAsDate = new Date();

// Load members from database
async function loadMembers() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('member')
            .select(`
                member_id,
                users!inner(user_id, name)
            `)
            .order('users(name)', { ascending: true });

        if (error) throw error;

        // Map to match expected structure
        allMembers = data.map(m => ({
            id: m.member_id,
            name: m.users.name
        }));
        renderMemberOptions(allMembers);
    } catch (error) {
        console.error('Error loading members:', error);
        alert('회원 목록을 불러오는데 실패했습니다: ' + error.message);
    }
}

// Render member options
function renderMemberOptions(members) {
    memberSelect.innerHTML = '<option value="">회원을 선택하세요</option>';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        memberSelect.appendChild(option);
    });
}

// Auto-preview on input
logInput.addEventListener('input', () => {
    parseAndPreview();
});

// Also trigger on member/date change
memberSelect.addEventListener('change', checkFormValid);
dateInput.addEventListener('change', checkFormValid);

// Check if form is valid
function checkFormValid() {
    const isValid = memberSelect.value && dateInput.value && logInput.value.trim();
    saveButton.disabled = !isValid;
}

// Parse workout log and show preview
function parseAndPreview() {
    const text = logInput.value.trim();

    if (!text) {
        resultDiv.innerHTML = `
            <div class="preview-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p>운동일지 내용을 입력하면</p>
                <p>미리보기가 표시됩니다</p>
            </div>
        `;
        checkFormValid();
        return;
    }

    const parsed = parseWorkoutLog(text);
    renderPreview(parsed);
    checkFormValid();
}

// Parse workout log text
function parseWorkoutLog(text) {
    const result = {
        statusCheck: '',
        exercises: [],
        comment: '',
        references: []
    };

    // Split by sections
    const sections = text.split(/(?=☑️|📌|💬|📍)/);

    sections.forEach(section => {
        const trimmed = section.trim();

        // Status check (컨디션 체크)
        if (trimmed.startsWith('☑️')) {
            result.statusCheck = trimmed.replace(/^☑️\s*/, '').trim();
        }

        // Exercises (오늘의 운동)
        else if (trimmed.startsWith('📌')) {
            const exerciseText = trimmed.replace(/^📌\s*오늘의\s*운동\s*/i, '').trim();
            result.exercises = parseExercises(exerciseText);
        }

        // Comment (코멘트)
        else if (trimmed.startsWith('💬')) {
            result.comment = trimmed.replace(/^💬\s*코멘트\s*/i, '').trim();
        }

        // References (참고자료)
        else if (trimmed.startsWith('📍')) {
            const refText = trimmed.replace(/^📍\s*/, '').trim();
            result.references.push(...parseReferences(refText));
        }
    });

    return result;
}

// Parse exercises from text
function parseExercises(text) {
    const exercises = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentExercise = null;

    lines.forEach(line => {
        line = line.trim();

        // Exercise line: "1. 숄더 프레스 (15kg x 12회, 25kg x 12회) - 4세트"
        const exerciseMatch = line.match(/^(\d+)\.\s*(.+?)\s*\(([^)]+)\)/);

        if (exerciseMatch) {
            const [, order, name, setsText] = exerciseMatch;

            currentExercise = {
                order: parseInt(order),
                name: name.trim(),
                sets: parseSets(setsText)
            };

            exercises.push(currentExercise);
        }
    });

    return exercises;
}

// Parse sets from text: "15kg x 12회, 25kg x 12회"
function parseSets(text) {
    const sets = [];
    const setTexts = text.split(',').map(s => s.trim());

    setTexts.forEach((setText, index) => {
        const match = setText.match(/(\d+(?:\.\d+)?)\s*kg\s*x\s*(\d+)\s*회/);
        if (match) {
            sets.push({
                setNumber: index + 1,
                weight: parseFloat(match[1]),
                reps: parseInt(match[2])
            });
        }
    });

    return sets;
}

// Parse references from text
function parseReferences(text) {
    const references = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentRef = { title: '', description: '', url: '' };

    lines.forEach(line => {
        line = line.trim();

        // Check if it's a URL
        if (line.match(/^https?:\/\//)) {
            currentRef.url = line;
            if (currentRef.title) {
                references.push({ ...currentRef });
                currentRef = { title: '', description: '', url: '' };
            }
        } else {
            // It's a title or description
            if (!currentRef.title) {
                currentRef.title = line;
            } else {
                currentRef.description = line;
            }
        }
    });

    // Add last reference if exists
    if (currentRef.title || currentRef.url) {
        references.push(currentRef);
    }

    return references;
}

// Render preview
function renderPreview(parsed) {
    let html = '';

    // Status check
    if (parsed.statusCheck) {
        html += `
            <div class="status-box status-box-warning">
                <div class="status-box-title">
                    <span>☑️</span> 특이사항
                </div>
                <div class="status-box-content">${escapeHtml(parsed.statusCheck)}</div>
            </div>
        `;
    }

    // Exercises
    if (parsed.exercises.length > 0) {
        html += `
            <div class="status-box status-box-success">
                <div class="status-box-title">
                    <span>🏋️</span> 오늘의 운동
                </div>
                <div class="status-box-content">
        `;

        parsed.exercises.forEach(exercise => {
            html += `
                <div class="exercise-item">
                    <div class="exercise-name">${exercise.order}. ${escapeHtml(exercise.name)}</div>
                    <table class="exercise-table-compact">
                        <thead>
                            <tr>
                                <th>세트</th>
                                <th>무게 (kg)</th>
                                <th>횟수</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            exercise.sets.forEach(set => {
                html += `
                    <tr>
                        <td>${set.setNumber}세트</td>
                        <td>${set.weight}kg</td>
                        <td>${set.reps}회</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    // Comment
    if (parsed.comment) {
        html += `
            <div class="status-box status-box-info">
                <div class="status-box-title">
                    <span>💬</span> 코멘트
                </div>
                <div class="status-box-content">${escapeHtml(parsed.comment)}</div>
            </div>
        `;
    }

    // References
    if (parsed.references.length > 0) {
        html += `
            <div class="status-box status-box-info">
                <div class="status-box-title">
                    <span>📍</span> 참고자료
                </div>
                <div class="status-box-content">
        `;

        parsed.references.forEach(ref => {
            html += `<div style="margin-bottom: 0.5rem;">`;
            if (ref.title) {
                html += `<strong>${escapeHtml(ref.title)}</strong><br>`;
            }
            if (ref.description) {
                html += `${escapeHtml(ref.description)}<br>`;
            }
            if (ref.url) {
                html += `<a href="${escapeHtml(ref.url)}" target="_blank" style="color: var(--primary); text-decoration: underline;">${escapeHtml(ref.url)}</a>`;
            }
            html += `</div>`;
        });

        html += `
                </div>
            </div>
        `;
    }

    resultDiv.innerHTML = html || '<p style="color: var(--text-muted);">파싱된 내용이 없습니다.</p>';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Preview button (manual trigger)
previewButton.addEventListener('click', () => {
    parseAndPreview();
});

// Reset button
resetButton.addEventListener('click', () => {
    if (confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
        memberSelect.value = '';
        dateInput.valueAsDate = new Date();
        logInput.value = '';
        resultDiv.innerHTML = `
            <div class="preview-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p>운동일지 내용을 입력하면</p>
                <p>미리보기가 표시됩니다</p>
            </div>
        `;
        saveButton.disabled = true;
    }
});

// Save button
saveButton.addEventListener('click', async () => {
    if (!supabase) {
        alert('Supabase 연결이 필요합니다.');
        return;
    }

    const memberId = memberSelect.value;
    const logDate = dateInput.value;
    const text = logInput.value.trim();

    if (!memberId || !logDate || !text) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
    }

    const parsed = parseWorkoutLog(text);

    saveButton.disabled = true;
    saveButton.textContent = '저장 중...';

    try {
        // Get trainer_id (assuming first trainer for now)
        const { data: trainers } = await supabase
            .from('trainer')
            .select('trainer_id')
            .limit(1);

        if (!trainers || trainers.length === 0) {
            alert('등록된 트레이너가 없습니다. 먼저 트레이너를 등록해주세요.');
            saveButton.disabled = false;
            saveButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                </svg>
                운동일지 저장
            `;
            return;
        }

        const trainerId = trainers[0].trainer_id;

        // 1. Create training session
        const { data: trainingSession, error: sessionError } = await supabase
            .from('training_sessions')
            .insert([{
                member_id: memberId,
                trainer_id: trainerId,
                session_date: logDate,
                session_start_time: '10:00:00',
                session_end_time: '11:00:00',
                session_status: 'completed',
                session_notes: parsed.statusCheck || parsed.comment || null,
                created_id: 'system',
                updated_id: 'system'
            }])
            .select()
            .single();

        if (sessionError) throw sessionError;

        // 2. Insert exercises as workout details
        if (parsed.exercises.length > 0) {
            for (const exercise of parsed.exercises) {
                // Get first set as representative values
                if (exercise.sets.length > 0) {
                    const firstSet = exercise.sets[0];

                    const { error: workoutError } = await supabase
                        .from('training_session_workout')
                        .insert([{
                            session_id: trainingSession.session_id,
                            category_name: '기타',
                            category_code: 'OTH',
                            exercise_name: exercise.name,
                            sets: exercise.sets.length,
                            reps: firstSet.reps,
                            weight_kg: firstSet.weight,
                            notes: null,
                            created_id: 'system',
                            updated_id: 'system'
                        }]);

                    if (workoutError) throw workoutError;
                } else {
                    // If no sets, just insert the exercise name
                    const { error: workoutError } = await supabase
                        .from('training_session_workout')
                        .insert([{
                            session_id: trainingSession.session_id,
                            category_name: '기타',
                            category_code: 'OTH',
                            exercise_name: exercise.name,
                            sets: 1,
                            reps: 10,
                            weight_kg: 0,
                            notes: null,
                            created_id: 'system',
                            updated_id: 'system'
                        }]);

                    if (workoutError) throw workoutError;
                }
            }
        }

        // Note: workout_references table is not in the new schema
        // Reference data will be ignored

        alert('운동일지가 저장되었습니다!');

        // Reset form
        memberSelect.value = '';
        dateInput.valueAsDate = new Date();
        logInput.value = '';
        resultDiv.innerHTML = `
            <div class="preview-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p>운동일지 내용을 입력하면</p>
                <p>미리보기가 표시됩니다</p>
            </div>
        `;

    } catch (error) {
        console.error('Error saving workout log:', error);
        alert('운동일지 저장에 실패했습니다: ' + error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            </svg>
            운동일지 저장
        `;
    }
});

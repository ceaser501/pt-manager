// Workout Entry 2 - Table-based workout entry with KakaoTalk text generation
// Initialize Supabase client
const supabaseUrl = window.APP_CONFIG.SUPABASE_URL;
const supabaseKey = window.APP_CONFIG.SUPABASE_ANON_KEY;
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    setTodayDate();
    setupEventListeners();
    updatePreview();
});

// Set today's date in the date picker
function setTodayDate() {
    const dateInput = document.getElementById('workoutDate');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

// Load members from database
async function loadMembers() {
    try {
        const { data: members, error } = await supabase
            .from('members')
            .select('id, name')
            .order('name');

        if (error) throw error;

        const memberSelect = document.getElementById('memberSelect');
        memberSelect.innerHTML = '<option value="">회원을 선택하세요</option>';

        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            memberSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading members:', error);
        alert('회원 목록을 불러오는데 실패했습니다.');
    }
}

// Setup event listeners for real-time preview
function setupEventListeners() {
    // Update preview when any input changes
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });

    // Setup table input listeners for dynamically added rows
    document.getElementById('exerciseTableBody').addEventListener('input', updatePreview);
    document.getElementById('referenceList').addEventListener('input', updatePreview);
}

// Add exercise row
function addExerciseRow() {
    const tbody = document.getElementById('exerciseTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" placeholder="숄더 프레스" class="exercise-name"></td>
        <td><input type="text" placeholder="15kg x 12, 20kg x 10" class="exercise-sets"></td>
        <td><input type="text" placeholder="3" class="small-input exercise-count"></td>
        <td><input type="text" placeholder="폼 개선" class="exercise-note"></td>
        <td><button class="remove-btn" onclick="removeExerciseRow(this)">삭제</button></td>
    `;
    tbody.appendChild(row);
    updatePreview();
}

// Remove exercise row
function removeExerciseRow(button) {
    const row = button.closest('tr');
    row.remove();
    updatePreview();
}

// Add reference row
function addReferenceRow() {
    const referenceList = document.getElementById('referenceList');
    const div = document.createElement('div');
    div.className = 'reference-item';
    div.innerHTML = `
        <input type="text" placeholder="제목" class="reference-title">
        <input type="text" placeholder="URL" class="reference-url">
        <button class="remove-btn" onclick="removeReferenceRow(this)">삭제</button>
    `;
    referenceList.appendChild(div);
    updatePreview();
}

// Remove reference row
function removeReferenceRow(button) {
    const item = button.closest('.reference-item');
    item.remove();
    updatePreview();
}

// Update preview area with formatted text
function updatePreview() {
    const memberSelect = document.getElementById('memberSelect');
    const memberName = memberSelect.options[memberSelect.selectedIndex]?.text || '';
    const workoutDate = document.getElementById('workoutDate').value;
    const statusCheck = document.getElementById('statusCheck').value;
    const comment = document.getElementById('comment').value;

    // Get exercise data from table
    const exerciseRows = document.querySelectorAll('#exerciseTableBody tr');
    const exercises = [];
    exerciseRows.forEach(row => {
        const name = row.querySelector('.exercise-name').value.trim();
        const sets = row.querySelector('.exercise-sets').value.trim();
        const count = row.querySelector('.exercise-count').value.trim();
        const note = row.querySelector('.exercise-note').value.trim();

        if (name || sets || count) {
            exercises.push({ name, sets, count, note });
        }
    });

    // Get reference data
    const referenceItems = document.querySelectorAll('.reference-item');
    const references = [];
    referenceItems.forEach(item => {
        const title = item.querySelector('.reference-title').value.trim();
        const url = item.querySelector('.reference-url').value.trim();

        if (title || url) {
            references.push({ title, url });
        }
    });

    // Generate KakaoTalk formatted text
    let kakaoText = '';

    // Add date and member
    if (workoutDate) {
        const date = new Date(workoutDate);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        kakaoText += `📅 ${formattedDate}`;
        if (memberName && memberName !== '회원을 선택하세요') {
            kakaoText += ` - ${memberName} 회원님`;
        }
        kakaoText += '\n\n';
    }

    // Add status check
    if (statusCheck) {
        kakaoText += `🔍 컨디션 체크\n${statusCheck}\n\n`;
    }

    // Add exercises
    if (exercises.length > 0) {
        kakaoText += `💪 오늘의 운동\n`;
        exercises.forEach((exercise, index) => {
            kakaoText += `\n${index + 1}. ${exercise.name || '운동명'}`;
            if (exercise.count) {
                kakaoText += ` (${exercise.count}세트)`;
            }
            if (exercise.sets) {
                kakaoText += `\n   ${exercise.sets}`;
            }
            if (exercise.note) {
                kakaoText += `\n   ※ ${exercise.note}`;
            }
            kakaoText += '\n';
        });
        kakaoText += '\n';
    }

    // Add comment
    if (comment) {
        kakaoText += `💬 코멘트\n${comment}\n\n`;
    }

    // Add references
    if (references.length > 0) {
        kakaoText += `📎 참고자료\n`;
        references.forEach((ref, index) => {
            if (ref.title && ref.url) {
                kakaoText += `${index + 1}. ${ref.title}\n   ${ref.url}\n`;
            } else if (ref.url) {
                kakaoText += `${index + 1}. ${ref.url}\n`;
            }
        });
        kakaoText += '\n';
    }

    // Add signature
    kakaoText += `\n수고하셨습니다! 💯\n`;

    // Update textarea
    document.getElementById('kakaoTextArea').value = kakaoText;
}

// Copy to clipboard
function copyToClipboard() {
    const textarea = document.getElementById('kakaoTextArea');
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');

        // Visual feedback
        const button = event.target.closest('.copy-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="material-icons" style="vertical-align: middle; font-size: 1.2rem;">check</span> 복사 완료!';
        button.style.background = '#4caf50';

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '#FEE500';
        }, 2000);
    } catch (err) {
        alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
}

// Save workout log to database
async function saveWorkoutLog() {
    const memberSelect = document.getElementById('memberSelect');
    const memberId = memberSelect.value;
    const workoutDate = document.getElementById('workoutDate').value;
    const statusCheck = document.getElementById('statusCheck').value;
    const comment = document.getElementById('comment').value;

    // Validation
    if (!memberId) {
        alert('회원을 선택해주세요.');
        return;
    }

    if (!workoutDate) {
        alert('운동 날짜를 선택해주세요.');
        return;
    }

    // Get exercise data
    const exerciseRows = document.querySelectorAll('#exerciseTableBody tr');
    const exercises = [];
    exerciseRows.forEach(row => {
        const name = row.querySelector('.exercise-name').value.trim();
        const sets = row.querySelector('.exercise-sets').value.trim();
        const count = row.querySelector('.exercise-count').value.trim();
        const note = row.querySelector('.exercise-note').value.trim();

        if (name) {
            exercises.push({ name, sets, count, note });
        }
    });

    if (exercises.length === 0) {
        alert('최소 1개 이상의 운동을 입력해주세요.');
        return;
    }

    // Get reference data
    const referenceItems = document.querySelectorAll('.reference-item');
    const references = [];
    referenceItems.forEach(item => {
        const title = item.querySelector('.reference-title').value.trim();
        const url = item.querySelector('.reference-url').value.trim();

        if (title && url) {
            references.push({ title, url });
        }
    });

    try {
        // Create workout log
        const { data: workoutLog, error: logError } = await supabase
            .from('workout_logs')
            .insert([{
                member_id: parseInt(memberId),
                log_date: workoutDate,
                status_check: statusCheck || null,
                comment: comment || null
            }])
            .select()
            .single();

        if (logError) throw logError;

        // Insert exercises
        for (let i = 0; i < exercises.length; i++) {
            const exercise = exercises[i];

            // Insert exercise
            const { data: exerciseData, error: exerciseError } = await supabase
                .from('exercises')
                .insert([{
                    workout_log_id: workoutLog.id,
                    exercise_name: exercise.name,
                    exercise_order: i + 1
                }])
                .select()
                .single();

            if (exerciseError) throw exerciseError;

            // Parse sets and insert
            if (exercise.sets) {
                const setsList = exercise.sets.split(',').map(s => s.trim());
                for (let j = 0; j < setsList.length; j++) {
                    const setInfo = setsList[j];
                    // Parse format like "15kg x 12" or "20 x 10"
                    const match = setInfo.match(/(\d+(?:\.\d+)?)\s*(?:kg)?\s*x\s*(\d+)/i);
                    if (match) {
                        const weight = parseFloat(match[1]);
                        const reps = parseInt(match[2]);

                        const { error: setError } = await supabase
                            .from('exercise_sets')
                            .insert([{
                                exercise_id: exerciseData.id,
                                set_number: j + 1,
                                weight: weight,
                                reps: reps
                            }]);

                        if (setError) throw setError;
                    }
                }
            }
        }

        // Insert references
        for (let i = 0; i < references.length; i++) {
            const ref = references[i];
            const { error: refError } = await supabase
                .from('workout_references')
                .insert([{
                    workout_log_id: workoutLog.id,
                    title: ref.title,
                    url: ref.url,
                    reference_order: i + 1
                }]);

            if (refError) throw refError;
        }

        // Success
        alert('운동일지가 저장되었습니다!');

        // Ask if user wants to create another entry
        if (confirm('새로운 운동일지를 작성하시겠습니까?')) {
            resetForm();
        }
    } catch (error) {
        console.error('Error saving workout log:', error);
        alert('운동일지 저장에 실패했습니다.\n' + error.message);
    }
}

// Reset form
function resetForm() {
    document.getElementById('memberSelect').value = '';
    setTodayDate();
    document.getElementById('statusCheck').value = '';
    document.getElementById('comment').value = '';

    // Reset exercise table to one row
    const tbody = document.getElementById('exerciseTableBody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" placeholder="숄더 프레스" class="exercise-name"></td>
            <td><input type="text" placeholder="15kg x 12, 20kg x 10" class="exercise-sets"></td>
            <td><input type="text" placeholder="3" class="small-input exercise-count"></td>
            <td><input type="text" placeholder="폼 개선" class="exercise-note"></td>
            <td><button class="remove-btn" onclick="removeExerciseRow(this)">삭제</button></td>
        </tr>
    `;

    // Reset reference list to one row
    const referenceList = document.getElementById('referenceList');
    referenceList.innerHTML = `
        <div class="reference-item">
            <input type="text" placeholder="제목" class="reference-title">
            <input type="text" placeholder="URL" class="reference-url">
            <button class="remove-btn" onclick="removeReferenceRow(this)">삭제</button>
        </div>
    `;

    updatePreview();
    setupEventListeners();
}

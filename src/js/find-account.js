// Supabase 클라이언트 초기화
let supabase;

document.addEventListener('DOMContentLoaded', () => {
    // Supabase 초기화
    if (typeof window.APP_CONFIG !== 'undefined') {
        supabase = window.supabase.createClient(
            window.APP_CONFIG.SUPABASE_URL,
            window.APP_CONFIG.SUPABASE_ANON_KEY
        );
    } else {
        console.error('Config not loaded');
        alert('시스템 설정을 불러올 수 없습니다.');
        return;
    }

    // 탭 전환
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // 탭 활성화
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 콘텐츠 활성화
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab).classList.add('active');

            // 결과 초기화
            hideResult('findIdResult');
            hideResult('findPasswordResult');
        });
    });

    // 아이디 찾기 폼 제출
    document.getElementById('findIdForm').addEventListener('submit', handleFindId);

    // 비밀번호 찾기 폼 제출
    document.getElementById('findPasswordForm').addEventListener('submit', handleFindPassword);
});

// 아이디 찾기
async function handleFindId(e) {
    e.preventDefault();

    const name = document.getElementById('findIdName').value.trim();
    const email = document.getElementById('findIdEmail').value.trim();
    const button = document.getElementById('findIdButton');
    const resultBox = document.getElementById('findIdResult');

    hideResult(resultBox);

    if (!name || !email) {
        showResult(resultBox, '이름과 이메일을 입력해주세요.', true);
        return;
    }

    button.disabled = true;
    button.textContent = '찾는 중...';

    try {
        // DB에서 이름과 이메일로 사용자 조회
        const { data, error } = await supabase
            .from('users')
            .select('user_id, created_at')
            .eq('name', name)
            .eq('email', email)
            .single();

        if (error || !data) {
            showResult(resultBox, '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.', true);
            return;
        }

        // 아이디 일부 마스킹 (앞 2자리만 표시)
        const maskedId = maskUserId(data.user_id);
        const createdDate = new Date(data.created_at).toLocaleDateString('ko-KR');

        showResult(
            resultBox,
            `회원님의 아이디는 <strong>${maskedId}</strong>입니다.<br>
            가입일: ${createdDate}`,
            false
        );

    } catch (err) {
        console.error('아이디 찾기 오류:', err);
        showResult(resultBox, '아이디 찾기 처리 중 오류가 발생했습니다.', true);
    } finally {
        button.disabled = false;
        button.textContent = '아이디 찾기';
    }
}

// 비밀번호 찾기 (임시 비밀번호 발급)
async function handleFindPassword(e) {
    e.preventDefault();

    const userId = document.getElementById('findPwUserId').value.trim();
    const email = document.getElementById('findPwEmail').value.trim();
    const button = document.getElementById('findPasswordButton');
    const resultBox = document.getElementById('findPasswordResult');

    hideResult(resultBox);

    if (!userId || !email) {
        showResult(resultBox, '아이디와 이메일을 입력해주세요.', true);
        return;
    }

    button.disabled = true;
    button.textContent = '처리 중...';

    try {
        // DB에서 아이디와 이메일로 사용자 조회
        const { data, error } = await supabase
            .from('users')
            .select('user_id, email, name')
            .eq('user_id', userId)
            .eq('email', email)
            .single();

        if (error || !data) {
            showResult(resultBox, '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.', true);
            return;
        }

        // 임시 비밀번호 생성 (8자리 랜덤)
        const tempPassword = generateTempPassword();

        // DB에 임시 비밀번호 저장
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: tempPassword, // 실제로는 해시화 필요
                updated_at: new Date().toISOString(),
                updated_id: userId
            })
            .eq('user_id', userId);

        if (updateError) {
            throw updateError;
        }

        // 실제 환경에서는 이메일 발송
        // 현재는 화면에 표시
        showResult(
            resultBox,
            `임시 비밀번호가 발급되었습니다.<br>
            <strong>임시 비밀번호: ${tempPassword}</strong><br><br>
            <small>※ 실제 서비스에서는 이메일로 발송됩니다.</small><br>
            <small>※ 로그인 후 반드시 비밀번호를 변경해주세요.</small>`,
            false
        );

    } catch (err) {
        console.error('비밀번호 찾기 오류:', err);
        showResult(resultBox, '비밀번호 찾기 처리 중 오류가 발생했습니다.', true);
    } finally {
        button.disabled = false;
        button.textContent = '임시 비밀번호 발급';
    }
}

// 아이디 마스킹 (앞 2-3자리만 표시)
function maskUserId(userId) {
    if (userId.length <= 3) {
        return userId[0] + '*'.repeat(userId.length - 1);
    }
    const visibleLength = Math.ceil(userId.length / 3);
    return userId.substring(0, visibleLength) + '*'.repeat(userId.length - visibleLength);
}

// 임시 비밀번호 생성 (8자리 영문+숫자)
function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// 결과 표시
function showResult(element, message, isError) {
    element.innerHTML = `
        <div class="result-title">${isError ? '오류' : '찾기 완료'}</div>
        <div class="result-text">${message}</div>
    `;
    element.classList.add('show');
    if (isError) {
        element.classList.add('error');
    } else {
        element.classList.remove('error');
    }
}

// 결과 숨기기
function hideResult(element) {
    element.classList.remove('show');
    element.classList.remove('error');
    element.innerHTML = '';
}

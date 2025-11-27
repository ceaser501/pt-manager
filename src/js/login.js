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

    // 요소 가져오기
    const loginForm = document.getElementById('loginForm');
    const signupButton = document.getElementById('signupButton');
    const signupModal = document.getElementById('signupModal');
    const closeModal = document.getElementById('closeModal');
    const signupForm = document.getElementById('signupForm');
    const searchAddressBtn = document.getElementById('searchAddressBtn');

    // 로그인 상태 확인 - 이미 로그인된 경우 dashboard로 이동
    checkLoginStatus();

    // 로그인 폼 제출
    loginForm.addEventListener('submit', handleLogin);

    // 회원가입 모달 열기
    signupButton.addEventListener('click', () => {
        signupModal.classList.add('active');
    });

    // 모달 닫기
    closeModal.addEventListener('click', () => {
        signupModal.classList.remove('active');
        signupForm.reset();
        clearErrors();
    });

    // 모달 외부 클릭시 닫기
    signupModal.addEventListener('click', (e) => {
        if (e.target === signupModal) {
            signupModal.classList.remove('active');
            signupForm.reset();
            clearErrors();
        }
    });

    // 회원가입 폼 제출
    signupForm.addEventListener('submit', handleSignup);

    // 주소 검색 (Daum 우편번호 API 사용 - 실제 구현시 필요)
    searchAddressBtn.addEventListener('click', () => {
        alert('주소 검색 기능은 Daum 우편번호 API 연동 후 사용 가능합니다.\n임시로 직접 입력해주세요.');
        document.getElementById('signupZipCode').removeAttribute('readonly');
        document.getElementById('signupAddress').removeAttribute('readonly');
    });

    // 비밀번호 실시간 확인
    document.getElementById('signupPasswordConfirm').addEventListener('input', (e) => {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = e.target.value;
        const errorElement = document.getElementById('signupPasswordConfirmError');

        if (confirmPassword && password !== confirmPassword) {
            errorElement.textContent = '비밀번호가 일치하지 않습니다.';
            errorElement.classList.add('show');
            e.target.classList.add('error');
        } else {
            errorElement.classList.remove('show');
            e.target.classList.remove('error');
        }
    });
});

// 로그인 상태 확인
async function checkLoginStatus() {
    const userId = localStorage.getItem('pt_manager_user_id');
    if (userId) {
        // 세션 유효성 확인
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_id, role, is_active')
                .eq('user_id', userId)
                .single();

            if (data && data.is_active === 'Y') {
                // 유효한 세션이 있으면 dashboard로 이동
                window.location.href = 'dashboard.html';
            } else {
                // 세션이 유효하지 않으면 로컬스토리지 클리어
                localStorage.removeItem('pt_manager_user_id');
                localStorage.removeItem('pt_manager_user_role');
            }
        } catch (err) {
            console.error('세션 확인 오류:', err);
        }
    }
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginButton = document.getElementById('loginButton');

    // 입력 검증
    if (!userId || !password) {
        showError('userIdError', '아이디와 비밀번호를 입력해주세요.');
        return;
    }

    // 버튼 비활성화
    loginButton.disabled = true;
    loginButton.textContent = '로그인 중...';

    try {
        // DB에서 사용자 정보 조회
        const { data, error } = await supabase
            .from('users')
            .select('user_id, password, role, name, is_active')
            .eq('user_id', userId)
            .single();

        if (error) {
            showError('userIdError', '아이디 또는 비밀번호가 일치하지 않습니다.');
            return;
        }

        // 비밀번호 확인 (단순 비교 - 추후 해시 비교로 변경 필요)
        if (data.password !== password) {
            showError('passwordError', '아이디 또는 비밀번호가 일치하지 않습니다.');
            return;
        }

        // 계정 활성화 상태 확인
        if (data.is_active !== 'Y') {
            let message = '비활성화된 계정입니다.';
            if (data.is_active === 'H') {
                message = '홀딩 상태인 계정입니다. 관리자에게 문의하세요.';
            }
            showError('userIdError', message);
            return;
        }

        // 로그인 성공 - 마지막 로그인 시간 업데이트
        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('user_id', userId);

        // 로컬스토리지에 사용자 정보 저장
        if (rememberMe) {
            localStorage.setItem('pt_manager_user_id', data.user_id);
            localStorage.setItem('pt_manager_user_role', data.role);
            localStorage.setItem('pt_manager_user_name', data.name);
        } else {
            sessionStorage.setItem('pt_manager_user_id', data.user_id);
            sessionStorage.setItem('pt_manager_user_role', data.role);
            sessionStorage.setItem('pt_manager_user_name', data.name);
        }

        // 역할에 따라 페이지 이동
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error('로그인 오류:', err);
        showError('userIdError', '로그인 처리 중 오류가 발생했습니다.');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = '로그인';
    }
}

// 회원가입 처리
async function handleSignup(e) {
    e.preventDefault();

    // 폼 데이터 가져오기
    const formData = {
        user_id: document.getElementById('signupUserId').value.trim(),
        password: document.getElementById('signupPassword').value,
        passwordConfirm: document.getElementById('signupPasswordConfirm').value,
        name: document.getElementById('signupName').value.trim(),
        birth_date: document.getElementById('signupBirthDate').value,
        gender: document.getElementById('signupGender').value,
        phone_number: document.getElementById('signupPhone').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        zip_code: document.getElementById('signupZipCode').value.trim(),
        address: document.getElementById('signupAddress').value.trim(),
        detail_address: document.getElementById('signupDetailAddress').value.trim()
    };

    // 유효성 검사
    if (!validateSignupForm(formData)) {
        return;
    }

    const submitButton = document.getElementById('signupSubmitButton');
    submitButton.disabled = true;
    submitButton.textContent = '회원가입 처리 중...';

    try {
        // 아이디 중복 확인
        const { data: existingUser } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_id', formData.user_id)
            .single();

        if (existingUser) {
            showError('signupUserIdError', '이미 사용 중인 아이디입니다.');
            submitButton.disabled = false;
            submitButton.textContent = '회원가입';
            return;
        }

        // 이메일 중복 확인
        const { data: existingEmail } = await supabase
            .from('users')
            .select('email')
            .eq('email', formData.email)
            .single();

        if (existingEmail) {
            showError('signupEmailError', '이미 사용 중인 이메일입니다.');
            submitButton.disabled = false;
            submitButton.textContent = '회원가입';
            return;
        }

        // 회원 정보 저장
        const { error } = await supabase
            .from('users')
            .insert([{
                user_id: formData.user_id,
                password: formData.password, // 실제로는 해시화 필요
                role: 'member',
                name: formData.name,
                birth_date: formData.birth_date,
                phone_number: formData.phone_number,
                email: formData.email,
                gender: formData.gender,
                address: formData.address,
                detail_address: formData.detail_address || null,
                zip_code: formData.zip_code,
                is_active: 'N', // 관리자 승인 대기
                created_id: formData.user_id,
                updated_id: formData.user_id
            }]);

        if (error) {
            throw error;
        }

        // 회원가입 성공
        alert('회원가입이 완료되었습니다!\n관리자 승인 후 로그인 가능합니다.');
        document.getElementById('signupModal').classList.remove('active');
        document.getElementById('signupForm').reset();
        clearErrors();

    } catch (err) {
        console.error('회원가입 오류:', err);
        alert('회원가입 처리 중 오류가 발생했습니다.\n' + err.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '회원가입';
    }
}

// 회원가입 폼 유효성 검사
function validateSignupForm(formData) {
    clearErrors();
    let isValid = true;

    // 아이디 검증 (영문, 숫자 4-20자)
    const userIdRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!userIdRegex.test(formData.user_id)) {
        showError('signupUserIdError', '아이디는 영문, 숫자 조합 4-20자로 입력해주세요.');
        isValid = false;
    }

    // 비밀번호 검증 (8자 이상)
    if (formData.password.length < 8) {
        showError('signupPasswordError', '비밀번호는 8자 이상 입력해주세요.');
        isValid = false;
    }

    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
        showError('signupPasswordConfirmError', '비밀번호가 일치하지 않습니다.');
        isValid = false;
    }

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showError('signupEmailError', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
    }

    // 휴대폰 번호 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(formData.phone_number)) {
        showError('signupPhoneError', '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-0000-0000)');
        isValid = false;
    }

    return isValid;
}

// 에러 메시지 표시
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');

        const inputId = elementId.replace('Error', '');
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }
}

// 모든 에러 메시지 제거
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });

    const errorInputs = document.querySelectorAll('.form-input.error');
    errorInputs.forEach(input => {
        input.classList.remove('error');
    });
}

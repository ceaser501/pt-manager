// Dashboard functionality
(function() {
    'use strict';

    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY
    );

    // Helper function to get today's date in YYYY-MM-DD format (Local timezone)
    function getTodayDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();

    let miniYear = new Date().getFullYear();
    let miniMonth = new Date().getMonth();
    let selectedDate = new Date();

    // Initialize dashboard
    async function init() {
        // Run all data loading in parallel for better performance
        await Promise.all([
            loadStatistics(),
            checkLowSessions(),
            renderWeeklySchedule(),
            renderMiniCalendar(),
            loadTodaySchedule(),
            loadDailyNote()
        ]);

        // Setup event listeners after data is loaded
        setupEventListeners();
        setupMiniCalendarEvents();
        setupHelpButton();
        setupReminderEvents();
    }

    // Load statistics
    async function loadStatistics() {
        try {
            // Total members
            const { count: totalMembers } = await supabase
                .from('member')
                .select('*', { count: 'exact', head: true });

            document.getElementById('totalMembers').textContent = totalMembers || 0;

            // Today's schedule
            const today = getTodayDate();
            const { count: todayCount } = await supabase
                .from('training_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('session_date', today);

            document.getElementById('todaySchedule').textContent = todayCount || 0;

            // Monthly sessions
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            const { count: monthlyCount } = await supabase
                .from('training_sessions')
                .select('*', { count: 'exact', head: true })
                .gte('session_date', firstDayOfMonth)
                .lte('session_date', lastDayOfMonth);

            document.getElementById('monthlySession').textContent = monthlyCount || 0;

            // Goal achievement (calculate based on monthly sessions)
            // Assuming goal is 150 sessions per month
            const goalTarget = 150;
            const achievementRate = monthlyCount ? Math.round((monthlyCount / goalTarget) * 100) : 0;
            document.getElementById('goalAchievement').textContent = achievementRate + '%';

        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    // Member color mapping
    const memberColorMap = {};
    let colorIndex = 0;

    function getMemberColorClass(memberId) {
        if (!memberColorMap[memberId]) {
            memberColorMap[memberId] = `member-color-${colorIndex % 10}`;
            colorIndex++;
        }
        return memberColorMap[memberId];
    }

    // Render weekly schedule
    async function renderWeeklySchedule() {
        const scheduleTableBody = document.getElementById('scheduleTableBody');

        if (!scheduleTableBody) {
            console.error('scheduleTableBody element not found');
            return;
        }

        // Get current week (Monday to Sunday)
        const today = new Date();
        const currentDay = today.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);

        const weekDays = [];
        const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            weekDays.push(day);
        }

        // Update table headers with dates
        weekDays.forEach((day, index) => {
            const th = document.getElementById(`day-${index}`);
            if (th) {
                const isToday = day.toDateString() === today.toDateString();
                if (isToday) {
                    th.classList.add('today');
                } else {
                    th.classList.remove('today');
                }
                th.innerHTML = `${dayNames[index]}<br>${day.getDate()}`;
            }
        });

        // Fetch reservations for the week
        // Use local date instead of UTC
        const firstDayObj = weekDays[0];
        const firstDay = `${firstDayObj.getFullYear()}-${String(firstDayObj.getMonth() + 1).padStart(2, '0')}-${String(firstDayObj.getDate()).padStart(2, '0')}`;
        const lastDayObj = weekDays[6];
        const lastDay = `${lastDayObj.getFullYear()}-${String(lastDayObj.getMonth() + 1).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

        let reservations = [];

        try {
            const { data, error } = await supabase
                .from('training_sessions')
                .select(`
                    *,
                    member!inner(
                        member_id,
                        session_total_count,
                        session_used_count,
                        users!inner(name)
                    )
                `)
                .gte('session_date', firstDay)
                .lte('session_date', lastDay)
                .order('session_date', { ascending: true })
                .order('session_start_time', { ascending: true });

            if (error) {
                console.error('Error fetching reservations:', error);
                // Continue with empty reservations array
            } else {
                reservations = data || [];

                // Calculate session count for each reservation based on chronological order
                const memberIds = [...new Set(reservations.map(r => r.member_id))];
                const memberSessionCounts = {};

                if (memberIds.length > 0) {
                    // Get all sessions for all members in one query
                    const { data: allSessions } = await supabase
                        .from('training_sessions')
                        .select('session_id, member_id, session_date, session_start_time')
                        .in('member_id', memberIds)
                        .order('session_date', { ascending: true })
                        .order('session_start_time', { ascending: true });

                    // Group sessions by member_id
                    const sessionsByMember = {};
                    if (allSessions) {
                        allSessions.forEach(ses => {
                            if (!sessionsByMember[ses.member_id]) {
                                sessionsByMember[ses.member_id] = [];
                            }
                            sessionsByMember[ses.member_id].push(ses);
                        });
                    }

                    // Calculate session counts for each reservation
                    for (const reservation of reservations) {
                        const memberId = reservation.member_id;

                        if (!memberSessionCounts[memberId]) {
                            const memberSessions = sessionsByMember[memberId] || [];
                            const currentIndex = memberSessions.findIndex(s => s.session_id === reservation.session_id);
                            const totalSessions = reservation.member.session_total_count;
                            const usedSessions = reservation.member.session_used_count;
                            const remainingSessions = totalSessions - usedSessions;

                            memberSessionCounts[memberId] = {
                                currentCount: remainingSessions,
                                total: totalSessions
                            };
                        }

                        // Add calculated session info to reservation
                        reservation.calculated_remaining = memberSessionCounts[memberId].currentCount;
                        reservation.calculated_total = memberSessionCounts[memberId].total;

                        // Decrement for next reservation
                        if (memberSessionCounts[memberId].currentCount > 0) {
                            memberSessionCounts[memberId].currentCount--;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            // Continue with empty reservations array
        }

        // Update weekly count
        const weeklyCountEl = document.getElementById('weeklyCount');
        if (weeklyCountEl) {
            weeklyCountEl.textContent = reservations.length;
        }

        // Create schedule table rows (always show the table, even if empty)
        scheduleTableBody.innerHTML = '';

        // Time slots from 09:00 to 22:00
        for (let hour = 9; hour <= 22; hour++) {
            const row = document.createElement('tr');

            // Time cell
            const timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            timeCell.textContent = `${String(hour).padStart(2, '0')}:00`;
            row.appendChild(timeCell);

            // Day cells
            weekDays.forEach((day, dayIndex) => {
                const cell = document.createElement('td');
                cell.className = 'schedule-slot';

                // Use local date instead of UTC
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const dayNum = String(day.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum}`;
                const timeStr = `${String(hour).padStart(2, '0')}:00:00`;

                const reservation = reservations.find(res =>
                    res.session_date === dateStr &&
                    res.session_start_time === timeStr
                );

                if (reservation && reservation.member) {
                    cell.classList.add('has-reservation');
                    const colorClass = getMemberColorClass(reservation.member_id);
                    cell.classList.add(colorClass);

                    const remaining = reservation.calculated_remaining ?? (reservation.member.session_total_count - reservation.member.session_used_count);
                    const total = reservation.calculated_total ?? reservation.member.session_total_count;

                    cell.textContent = `${reservation.member.users.name} (${remaining}/${total})`;
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => handleReservationClick(reservation));
                } else {
                    cell.classList.add('empty');
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => handleEmptySlotClick(dateStr, timeStr, dayNames[dayIndex], hour));
                }

                row.appendChild(cell);
            });

            scheduleTableBody.appendChild(row);
        }
    }

    // Handle empty slot click
    async function handleEmptySlotClick(dateStr, timeStr, dayName, hour) {
        const members = await getAllMembers();
        if (!members || members.length === 0) {
            alert('등록된 회원이 없습니다. 먼저 회원을 등록해주세요.');
            return;
        }

        const memberName = prompt(`${dayName}요일 ${hour}:00 예약 등록\n\n회원 이름을 입력하세요:`);

        if (!memberName || memberName.trim() === '') {
            return;
        }

        // Find member by name
        const member = members.find(m => m.name.includes(memberName.trim()));
        if (!member) {
            alert('해당 이름의 회원을 찾을 수 없습니다.');
            return;
        }

        try {
            // Get trainer_id (assuming first trainer for now)
            const { data: trainers } = await supabase
                .from('trainer')
                .select('trainer_id')
                .limit(1);

            if (!trainers || trainers.length === 0) {
                alert('등록된 트레이너가 없습니다. 먼저 트레이너를 등록해주세요.');
                return;
            }

            const trainerId = trainers[0].trainer_id;

            // Calculate end time (1 hour later)
            const startHour = parseInt(timeStr.split(':')[0]);
            const endTime = `${String(startHour + 1).padStart(2, '0')}:00:00`;

            const { data, error } = await supabase
                .from('training_sessions')
                .insert({
                    member_id: member.id,
                    trainer_id: trainerId,
                    session_date: dateStr,
                    session_start_time: timeStr,
                    session_end_time: endTime,
                    session_status: 'scheduled',
                    session_notes: null,
                    created_id: 'system',
                    updated_id: 'system'
                });

            if (error) {
                console.error('Supabase error:', error);
                alert(`예약 등록에 실패했습니다.\n에러: ${error.message}`);
                return;
            }

            await renderWeeklySchedule();
            await loadStatistics();
            await loadTodaySchedule();
        } catch (error) {
            console.error('Error creating reservation:', error);
            alert(`예약 등록에 실패했습니다.\n에러: ${error.message || '알 수 없는 오류'}`);
        }
    }

    // Handle reservation click
    function handleReservationClick(reservation) {
        const action = confirm(`${reservation.member.users.name}님의 예약입니다.\n\n취소하시겠습니까?`);

        if (action) {
            deleteReservation(reservation.session_id);
        }
    }

    // Get all members
    async function getAllMembers() {
        try {
            const { data, error } = await supabase
                .from('member')
                .select(`
                    member_id,
                    session_total_count,
                    session_used_count,
                    users!inner(user_id, name)
                `)
                .order('users(name)', { ascending: true });

            if (error) throw error;
            // Map to match expected structure
            return data.map(m => ({
                id: m.member_id,
                name: m.users.name,
                remaining_sessions: m.session_total_count - m.session_used_count,
                total_sessions: m.session_total_count
            }));
        } catch (error) {
            console.error('Error fetching members:', error);
            return [];
        }
    }

    // Delete reservation
    async function deleteReservation(sessionId) {
        try {
            const { error } = await supabase
                .from('training_sessions')
                .delete()
                .eq('session_id', sessionId);

            if (error) throw error;

            alert('예약이 취소되었습니다.');
            await renderWeeklySchedule();
            await loadStatistics();
            await loadTodaySchedule();
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('예약 취소에 실패했습니다.');
        }
    }

    // Render calendar
    async function renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const calendarTitle = document.getElementById('calendarTitle');

        // Update title
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        calendarTitle.textContent = `${currentYear}년 ${monthNames[currentMonth]}`;

        // Get first day of month and total days
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Get sessions for the month
        const firstDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const lastDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

        const { data: reservations } = await supabase
            .from('training_sessions')
            .select('session_date')
            .gte('session_date', firstDayStr)
            .lte('session_date', lastDayStr);

        // Count sessions per day
        const reservationCounts = {};
        if (reservations) {
            reservations.forEach(res => {
                const date = new Date(res.session_date).getDate();
                reservationCounts[date] = (reservationCounts[date] || 0) + 1;
            });
        }

        // Clear existing days
        calendarDays.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }

        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            const isToday = today.getDate() === day &&
                          today.getMonth() === currentMonth &&
                          today.getFullYear() === currentYear;

            const hasReservation = reservationCounts[day] > 0;

            if (isToday) {
                dayElement.classList.add('today');
            }

            if (hasReservation) {
                dayElement.classList.add('has-reservation');
            }

            dayElement.innerHTML = `
                <div class="calendar-day-number">${day}</div>
                ${hasReservation ? `<div class="reservation-count">${reservationCounts[day]}건</div>` : ''}
            `;

            calendarDays.appendChild(dayElement);
        }
    }

    // Load today's schedule
    async function loadTodaySchedule() {
        const scheduleList = document.getElementById('todayScheduleList2');
        const today = getTodayDate();
        const currentTime = new Date();

        try {
            const { data: reservations, error } = await supabase
                .from('training_sessions')
                .select(`
                    session_id,
                    session_start_time,
                    session_notes,
                    session_status,
                    member!inner(users!inner(name))
                `)
                .eq('session_date', today)
                .order('session_start_time', { ascending: true });

            if (error) throw error;

            if (!reservations || reservations.length === 0) {
                scheduleList.innerHTML = `
                    <div class="empty-schedule">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <p>오늘 예약된 일정이 없습니다</p>
                    </div>
                `;
                return;
            }

            // Find next upcoming session
            let nextUpcomingIndex = -1;
            const now = currentTime.getHours() * 60 + currentTime.getMinutes();

            for (let i = 0; i < reservations.length; i++) {
                const [hours, minutes] = reservations[i].session_start_time.split(':');
                const sessionMinutes = parseInt(hours) * 60 + parseInt(minutes);

                if (sessionMinutes > now) {
                    nextUpcomingIndex = i;
                    break;
                }
            }

            scheduleList.innerHTML = reservations.map((reservation, index) => {
                const [hours, minutes] = reservation.session_start_time.split(':');
                const sessionMinutes = parseInt(hours) * 60 + parseInt(minutes);
                const isCompleted = sessionMinutes < now;
                const isUpcoming = index === nextUpcomingIndex;

                let itemClass = 'schedule-item';
                if (isCompleted) {
                    itemClass += ' completed';
                } else if (isUpcoming) {
                    itemClass += ' upcoming';
                }

                return `
                    <div class="${itemClass}">
                        <div class="schedule-time">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${hours}:${minutes}
                        </div>
                        <div class="schedule-member">
                            ${reservation.member.users.name}
                            <span class="status-badge ${isCompleted ? 'completed' : 'scheduled'}">
                                ${isCompleted ? '완료' : '예정'}
                            </span>
                        </div>
                        ${reservation.session_notes ? `<div class="schedule-notes">${reservation.session_notes}</div>` : ''}
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading today\'s schedule:', error);
            scheduleList.innerHTML = `
                <div class="empty-schedule">
                    <p>일정을 불러오는 중 오류가 발생했습니다</p>
                </div>
            `;
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // No calendar navigation needed anymore
    }

    // Check for members with low sessions
    async function checkLowSessions() {
        const alertContainer = document.getElementById('lowSessionAlert');

        try {
            const { data: members, error } = await supabase
                .from('member')
                .select(`
                    member_id,
                    session_total_count,
                    session_used_count,
                    session_end_date,
                    users!inner(name)
                `)
                .order('session_used_count', { ascending: false });

            if (error) throw error;

            // Filter members with less than 5 remaining sessions
            const lowSessionMembers = members.filter(m => {
                const remaining = m.session_total_count - m.session_used_count;
                return remaining < 5 && remaining > 0;
            });

            if (lowSessionMembers && lowSessionMembers.length > 0) {
                alertContainer.classList.remove('hidden');
                alertContainer.innerHTML = `
                    <div class="alert-notification">
                        <div class="alert-notification-header">
                            <svg class="alert-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span class="alert-notification-title">세션 부족 알림</span>
                            <span class="alert-notification-count">${lowSessionMembers.length}</span>
                        </div>
                        <div class="alert-members">
                            ${lowSessionMembers.map(member => {
                                const remaining = member.session_total_count - member.session_used_count;
                                const endDateStr = member.session_end_date
                                    ? ` (~${new Date(member.session_end_date).toLocaleDateString('ko-KR', {month: 'numeric', day: 'numeric'})})`
                                    : '';
                                return `
                                    <div class="alert-member-item">
                                        <span class="alert-member-name">${member.users.name}${endDateStr}</span>
                                        <span class="alert-member-sessions">${remaining}/${member.session_total_count}회</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else {
                alertContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error checking low sessions:', error);
        }
    }

    // Load daily note
    // Note: daily_notes table is not in the new schema
    // This feature is temporarily disabled
    async function loadDailyNote() {
        const reminderReadView = document.getElementById('reminderReadView');
        const reminderTextarea2 = document.getElementById('reminderTextarea2');

        if (!reminderReadView || !reminderTextarea2) return;

        // Set placeholder text
        reminderReadView.textContent = '일일 메모 기능은 준비 중입니다.';
        reminderTextarea2.value = '';
        reminderTextarea2.placeholder = '일일 메모 기능은 준비 중입니다.';

        // Disable textarea
        reminderTextarea2.disabled = true;
    }

    // Save daily note
    async function saveDailyNote(content) {
        // daily_notes table is not in the new schema
        alert('일일 메모 기능은 준비 중입니다.');
        return false;
    }

    // Setup reminder events
    function setupReminderEvents() {
        const editBtn = document.getElementById('editReminderBtn');
        const reminderReadView = document.getElementById('reminderReadView');
        const reminderTextarea2 = document.getElementById('reminderTextarea2');

        if (!editBtn || !reminderReadView || !reminderTextarea2) {
            console.error('Elements not found');
            return;
        }

        let isEditing = false;

        editBtn.addEventListener('click', async () => {
            if (!isEditing) {
                // 편집 모드로 전환
                isEditing = true;
                reminderReadView.classList.add('hidden');
                reminderTextarea2.classList.remove('hidden');
                editBtn.textContent = '저장하기';
                reminderTextarea2.focus();
            } else {
                // 저장 모드
                const content = reminderTextarea2.value.trim();

                const success = await saveDailyNote(content);
                if (success) {
                    // 읽기 모드로 전환
                    isEditing = false;
                    reminderReadView.textContent = content;
                    reminderReadView.classList.remove('hidden');
                    reminderTextarea2.classList.add('hidden');
                    editBtn.textContent = '수정하기';
                    alert('메모가 저장되었습니다.');
                }
            }
        });
    }

    // Render mini calendar
    async function renderMiniCalendar() {
        const miniCalendarDays = document.getElementById('miniCalendarDays');
        const miniCalendarTitle = document.getElementById('miniCalendarTitle');

        // Update title
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        miniCalendarTitle.textContent = `${miniYear}년 ${monthNames[miniMonth]}`;

        // Get first day of month and total days
        const firstDay = new Date(miniYear, miniMonth, 1);
        const lastDay = new Date(miniYear, miniMonth + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Get previous month info
        const prevMonthLastDay = new Date(miniYear, miniMonth, 0).getDate();

        // Get sessions for the month
        const firstDayStr = `${miniYear}-${String(miniMonth + 1).padStart(2, '0')}-01`;
        const lastDayStr = `${miniYear}-${String(miniMonth + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

        const { data: reservations } = await supabase
            .from('training_sessions')
            .select('session_date')
            .gte('session_date', firstDayStr)
            .lte('session_date', lastDayStr);

        // Count sessions per day
        const reservationDates = new Set();
        if (reservations) {
            reservations.forEach(res => {
                reservationDates.add(res.session_date);
            });
        }

        // Clear existing days
        miniCalendarDays.innerHTML = '';

        // Add previous month's days
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const dayElement = document.createElement('div');
            dayElement.className = 'mini-calendar-day other-month';
            dayElement.textContent = day;
            miniCalendarDays.appendChild(dayElement);
        }

        // Add current month's days
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'mini-calendar-day';

            const dateStr = `${miniYear}-${String(miniMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const isToday = today.getDate() === day &&
                          today.getMonth() === miniMonth &&
                          today.getFullYear() === miniYear;

            const isSelected = selectedDate.getDate() === day &&
                             selectedDate.getMonth() === miniMonth &&
                             selectedDate.getFullYear() === miniYear;

            const hasEvent = reservationDates.has(dateStr);

            if (isToday) {
                dayElement.classList.add('today');
            }

            if (isSelected && !isToday) {
                dayElement.classList.add('selected');
            }

            if (hasEvent) {
                dayElement.classList.add('has-event');
            }

            dayElement.textContent = day;
            dayElement.dataset.date = dateStr;

            dayElement.addEventListener('click', () => {
                selectedDate = new Date(miniYear, miniMonth, day);
                renderMiniCalendar();
                loadSelectedDateEvents(dateStr);
            });

            miniCalendarDays.appendChild(dayElement);
        }

        // Add next month's days to fill the grid
        const totalCells = miniCalendarDays.children.length;
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'mini-calendar-day other-month';
            dayElement.textContent = day;
            miniCalendarDays.appendChild(dayElement);
        }

        // Load events for selected date
        const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        loadSelectedDateEvents(selectedDateStr);
    }

    // Load events for selected date
    async function loadSelectedDateEvents(dateStr) {
        const selectedDateTitle = document.getElementById('selectedDateTitle');
        const miniCalendarEvents = document.getElementById('miniCalendarEvents');

        // Format date for display
        const date = new Date(dateStr);
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        const dateDisplay = `${monthNames[date.getMonth()]} ${date.getDate()}일`;
        selectedDateTitle.textContent = dateDisplay;

        try {
            const { data: reservations, error } = await supabase
                .from('training_sessions')
                .select(`
                    session_id,
                    session_start_time,
                    member!inner(users!inner(name))
                `)
                .eq('session_date', dateStr)
                .order('session_start_time', { ascending: true });

            if (error) throw error;

            if (!reservations || reservations.length === 0) {
                miniCalendarEvents.innerHTML = '<div class="mini-calendar-no-events">예약 없음</div>';
                return;
            }

            miniCalendarEvents.innerHTML = reservations.map(res => {
                const [hours, minutes] = res.session_start_time.split(':');
                return `
                    <div class="mini-calendar-event">
                        <div class="mini-calendar-event-time">${hours}:${minutes}</div>
                        <div class="mini-calendar-event-name">${res.member.users.name}</div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading selected date events:', error);
            miniCalendarEvents.innerHTML = '<div class="mini-calendar-no-events">일정을 불러올 수 없습니다</div>';
        }
    }

    // Setup mini calendar events
    function setupMiniCalendarEvents() {
        document.getElementById('miniPrevMonth').addEventListener('click', () => {
            miniMonth--;
            if (miniMonth < 0) {
                miniMonth = 11;
                miniYear--;
            }
            renderMiniCalendar();
        });

        document.getElementById('miniNextMonth').addEventListener('click', () => {
            miniMonth++;
            if (miniMonth > 11) {
                miniMonth = 0;
                miniYear++;
            }
            renderMiniCalendar();
        });
    }

    // Setup help button
    function setupHelpButton() {
        const helpButton = document.getElementById('helpButton');
        const helpPopup = document.getElementById('helpPopup');

        helpButton.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('active');
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!helpPopup.contains(e.target) && !helpButton.contains(e.target)) {
                helpPopup.classList.remove('active');
            }
        });

        // Prevent popup click from closing
        helpPopup.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

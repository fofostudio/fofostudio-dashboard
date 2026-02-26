// === CALENDAR VIEWS ===

function switchCalendarView(view) {
    currentCalendarView = view;
    
    // Update buttons
    document.querySelectorAll('.view-toggle .btn-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update views
    document.querySelectorAll('[class^="calendar-view-"]').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(`view-${view}`).classList.add('active');
    
    renderCalendar();
    updateCalendarHeader();
}

function navigateCalendar(direction) {
    if (currentCalendarView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    } else if (currentCalendarView === 'week') {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (currentCalendarView === 'day') {
        currentDate.setDate(currentDate.getDate() + direction);
    }
    
    updateCalendarHeader();
    loadCalendar();
}

function updateCalendarHeader() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    let headerText = '';
    
    if (currentCalendarView === 'month') {
        headerText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentCalendarView === 'week') {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
            headerText = `${weekStart.getDate()}-${weekEnd.getDate()} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
        } else {
            headerText = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;
        }
    } else if (currentCalendarView === 'day') {
        headerText = `${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    
    document.getElementById('current-month').textContent = headerText;
}

function renderCalendar() {
    if (currentCalendarView === 'month') {
        renderMonthView();
    } else if (currentCalendarView === 'week') {
        renderWeekView();
    } else if (currentCalendarView === 'day') {
        renderDayView();
    }
}

// === MONTH VIEW ===
function renderMonthView() {
    const container = document.getElementById('calendar-days-month');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevMonthStart = prevMonthDays - startingDayOfWeek + 1;
    
    let daysHTML = '';
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
        const day = prevMonthStart + i;
        daysHTML += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    // Current month days
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayPosts = calendarData.filter(post => post.date === dateStr);
        const isToday = isCurrentMonth && day === today.getDate();
        
        const postsHTML = dayPosts.map(post => 
            `<div class="post-dot ${post.type} ${post.status}" title="${post.title}"></div>`
        ).join('');
        
        daysHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayPosts('${dateStr}')">
                <div class="day-number">${day}</div>
                <div class="day-posts">${postsHTML}</div>
            </div>
        `;
    }
    
    // Next month padding
    const totalCells = daysHTML.split('calendar-day').length - 1;
    const nextMonthDays = 42 - totalCells; // 6 weeks
    for (let i = 1; i <= nextMonthDays; i++) {
        daysHTML += `<div class="calendar-day other-month"><div class="day-number">${i}</div></div>`;
    }
    
    container.innerHTML = daysHTML;
}

// === WEEK VIEW ===
function renderWeekView() {
    const container = document.getElementById('calendar-week-grid');
    const weekStart = getWeekStart(currentDate);
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let weekHTML = '<div class="week-grid">';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayPosts = calendarData.filter(post => post.date === dateStr);
        
        const isToday = isSameDay(date, new Date());
        
        weekHTML += `
            <div class="week-day ${isToday ? 'today' : ''}">
                <div class="week-day-header">
                    <div class="week-day-name">${dayNames[i]}</div>
                    <div class="week-day-number">${date.getDate()}</div>
                </div>
                <div class="week-day-posts">
                    ${dayPosts.map(post => renderPostCard(post)).join('')}
                </div>
            </div>
        `;
    }
    
    weekHTML += '</div>';
    container.innerHTML = weekHTML;
}

// === DAY VIEW ===
function renderDayView() {
    const container = document.getElementById('calendar-day-grid');
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayPosts = calendarData.filter(post => post.date === dateStr);
    
    if (dayPosts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-text">No hay posts programados para este día</div>
                <button class="btn btn-primary" onclick="createPost()">+ Crear Post</button>
            </div>
        `;
        return;
    }
    
    // Sort by time
    dayPosts.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    const postsHTML = dayPosts.map(post => `
        <div class="day-post-card" onclick="showPostDetail('${post.id}')">
            <div class="day-post-time">${post.time || '—'}</div>
            <div class="day-post-content">
                ${post.image_url ? `
                    <div class="day-post-thumbnail">
                        <img src="${post.image_url}" alt="${post.title}" 
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Crect fill=%22%23222%22 width=%22120%22 height=%22120%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2240%22%3E📸%3C/text%3E%3C/svg%3E'">
                    </div>
                ` : ''}
                <div class="day-post-info">
                    <div class="day-post-type">
                        <span class="type-badge ${post.type}">${getTypeLabel(post.type)}</span>
                        <span class="platform-badge">${getPlatformLabel(post.platform)}</span>
                    </div>
                    <div class="day-post-title">${post.title}</div>
                    <div class="day-post-description">${(post.description || '').substring(0, 150)}${post.description && post.description.length > 150 ? '...' : ''}</div>
                    <div class="day-post-status">
                        <span class="post-status-badge ${post.status}">${post.status}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = postsHTML;
}

// === POST CARD (for week view) ===
function renderPostCard(post) {
    return `
        <div class="post-card ${post.type}" onclick="showPostDetail('${post.id}')">
            ${post.image_url ? `
                <div class="post-card-thumbnail">
                    <img src="${post.image_url}" alt="${post.title}"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23222%22 width=%2280%22 height=%2280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2230%22%3E📸%3C/text%3E%3C/svg%3E'">
                </div>
            ` : `
                <div class="post-card-placeholder">
                    ${getTypeIcon(post.type)}
                </div>
            `}
            <div class="post-card-info">
                <div class="post-card-time">${post.time || '—'}</div>
                <div class="post-card-title">${post.title.substring(0, 40)}${post.title.length > 40 ? '...' : ''}</div>
                <div class="post-card-status ${post.status}"></div>
            </div>
        </div>
    `;
}

// === HELPERS ===
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function getTypeIcon(type) {
    const icons = {
        feed: '📱',
        story: '📲',
        reel: '🎬',
        carousel: '🎠'
    };
    return icons[type] || '📄';
}

function getTypeLabel(type) {
    const labels = {
        feed: 'Feed',
        story: 'Story',
        reel: 'Reel',
        carousel: 'Carrusel'
    };
    return labels[type] || type;
}

function getPlatformLabel(platform) {
    const labels = {
        both: 'FB + IG',
        facebook: 'Facebook',
        instagram: 'Instagram'
    };
    return labels[platform] || platform;
}

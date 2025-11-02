const API_BASE = '/api/v1';

// メッセージ表示
function showMessage(text, type = 'info') {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type} show`;
    setTimeout(() => {
        msg.classList.remove('show');
    }, 3000);
}

// API呼び出し
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

// タブ切り替え
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // タブボタンの状態更新
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // タブコンテンツの表示切替
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // タブごとの初期化
        if (tabName === 'calendars') {
            loadCalendars();
        } else if (tabName === 'events') {
            loadCalendarOptions();
        } else if (tabName === 'create') {
            loadCalendarOptionsForCreate();
        }
    });
});

// カレンダー一覧を読み込み
async function loadCalendars() {
    const listEl = document.getElementById('calendars-list');
    listEl.innerHTML = '<div class="loading">読み込み中...</div>';
    
    try {
        const data = await apiCall('/calendars?page_size=100');
        const calendars = data.calendars || [];
        
        if (calendars.length === 0) {
            listEl.innerHTML = '<div class="card"><p>カレンダーがありません</p></div>';
            return;
        }
        
        listEl.innerHTML = calendars.map(cal => `
            <div class="card">
                <h4>${escapeHtml(cal.name)}</h4>
                <p>${escapeHtml(cal.description || '説明なし')}</p>
                <p><small>ID: ${cal.id}</small></p>
                <p><small>タイムゾーン: ${cal.timezone}</small></p>
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = `<div class="card"><p style="color: red;">エラー: ${error.message}</p></div>`;
        showMessage('カレンダーの読み込みに失敗しました', 'error');
    }
}

// イベント一覧を読み込み
async function loadEvents() {
    const calendarId = document.getElementById('calendar-select').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!calendarId) {
        showMessage('カレンダーを選択してください', 'error');
        return;
    }
    
    const listEl = document.getElementById('events-list');
    listEl.innerHTML = '<div class="loading">読み込み中...</div>';
    
    try {
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const data = await apiCall(`/events?calendar_id=${calendarId}&start=${start.toISOString()}&end=${end.toISOString()}`);
        const events = data.events || [];
        
        if (events.length === 0) {
            listEl.innerHTML = '<div class="card"><p>イベントがありません</p></div>';
            return;
        }
        
        listEl.innerHTML = events.map(event => `
            <div class="card">
                <h4>${escapeHtml(event.title)}</h4>
                <p>${escapeHtml(event.description || '説明なし')}</p>
                <p><small>開始: ${formatDateTime(event.dtstart)}</small></p>
                <p><small>終了: ${formatDateTime(event.dtend)}</small></p>
                ${event.rrule ? `<p><small>繰り返し: ${formatRRule(event.rrule)}</small></p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = `<div class="card"><p style="color: red;">エラー: ${error.message}</p></div>`;
        showMessage('イベントの読み込みに失敗しました', 'error');
    }
}

// カレンダー選択肢を読み込み
async function loadCalendarOptions() {
    const select = document.getElementById('calendar-select');
    try {
        const data = await apiCall('/calendars?page_size=100');
        const calendars = data.calendars || [];
        
        select.innerHTML = '<option value="">カレンダーを選択...</option>' +
            calendars.map(cal => `<option value="${cal.id}">${escapeHtml(cal.name)}</option>`).join('');
    } catch (error) {
        showMessage('カレンダーの読み込みに失敗しました', 'error');
    }
}

async function loadCalendarOptionsForCreate() {
    const select = document.getElementById('event-calendar-id');
    try {
        const data = await apiCall('/calendars?page_size=100');
        const calendars = data.calendars || [];
        
        select.innerHTML = '<option value="">カレンダーを選択...</option>' +
            calendars.map(cal => `<option value="${cal.id}">${escapeHtml(cal.name)}</option>`).join('');
    } catch (error) {
        showMessage('カレンダーの読み込みに失敗しました', 'error');
    }
}

// カレンダー作成
document.getElementById('create-calendar-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('calendar-name').value;
    const description = document.getElementById('calendar-description').value;
    const timezone = document.getElementById('calendar-timezone').value || 'UTC';
    
    try {
        await apiCall('/calendars', 'POST', { name, description, timezone });
        showMessage('カレンダーを作成しました', 'success');
        e.target.reset();
        loadCalendars();
        loadCalendarOptions();
        loadCalendarOptionsForCreate();
    } catch (error) {
        showMessage('カレンダーの作成に失敗しました: ' + error.message, 'error');
    }
});

// イベント作成
document.getElementById('create-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const calendarId = document.getElementById('event-calendar-id').value;
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const dtstart = document.getElementById('event-dtstart').value;
    const dtend = document.getElementById('event-dtend').value;
    const freq = document.getElementById('rrule-freq').value;
    
    // 繰り返しルールの構築
    let rrule = null;
    if (freq) {
        rrule = {
            freq: freq,
            interval: parseInt(document.getElementById('rrule-interval').value) || 1,
        };
        
        // BYDAYの取得
        const byday = Array.from(document.querySelectorAll('#rrule-byday-container input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        if (byday.length > 0) {
            rrule.byday = byday;
        }
    }
    
    // 日時をRFC3339形式に変換
    const dtstartISO = new Date(dtstart).toISOString();
    const dtendISO = new Date(dtend).toISOString();
    
    try {
        await apiCall('/events', 'POST', {
            calendar_id: calendarId,
            title,
            description,
            dtstart: dtstartISO,
            dtend: dtendISO,
            timezone: 'UTC',
            rrule: rrule,
        });
        showMessage('イベントを作成しました', 'success');
        e.target.reset();
        document.getElementById('rrule-freq').value = '';
    } catch (error) {
        showMessage('イベントの作成に失敗しました: ' + error.message, 'error');
    }
});

// イベント読み込みボタン
document.getElementById('load-events').addEventListener('click', loadEvents);
document.getElementById('refresh-calendars').addEventListener('click', loadCalendars);

// 繰り返しルールの表示を切り替え
document.getElementById('rrule-freq').addEventListener('change', (e) => {
    const bydayContainer = document.getElementById('rrule-byday-container');
    if (e.target.value === 'WEEKLY') {
        bydayContainer.style.display = 'flex';
    } else {
        bydayContainer.style.display = 'none';
    }
});

// ユーティリティ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP');
}

function formatRRule(rrule) {
    if (!rrule) return '';
    const parts = [];
    if (rrule.freq) parts.push(`頻度: ${rrule.freq}`);
    if (rrule.interval > 1) parts.push(`間隔: ${rrule.interval}`);
    if (rrule.byday && rrule.byday.length > 0) parts.push(`曜日: ${rrule.byday.join(', ')}`);
    return parts.join(', ') || '繰り返しあり';
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadCalendars();
    loadCalendarOptions();
    loadCalendarOptionsForCreate();
});

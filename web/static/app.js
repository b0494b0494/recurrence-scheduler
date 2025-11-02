const API_BASE = '/api/v1';

// Alpine.js component
window.schedulerApp = function schedulerApp() {
    return {
        activeTab: 'calendars',
        calendars: [],
        events: [],
        selectedCalendarId: '',
        startDate: '',
        endDate: '',
        calendarsHtml: '<div class="text-center text-gray-500 py-12">読み込み中...</div>',
        eventsHtml: '<div class="text-center text-gray-500 py-12">カレンダーを選択して読み込みボタンをクリック</div>',
        message: { text: '', type: 'info' },
        
        newCalendar: {
            name: '',
            description: '',
            timezone: 'UTC'
        },
        
        newEvent: {
            calendar_id: '',
            title: '',
            description: '',
            dtstart: '',
            dtend: '',
            rrule: {
                freq: '',
                interval: 1,
                byday: []
            },
            timezone: 'UTC'
        },

        init() {
            this.loadCalendars();
            this.setDefaultDates();
        },

        setDefaultDates() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const firstDay = `${year}-${month}-01`;
            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
            this.startDate = firstDay;
            this.endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        },

        showMessage(text, type = 'success') {
            this.message = { text, type };
            setTimeout(() => {
                this.message = { text: '', type: 'info' };
            }, 3000);
        },

        async apiCall(endpoint, method = 'GET', body = null) {
            try {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                };
                
                if (body) {
                    options.body = JSON.stringify(body);
                }
                
                const response = await fetch(`${API_BASE}${endpoint}`, options);
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
                    throw new Error(error.message || `HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('API error:', error);
                throw error;
            }
        },

        async loadCalendars() {
            this.calendarsHtml = '<div class="text-center text-gray-500 py-12">読み込み中...</div>';
            
            try {
                const data = await this.apiCall('/calendars?page_size=100');
                this.calendars = data.calendars || [];
                
                if (this.calendars.length === 0) {
                    this.calendarsHtml = `
                        <div class="col-span-full text-center py-12">
                            <div class="inline-block p-6 bg-gray-50 rounded-xl">
                                <p class="text-gray-600">カレンダーがありません</p>
                                <p class="text-sm text-gray-500 mt-2">「作成」タブからカレンダーを作成してください</p>
                            </div>
                        </div>
                    `;
                    return;
                }
                
                this.calendarsHtml = this.calendars.map(cal => `
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <h4 class="text-xl font-bold text-purple-700 mb-2">${this.escapeHtml(cal.name)}</h4>
                        <p class="text-gray-600 mb-3">${this.escapeHtml(cal.description || '説明なし')}</p>
                        <div class="text-sm text-gray-500 space-y-1">
                            <p><span class="font-semibold">ID:</span> <code class="bg-gray-100 px-2 py-1 rounded">${cal.id}</code></p>
                            <p><span class="font-semibold">タイムゾーン:</span> ${cal.timezone}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                this.calendarsHtml = `
                    <div class="col-span-full text-center py-12">
                        <div class="inline-block p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                            <p class="text-red-600 font-semibold">エラー: ${this.escapeHtml(error.message)}</p>
                        </div>
                    </div>
                `;
                this.showMessage('カレンダーの読み込みに失敗しました', 'error');
            }
        },

        async loadEvents() {
            if (!this.selectedCalendarId) {
                this.showMessage('カレンダーを選択してください', 'error');
                return;
            }
            
            this.eventsHtml = '<div class="text-center text-gray-500 py-12">読み込み中...</div>';
            
            try {
                const start = new Date(this.startDate).toISOString();
                const end = new Date(this.endDate + 'T23:59:59').toISOString();
                
                const data = await this.apiCall(`/events?calendar_id=${this.selectedCalendarId}&start=${start}&end=${end}`);
                this.events = data.events || [];
                
                if (this.events.length === 0) {
                    this.eventsHtml = `
                        <div class="col-span-full text-center py-12">
                            <div class="inline-block p-6 bg-gray-50 rounded-xl">
                                <p class="text-gray-600">イベントがありません</p>
                            </div>
                        </div>
                    `;
                    return;
                }
                
                this.eventsHtml = this.events.map(event => `
                    <div class="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                        <h4 class="text-xl font-bold text-blue-700 mb-2">${this.escapeHtml(event.title)}</h4>
                        <p class="text-gray-600 mb-4">${this.escapeHtml(event.description || '説明なし')}</p>
                        <div class="text-sm text-gray-700 space-y-2">
                            <p><span class="font-semibold">📅 開始:</span> ${this.formatDateTime(event.dtstart)}</p>
                            <p><span class="font-semibold">⏰ 終了:</span> ${this.formatDateTime(event.dtend)}</p>
                            ${event.rrule ? `<p><span class="font-semibold">🔄 繰り返し:</span> ${this.formatRRule(event.rrule)}</p>` : ''}
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                this.eventsHtml = `
                    <div class="col-span-full text-center py-12">
                        <div class="inline-block p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                            <p class="text-red-600 font-semibold">エラー: ${this.escapeHtml(error.message)}</p>
                        </div>
                    </div>
                `;
                this.showMessage('イベントの読み込みに失敗しました', 'error');
            }
        },

        async createCalendar() {
            try {
                await this.apiCall('/calendars', 'POST', {
                    name: this.newCalendar.name,
                    description: this.newCalendar.description,
                    timezone: this.newCalendar.timezone || 'UTC'
                });
                
                this.showMessage('カレンダーを作成しました', 'success');
                this.newCalendar = { name: '', description: '', timezone: 'UTC' };
                await this.loadCalendars();
            } catch (error) {
                this.showMessage('カレンダーの作成に失敗しました: ' + error.message, 'error');
            }
        },

        async createEvent() {
            try {
                const dtstartISO = new Date(this.newEvent.dtstart).toISOString();
                const dtendISO = new Date(this.newEvent.dtend).toISOString();
                
                let rrule = null;
                if (this.newEvent.rrule.freq) {
                    rrule = {
                        freq: this.newEvent.rrule.freq,
                        interval: this.newEvent.rrule.interval || 1,
                    };
                    
                    if (this.newEvent.rrule.byday && this.newEvent.rrule.byday.length > 0) {
                        rrule.byday = this.newEvent.rrule.byday;
                    }
                }
                
                await this.apiCall('/events', 'POST', {
                    calendar_id: this.newEvent.calendar_id,
                    title: this.newEvent.title,
                    description: this.newEvent.description,
                    dtstart: dtstartISO,
                    dtend: dtendISO,
                    timezone: this.newEvent.timezone || 'UTC',
                    rrule: rrule,
                });
                
                this.showMessage('イベントを作成しました', 'success');
                this.newEvent = {
                    calendar_id: '',
                    title: '',
                    description: '',
                    dtstart: '',
                    dtend: '',
                    rrule: { freq: '', interval: 1, byday: [] },
                    timezone: 'UTC'
                };
            } catch (error) {
                this.showMessage('イベントの作成に失敗しました: ' + error.message, 'error');
            }
        },

        toggleByday() {
            if (this.newEvent.rrule.freq !== 'WEEKLY') {
                this.newEvent.rrule.byday = [];
            }
        },

        getDayLabel(day) {
            const labels = {
                'MO': '月', 'TU': '火', 'WE': '水', 'TH': '木',
                'FR': '金', 'SA': '土', 'SU': '日'
            };
            return labels[day] || day;
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        formatDateTime(isoString) {
            const date = new Date(isoString);
            return date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatRRule(rrule) {
            if (!rrule) return '';
            const parts = [];
            if (rrule.freq) parts.push(`頻度: ${rrule.freq}`);
            if (rrule.interval > 1) parts.push(`間隔: ${rrule.interval}`);
            if (rrule.byday && rrule.byday.length > 0) {
                const dayLabels = rrule.byday.map(d => this.getDayLabel(d));
                parts.push(`曜日: ${dayLabels.join(', ')}`);
            }
            return parts.join(', ') || '繰り返しあり';
        }
    };
};

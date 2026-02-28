const API_BASE = '/api';

// ==========================================
// PROGRAMMATIC VIEW SWITCHING
// ==========================================
window.switchToView = function (targetId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');

    const nav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (nav) nav.classList.add('active');

    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
};

// ==========================================
// BACKGROUND ANIMATION (Cyber Nodes)
// ==========================================
function initBackgroundAnimation() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.5)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dist = Math.sqrt(Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2));
                if (dist < 120) {
                    ctx.strokeStyle = `rgba(14, 165, 233, ${0.2 - dist / 600})`;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-circle-xmark';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i><p>${message}</p>`;
    container.appendChild(toast);

    // Remove after 3.5s
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// Set button loading state
function setBtnLoading(btn, isLoading, originalText) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==========================================
// NAVIGATION LOGIC
// ==========================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items and views
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            // Add active class to clicked item and corresponding view
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ==========================================
// DASHBOARD LOGIC
// ==========================================
let riskGaugeChartInstance = null;
function initDashboard() {
    // Fetch stats
    fetch(`${API_BASE}/dashboard-stats`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('dash-total-scans').innerText = data.total_scans.toLocaleString();
            document.getElementById('dash-threats').innerText = data.threats_detected.toLocaleString();

            // Populate Activity Log
            const logList = document.getElementById('activity-log-list');
            logList.innerHTML = '';
            data.recent_activity.forEach(act => {
                let badgeClass = 'badge-safe';
                if (act.status.toLowerCase().includes('phishing') || act.status.toLowerCase().includes('found')) badgeClass = 'badge-danger';
                else if (act.status.toLowerCase().includes('weak')) badgeClass = 'badge-warning';

                const li = document.createElement('li');
                li.className = 'activity-item';
                li.innerHTML = `
                    <div class="activity-main">
                        <div class="activity-icon"><i class="fa-solid fa-radar icon-blue"></i></div>
                        <div class="activity-details">
                            <h4>${act.action}</h4>
                            <p>${act.time}</p>
                        </div>
                    </div>
                    <span class="activity-badge ${badgeClass}">${act.status}</span>
                `;
                logList.appendChild(li);
            });

            renderGauge(data.risk_score);
        })
        .catch(err => {
            console.error(err);
            renderGauge(35); // fallback
        });
}

function renderGauge(score) {
    const ctx = document.getElementById('riskGaugeChart').getContext('2d');
    if (riskGaugeChartInstance) riskGaugeChartInstance.destroy();

    riskGaugeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Risk', 'Safe'],
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [
                    '#ef4444', // Red
                    'rgba(255, 255, 255, 0.05)'
                ],
                borderWidth: 0,
                cutout: '80%',
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        },
        plugins: [{
            id: 'textCenter',
            beforeDraw: function (chart) {
                var width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();
                var fontSize = (height / 80).toFixed(2);
                ctx.font = "bold " + fontSize + "em JetBrains Mono, monospace";
                ctx.fillStyle = "#ef4444";
                ctx.textBaseline = "middle";
                var text = score.toString(),
                    textX = Math.round((width - ctx.measureText(text).width) / 2),
                    textY = height - 30; // Push to bottom of half doughnut
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

// ==========================================
// URL ANALYZER LOGIC
// ==========================================
function initUrlAnalyzer() {
    const btn = document.getElementById('btn-analyze-url');
    btn.addEventListener('click', async () => {
        const urlInput = document.getElementById('url-input').value.trim();
        if (!urlInput) {
            showToast('Please enter a URL to scan.', 'warning');
            return;
        }

        setBtnLoading(btn, true, 'Scan Now');
        try {
            const res = await fetch(`${API_BASE}/analyze-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            });
            const data = await res.json();

            // Populate Results
            document.getElementById('url-results').classList.remove('hidden');

            const circle = document.getElementById('url-score-circle');
            circle.className = `score-circle ${data.badge_class}`;
            document.getElementById('url-score-value').innerText = data.risk_score;

            const verdictBox = document.getElementById('url-verdict-box');
            document.getElementById('url-verdict').innerText = data.verdict;
            document.getElementById('url-verdict').className = `text-${data.badge_class === 'safe' ? 'green' : (data.badge_class === 'warning' ? 'yellow' : 'red')}`;

            const list = document.getElementById('url-reasons-list');
            list.innerHTML = '';
            data.reasons.forEach(r => {
                let icon = 'fa-check';
                if (r.type === 'warning') icon = 'fa-exclamation';
                if (r.type === 'danger') icon = 'fa-xmark';

                list.innerHTML += `
                    <li class="reason-item ${r.type}">
                        <i class="fa-solid ${icon}"></i>
                        <div class="reason-content">
                            <strong>${r.label}</strong>
                            <p>${r.desc}</p>
                        </div>
                    </li>
                `;
            });
            showToast('URL Analysis complete.');
        } catch (e) {
            showToast('API Error: Could not analyze URL.', 'error');
        } finally {
            setBtnLoading(btn, false, 'Scan Now');
        }
    });
}

// ==========================================
// PASSWORD ANALYZER LOGIC
// ==========================================
function initPasswordAnalyzer() {
    const input = document.getElementById('password-input');
    const toggleBtn = document.getElementById('toggle-pwd-btn');
    const btn = document.getElementById('btn-analyze-pwd');

    toggleBtn.addEventListener('click', () => {
        if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
    });

    // Real-time analysis on typing
    input.addEventListener('input', async () => {
        const pwd = input.value;
        if (!pwd) {
            document.getElementById('pwd-results').classList.add('hidden');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/analyze-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();

            document.getElementById('pwd-results').classList.remove('hidden');

            const meterFill = document.getElementById('pwd-meter-fill');
            const strText = document.getElementById('pwd-strength-text');

            meterFill.style.width = `${data.score}%`;
            if (data.score < 30) {
                meterFill.style.backgroundColor = 'var(--accent-red)';
                strText.innerText = 'Weak';
                strText.className = 'text-red';
            } else if (data.score < 70) {
                meterFill.style.backgroundColor = 'var(--accent-yellow)';
                strText.innerText = 'Moderate';
                strText.className = 'text-yellow';
            } else {
                meterFill.style.backgroundColor = 'var(--accent-green)';
                strText.innerText = 'Strong';
                strText.className = 'text-green';
            }

            document.getElementById('pwd-crack-time').innerText = data.crack_time;
            document.getElementById('pwd-entropy').innerText = data.entropy;

            const warningEl = document.getElementById('pwd-warning');
            const warningText = document.getElementById('pwd-warning-text');
            if (data.feedback.warning) {
                warningEl.classList.remove('hidden');
                warningText.innerText = data.feedback.warning;
            } else {
                warningEl.classList.add('hidden');
            }

            const suggList = document.getElementById('pwd-suggestions');
            suggList.innerHTML = '';
            if (data.feedback.suggestions && data.feedback.suggestions.length > 0) {
                data.feedback.suggestions.forEach(s => {
                    suggList.innerHTML += `<li>${s}</li>`;
                });
            } else if (data.score >= 70) {
                suggList.innerHTML = '<li>Great job! This password is highly secure.</li>';
            }
        } catch (e) { /* ignore rapid typings err */ }
    });

    btn.addEventListener('click', () => {
        if (!input.value) showToast('Please enter a password.', 'warning');
        else showToast('Analysis complete.');
    });
}


// ==========================================
// PHISHING DETECTOR LOGIC
// ==========================================
function initPhishingDetector() {
    const btn = document.getElementById('btn-analyze-email');
    btn.addEventListener('click', async () => {
        const textInput = document.getElementById('email-input').value.trim();
        if (!textInput) {
            showToast('Please paste email or SMS text to scan.', 'warning');
            return;
        }

        setBtnLoading(btn, true, 'Scan Text');
        try {
            const res = await fetch(`${API_BASE}/analyze-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput })
            });
            const data = await res.json();

            document.getElementById('email-results').classList.remove('hidden');

            const circle = document.getElementById('email-score-circle');
            circle.className = `score-circle ${data.badge_class}`;
            document.getElementById('email-score-value').innerText = data.probability;

            document.getElementById('email-verdict').innerText = data.verdict;
            document.getElementById('email-verdict').className = `text-${data.badge_class === 'safe' ? 'green' : (data.badge_class === 'warning' ? 'yellow' : 'red')}`;

            const list = document.getElementById('email-reasons-list');
            list.innerHTML = '';
            data.reasons.forEach(r => {
                let icon = 'fa-circle-info';
                let ctype = 'safe';
                if (data.badge_class !== 'safe') ctype = 'warning';

                list.innerHTML += `
                    <li class="reason-item ${ctype}">
                        <i class="fa-solid ${icon}"></i>
                        <div class="reason-content">
                            <strong>${r.label}</strong>
                            <p>${r.desc}</p>
                        </div>
                    </li>
                `;
            });
            showToast('Text Scan complete.');
        } catch (e) {
            showToast('API Error: Could not analyze text.', 'error');
        } finally {
            setBtnLoading(btn, false, 'Scan Text');
        }
    });
}

// ==========================================
// BREACH CHECKER LOGIC
// ==========================================
function initBreachChecker() {
    const btn = document.getElementById('btn-check-breach');
    btn.addEventListener('click', async () => {
        const input = document.getElementById('breach-input').value.trim();
        if (!input) {
            showToast('Please enter an email address.', 'warning');
            return;
        }

        setBtnLoading(btn, true, 'Search Database');
        document.getElementById('breach-results').classList.add('hidden');

        try {
            const res = await fetch(`${API_BASE}/check-breach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: input })
            });
            const data = await res.json();

            document.getElementById('breach-results').classList.remove('hidden');

            const banner = document.getElementById('breach-status-banner');
            const icon = document.getElementById('breach-status-icon');
            const msg = document.getElementById('breach-status-msg');
            const wrapper = document.getElementById('breach-list-wrapper');
            const list = document.getElementById('breach-cards-list');

            list.innerHTML = '';

            if (data.status === 'safe') {
                banner.className = 'status-banner safe';
                icon.className = 'fa-solid fa-shield-check';
                msg.innerText = data.message;
                wrapper.classList.add('hidden');
            } else {
                banner.className = 'status-banner danger';
                icon.className = 'fa-solid fa-triangle-exclamation fa-fade';
                msg.innerText = data.message;
                wrapper.classList.remove('hidden');

                data.breaches.forEach(b => {
                    const dtTags = b.data_compromised.map(d => `<span class="data-tag">${d}</span>`).join('');
                    list.innerHTML += `
                        <div class="breach-card">
                            <div class="breach-header">
                                <h4>${b.breach_name}</h4>
                                <span class="breach-date">${b.date}</span>
                            </div>
                            <p>${b.description}</p>
                            <div class="breach-data">
                                <strong>Compromised Data:</strong> ${dtTags}
                            </div>
                        </div>
                    `;
                });
            }
        } catch (e) {
            showToast('API Error: Could not check breach database.', 'error');
        } finally {
            setBtnLoading(btn, false, 'Search Database');
        }
    });
}

// ==========================================
// SENTINEL AI LOGIC
// ==========================================
function initChatbot() {
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-send-chat');
    const msgsContainer = document.getElementById('chat-messages');

    function appendMessage(text, isAi) {
        const div = document.createElement('div');
        div.className = `message ${isAi ? 'ai-msg' : 'user-msg'}`;
        // Basic markdown bold translation for the mock AI
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        div.innerHTML = `<div class="msg-bubble">${formattedText}</div>`;
        msgsContainer.appendChild(div);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'message ai-msg typing-indicator-wrapper';
        div.id = 'ai-typing';
        div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        msgsContainer.appendChild(div);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
    }

    function removeTyping() {
        const typingEl = document.getElementById('ai-typing');
        if (typingEl) typingEl.remove();
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        appendMessage(text, false);
        showTyping();

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();

            removeTyping();
            appendMessage(data.response, true);
        } catch (e) {
            removeTyping();
            appendMessage("SYSTEM OUTAGE: Unable to connect to Sentinel AI subroutines.", true);
        }
    }

    btn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// ==========================================
// HEADER ACTIONS LOGIC
// ==========================================
function initHeaderActions() {
    const bellBtn = document.getElementById('bell-btn');
    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            showToast('System alerts are currently empty.', 'info');
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    showToast(`Searching knowledge base for: ${query}`, 'success');
                    searchInput.value = '';
                }
            }
        });
    }

    // Profile Dropdown Logic
    const profileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }
}

// ==========================================
// INIT APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initBackgroundAnimation();
    initNavigation();
    initHeaderActions();
    initDashboard();
    initUrlAnalyzer();
    initPasswordAnalyzer();
    initPhishingDetector();
    initBreachChecker();
    initChatbot();
    showToast('CyberIntel UI Initialized.', 'success');
});

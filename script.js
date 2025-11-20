const API_BASE_URL = 'https://telegram-bot-host-f32i.onrender.com';
const USER_ID = 8143370150;

function checkTermsAcceptance() {
    const termsAccepted = localStorage.getItem('termsAccepted');
    const modal = document.getElementById('terms-modal');
    
    if (!termsAccepted && modal) {
        modal.classList.add('show');
    }
}

function acceptTerms() {
    localStorage.setItem('termsAccepted', 'true');
    const modal = document.getElementById('terms-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function declineTerms() {
    showNotification('You need to agree to the Terms & Conditions to use this service.', 'error');
}

function showNotification(message, type = 'success') {
    const popup = document.getElementById('notification-popup');
    const icon = document.getElementById('notification-icon');
    const messageEl = document.getElementById('notification-message');
    
    if (!popup) return;
    
    popup.className = 'notification-popup';
    popup.classList.add(type);
    
    if (type === 'success') {
        icon.innerHTML = '✓';
    } else if (type === 'error') {
        icon.innerHTML = '✕';
    }
    
    messageEl.textContent = message;
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 4000);
}

async function createBot() {
    const tokenInput = document.getElementById('token');
    const token = tokenInput.value.trim();

    if (!token) {
        showNotification('Please enter a bot token!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                userId: USER_ID
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || 'Bot Started Successfully! 🎉', 'success');
            
            let myBots = JSON.parse(localStorage.getItem('myBots') || '[]');
            if (!myBots.includes(token)) {
                myBots.push(token);
                localStorage.setItem('myBots', JSON.stringify(myBots));
            }

            tokenInput.value = '';
        } else {
            showNotification(data.message || 'Failed to create bot. Please check your token.', 'error');
        }
    } catch (error) {
        console.error('Error creating bot:', error);
        showNotification('Error connecting to server. Please try again later.', 'error');
    }
}

async function getBotUsername(token) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await response.json();
        
        if (data.ok && data.result && data.result.username) {
            return data.result.username;
        }
        return null;
    } catch (error) {
        console.error('Error fetching bot username:', error);
        return null;
    }
}

async function loadAllBots() {
    const listElement = document.getElementById('all-bots-list');
    const totalBotsElement = document.getElementById('total-bots');
    const activeBotsElement = document.getElementById('active-bots');

    try {
        listElement.innerHTML = '<div class="loading">Loading bots...</div>';

        const response = await fetch(`${API_BASE_URL}/global-bots`);
        const data = await response.json();

        if (response.ok && data.bots && Array.isArray(data.bots)) {
            const bots = data.bots;

            totalBotsElement.textContent = bots.length;
            activeBotsElement.textContent = bots.length;

            if (bots.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                        </svg>
                        <h3>No Bots Yet</h3>
                        <p>Be the first to create a bot!</p>
                    </div>
                `;
                return;
            }

            listElement.innerHTML = '';

            for (const bot of bots) {
                const token = bot.token || bot;
                const maskedToken = typeof token === 'string' ? token.substring(0, 10) + '...' : 'Unknown';
                
                const botCard = document.createElement('div');
                botCard.className = 'bot-card';
                
                const botUsername = bot.username || null;
                const displayName = botUsername || 'Bot ' + token.substring(0, 8);
                
                botCard.innerHTML = `
                    <div class="bot-header">
                        <div>
                            <div class="bot-username">@${displayName}</div>
                            <div class="bot-token">${maskedToken}</div>
                        </div>
                        ${botUsername ? `<a href="https://t.me/${botUsername}" target="_blank" class="open-btn">Open Bot</a>` : '<span class="bot-status">Active</span>'}
                    </div>
                `;
                listElement.appendChild(botCard);
            }
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading all bots:', error);
        listElement.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Bots</h3>
                <p>Could not connect to the server. Please try again later.</p>
            </div>
        `;
        totalBotsElement.textContent = '0';
        activeBotsElement.textContent = '0';
    }
}

async function loadMyBots() {
    const listElement = document.getElementById('my-bots-list');

    try {
        listElement.innerHTML = '<div class="loading">Loading your bots...</div>';

        const myBots = JSON.parse(localStorage.getItem('myBots') || '[]');

        if (myBots.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <h3>No Bots Created</h3>
                    <p>Create your first bot to see it here!</p>
                </div>
            `;
            return;
        }

        listElement.innerHTML = '';

        for (const token of myBots) {
            const maskedToken = token.substring(0, 10) + '...';
            const username = await getBotUsername(token);

            const botCard = document.createElement('div');
            botCard.className = 'bot-card';
            botCard.innerHTML = `
                <div class="bot-header">
                    <div>
                        <div class="bot-username">@${username || 'Loading...'}</div>
                        <div class="bot-token">${maskedToken}</div>
                    </div>
                    ${username ? `<a href="https://t.me/${username}" target="_blank" class="open-btn">Open Bot</a>` : ''}
                </div>
            `;
            listElement.appendChild(botCard);
        }
    } catch (error) {
        console.error('Error loading my bots:', error);
        listElement.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Your Bots</h3>
                <p>Please try again.</p>
            </div>
        `;
    }
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab') || 'all';

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            button.classList.add('active');
            const targetTab = document.getElementById(`${tabName}-bots-tab`) || document.getElementById(`${tabName}-tab`);
            if (targetTab) {
                targetTab.style.display = 'block';
            }

            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);

            highlightNavigation();

            if (tabName === 'all') {
                loadAllBots();
            } else if (tabName === 'my') {
                loadMyBots();
            }
        });
    });

    const activeButton = document.querySelector(`.tab-btn[data-tab="${activeTab}"]`);
    if (activeButton) {
        activeButton.click();
    }
}

function highlightNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    if (currentPage === 'index.html' || currentPage === '') {
        document.querySelector('a[href="index.html"]').classList.add('active');
    } else if (currentPage === 'bots.html') {
        if (tab === 'my') {
            const myBotsNav = document.getElementById('nav-my-bots');
            if (myBotsNav) myBotsNav.classList.add('active');
        } else if (tab === 'updates') {
            const updatesNav = document.getElementById('nav-updates');
            if (updatesNav) updatesNav.classList.add('active');
        } else {
            const allBotsNav = document.getElementById('nav-all-bots');
            if (allBotsNav) allBotsNav.classList.add('active');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkTermsAcceptance();
    highlightNavigation();

    if (window.location.pathname.includes('bots.html')) {
        initTabs();

        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        
        if (tab === 'updates') {
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
            document.getElementById('updates-tab').style.display = 'block';
        }
    }
});

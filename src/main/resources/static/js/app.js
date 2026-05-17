// 全局状态
let currentUser = null;
let allItems = [];
let myItems = [];
let confirmCallback = null;
let favoriteItemIds = new Set();
let currentPage = 'home'; // 当前页面标识：'home', 'my-items', 'favorites'

// 立即定义全局函数，确保 onclick 可以调用
window.toggleUserMenu = function toggleUserMenu() {
    console.log('toggleUserMenu called, currentUser:', currentUser);

    if (!currentUser) {
        showLoginModal();
    } else {
        openUserCenterPanel();
    }
};

window.showLoginModal = function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
};

window.closeLoginModal = function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
};

window.showRegisterModal = function showRegisterModal() {
    document.getElementById('registerModal').classList.add('show');
};

window.closeRegisterModal = function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('show');
};

window.showPublishModal = function showPublishModal() {
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        showLoginModal();
        return;
    }
    document.getElementById('publishModal').classList.add('show');
};

window.closePublishModal = function closePublishModal() {
    document.getElementById('publishModal').classList.remove('show');
    document.getElementById('publishForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化...');
    loadItems();
    setupFilters();
    setupForms();
    checkLoginStatus();
    setupMobileOptimizations();
    showAvatarTooltip();
    initAIInfoToggle();
    updateBreadcrumb();
    updateSearchPlaceholder();
});


// AI 信息面板切换
function initAIInfoToggle() {
    const hasSeenAIInfo = localStorage.getItem('hasSeenAIInfo');
    if (!hasSeenAIInfo) {
        const aiInfoContent = document.getElementById('aiInfoContent');
        if (aiInfoContent) {
            aiInfoContent.style.display = 'block';
            const toggle = document.getElementById('aiInfoToggle');
            if (toggle) {
                toggle.textContent = '▲';
            }
        }
    }
}

window.toggleAIInfo = function toggleAIInfo() {
    const content = document.getElementById('aiInfoContent');
    const toggle = document.getElementById('aiInfoToggle');

    if (content && toggle) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲';
            localStorage.setItem('hasSeenAIInfo', 'true');
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
}

// 显示头像提示（仅首次访问）
function showAvatarTooltip() {
    const hasSeenTip = localStorage.getItem('hasSeenAvatarTip');
    if (!hasSeenTip && currentUser) {
        const avatarWrapper = document.querySelector('.avatar-wrapper');
        if (avatarWrapper) {
            // 先添加脉冲动画
            avatarWrapper.classList.add('pulse-animation');

            setTimeout(() => {
                avatarWrapper.classList.add('show-tooltip');
                setTimeout(() => {
                    avatarWrapper.classList.remove('show-tooltip');
                    avatarWrapper.classList.remove('pulse-animation');
                    localStorage.setItem('hasSeenAvatarTip', 'true');
                }, 3000);
            }, 1000);
        }
    }
}

// 移动端优化
function setupMobileOptimizations() {
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        document.body.classList.add('mobile-device');

        // 优化触摸反馈
        document.addEventListener('touchstart', function () {
        }, {passive: true});

        // 双击缩放禁用
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // 为详情按钮添加触摸事件优化
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-detail')) {
                e.preventDefault();
                e.stopPropagation();
                const itemId = e.target.getAttribute('onclick').match(/\d+/)[0];
                if (itemId) {
                    window.showItemDetail(parseInt(itemId));
                }
            }
        }, true);
    }

    // 窗口大小变化时重新渲染
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            console.log('窗口大小已调整');
        }, 250);
    });

    // 下拉菜单在移动端的优化
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && isMobile) {
        dropdown.style.position = 'fixed';
        dropdown.style.top = '60px';
        dropdown.style.right = '10px';
    }
}

// Toast 提示函数
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// 确认对话框函数
function showConfirm(title, message, callback, isDanger = false) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');

    titleEl.textContent = title;
    messageEl.textContent = message;

    if (isDanger) {
        confirmBtn.classList.add('danger');
    } else {
        confirmBtn.classList.remove('danger');
    }

    confirmCallback = callback;
    confirmBtn.onclick = () => {
        if (confirmCallback) {
            const cb = confirmCallback;
            confirmCallback = null;
            modal.classList.remove('show');
            cb();
        } else {
            modal.classList.remove('show');
        }
    };

    modal.classList.add('show');
}

// 关闭确认对话框
function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('show');
    confirmCallback = null;
}

// 检查登录状态
function checkLoginStatus() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        updateUserUI();
        loadMyItems(); // 预加载数据，但不渲染
        loadUnreadCount();
        loadFavoriteIds();
    }
}

// 更新用户界面
function updateUserUI() {
    const userText = document.getElementById('userText');
    const loginMenuItems = document.getElementById('loginMenuItems');
    const logoutMenuItems = document.getElementById('logoutMenuItems');
    const userCenterBtn = document.querySelector('.btn-user-center');

    if (currentUser) {
        // 已登录状态
        if (userText) {
            userText.textContent = currentUser.username;
        }
        if (userCenterBtn) {
            userCenterBtn.classList.add('open');
        }

        // 显示登出选项，隐藏登录注册
        if (loginMenuItems) loginMenuItems.style.display = 'none';
        if (logoutMenuItems) logoutMenuItems.style.display = 'block';
    } else {
        // 未登录状态
        if (userText) {
            userText.textContent = '登录';
        }
        if (userCenterBtn) {
            userCenterBtn.classList.remove('open');
        }

        // 显示登录注册选项，隐藏登出
        if (loginMenuItems) loginMenuItems.style.display = 'block';
        if (logoutMenuItems) logoutMenuItems.style.display = 'none';
    }
}

// 切换用户菜单 - 暴露到window全局
window.toggleUserMenu = function toggleUserMenu() {
    console.log('toggleUserMenu called, currentUser:', currentUser);

    if (!currentUser) {
        // 未登录时，点击直接显示登录模态框
        console.log('Showing login modal');
        showLoginModal();
    } else {
        // 已登录时，打开个人中心面板
        console.log('Opening user center panel');
        openUserCenterPanel();
    }
}


// 打开个人中心面板 - 暴露到window全局
window.openUserCenterPanel = function openUserCenterPanel() {
    const panel = document.getElementById('userCenterPanel');
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay show';
    overlay.id = 'panelOverlay';
    overlay.onclick = closeUserCenterPanel;

    if (panel) {
        panel.classList.add('show');
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden'; // 禁止背景滚动
        console.log('User center panel opened');
    } else {
        console.error('userCenterPanel element not found');
    }
}

// 关闭个人中心面板 - 暴露到window全局
window.closeUserCenterPanel = function closeUserCenterPanel() {
    const panel = document.getElementById('userCenterPanel');
    const overlay = document.getElementById('panelOverlay');

    if (panel) {
        panel.classList.remove('show');
    }
    if (overlay) {
        overlay.remove();
    }
    document.body.style.overflow = ''; // 恢复滚动
    console.log('User center panel closed');
}

// 显示消息中心
window.showMessageCenter = async function showMessageCenter() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        showLoginModal();
        return;
    }

    console.log('=== 打开消息中心 ===');

    const panel = document.getElementById('messageCenterPanel');
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay show';
    overlay.id = 'messageCenterOverlay';
    overlay.onclick = closeMessageCenterPanel;

    if (panel) {
        panel.classList.add('show');
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // 加载对话列表
        await loadConversationList();
    } else {
        console.error('找不到消息中心面板元素');
    }
};


// 关闭消息中心
window.closeMessageCenterPanel = function closeMessageCenterPanel() {
    const panel = document.getElementById('messageCenterPanel');
    const overlay = document.getElementById('messageCenterOverlay');

    if (panel) {
        panel.classList.remove('show');
    }
    if (overlay) {
        overlay.remove();
    }
    document.body.style.overflow = '';
};

// 加载对话列表
async function loadConversationList() {
    console.log('--- 开始加载对话列表 ---');

    const listContainer = document.getElementById('conversationList');
    if (!listContainer) {
        console.error('❌ 找不到对话列表容器');
        return;
    }

    listContainer.innerHTML = '<div class="loading">加载中...</div>';

    try {
        const apiUrl = `/api/message/conversations/${currentUser.id}`;
        console.log('请求API:', apiUrl);

        const response = await fetch(apiUrl);
        const result = await response.json();

        console.log('API响应:', result);

        if (result.code === 200 && result.data) {
            console.log('对话数量:', result.data.length);
            if (result.data.length > 0) {
                console.log('第一个对话:', result.data[0]);
            }
            renderConversationList(result.data);
        } else {
            console.log('没有对话数据或请求失败');
            listContainer.innerHTML = `                <div class="empty-conversations">
                    <div class="empty-conversations-icon">💬</div>
                    <p>暂无对话</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">点击商品卡片上的"私信"按钮开始聊天</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ 加载对话列表异常:', error);
        listContainer.innerHTML = `            <div class="empty-conversations">
                <div class="empty-conversations-icon">⚠️</div>
                <p>加载失败，请重试</p>
            </div>
        `;
    }

    console.log('--- 加载对话列表结束 ---');
}


// 渲染对话列表
function renderConversationList(conversations) {
    console.log('--- 开始渲染对话列表 ---');

    const listContainer = document.getElementById('conversationList');
    if (!listContainer) {
        console.error('❌ 找不到对话列表容器');
        return;
    }

    if (!conversations || conversations.length === 0) {
        console.log('没有对话数据');
        listContainer.innerHTML = `            <div class="empty-conversations">
                <div class="empty-conversations-icon">💬</div>
                <p>暂无对话</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">点击商品卡片上的"私信"按钮开始聊天</p>
            </div>
        `;
        return;
    }

    console.log('渲染', conversations.length, '个对话');

    listContainer.innerHTML = conversations.map((conv, index) => {
        const userName = conv.userName || '用户' + conv.userId;
        const firstLetter = userName.charAt(0).toUpperCase();
        const unreadBadge = conv.unreadCount > 0
            ? `<div class="conversation-unread">${conv.unreadCount}</div>`
            : '';

        if (index === 0) {
            console.log('第一个对话详情:', {
                userId: conv.userId,
                userName: userName,
                lastMessage: conv.lastMessage,
                unreadCount: conv.unreadCount
            });
        }

        return `            <div class="conversation-item" onclick="openChatFromConversation(${conv.userId}, '${escapeHtml(userName)}')">
                <div class="conversation-avatar">${firstLetter}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${escapeHtml(userName)}</div>
                    <div class="conversation-preview">${escapeHtml(conv.lastMessage || '暂无消息')}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${formatTime(conv.lastMessageTime)}</div>
                    ${unreadBadge}                </div>
            </div>
        `;
    }).join('');

    console.log('对话列表渲染完成');
    console.log('--- 渲染对话列表结束 ---');
}


// 从对话列表打开聊天
window.openChatFromConversation = async function openChatFromConversation(otherUserId, otherUserName) {
    closeMessageCenterPanel();

    // 获取用户信息以获取更准确的名称
    try {
        const response = await fetch(`/api/user/${otherUserId}`);
        const result = await response.json();
        if (result.code === 200 && result.data) {
            otherUserName = result.data.username;
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }

    // 打开聊天窗口
    openPrivateChat(otherUserId, otherUserName);
};

// 加载聊天未读数量
async function loadChatUnreadCount() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/message/chat-unread/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200) {
            const badge = document.getElementById('chatUnreadBadge');
            if (badge) {
                if (result.data > 0) {
                    badge.textContent = result.data > 99 ? '99+' : result.data;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('加载聊天未读数量失败:', error);
    }
}

// 在处理 WebSocket 消息时更新未读计数
const originalHandleChatMessage = window.handleChatMessage;
window.handleChatMessage = function handleChatMessage(message) {
    if (originalHandleChatMessage) {
        originalHandleChatMessage(message);
    }

    // 如果消息不是发给当前正在聊天的用户，增加未读计数
    if (currentChatUserId !== message.fromUserId) {
        loadChatUnreadCount();
    }
};

// 在页面加载完成后加载未读计数
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...

    if (currentUser) {
        initWebSocket();
        loadChatUnreadCount();
    }
});

// 在登录成功后加载未读计数
const originalHandleLogin2 = window.handleLogin;
window.handleLogin = async function handleLogin(e) {
    if (originalHandleLogin2) {
        await originalHandleLogin2(e);
    }

    if (currentUser) {
        setTimeout(() => {
            initWebSocket();
            loadChatUnreadCount();
        }, 1000);
    }
};

// 显示我的商品
window.showMyItems = function showMyItems() {
    closeUserCenterPanel();

    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }

    currentPage = 'my-items';
    updateBreadcrumb();
    updateSearchPlaceholder();
    renderItemsWithActions();
}


// 显示我的收藏
window.showMyFavorites = async function showMyFavorites() {
    closeUserCenterPanel();

    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }

    currentPage = 'favorites';
    updateBreadcrumb();
    updateSearchPlaceholder();

    const grid = document.getElementById('itemGrid');
    const emptyState = document.getElementById('emptyState');

    grid.innerHTML = '<div class="loading">加载中</div>';

    try {
        const response = await fetch(`/api/favorite/list/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200 && result.data) {
            if (result.data.length === 0) {
                grid.innerHTML = '';
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<p style="font-size: 1.2rem;">暂无收藏商品</p>';
            } else {
                emptyState.style.display = 'none';
                grid.innerHTML = result.data.map(item => createItemCard(item)).join('');
            }
        } else {
            showToast('加载收藏列表失败', 'error');
        }
    } catch (error) {
        console.error('加载收藏列表失败:', error);
        showToast('网络错误', 'error');
    }
}

// 加载商品列表
async function loadItems() {
    console.log('开始加载商品列表...');
    const grid = document.getElementById('itemGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) {
        console.error('找不到 itemGrid 元素');
        return;
    }

    grid.innerHTML = '<div class="loading">加载中...</div>';
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    try {
        let url = '/api/item/audited';
        if (currentUser) {
            url += `?currentUserId=${currentUser.id}`;
        }

        console.log('请求URL:', url);
        const response = await fetch(url);
        const result = await response.json();

        console.log('API返回结果:', result);

        if (result.code === 200 && result.data) {
            allItems = result.data;
            console.log('加载到商品数量:', allItems.length);
            renderItems(allItems);
        } else {
            console.log('没有商品数据，显示空状态');
            showEmptyState();
        }
    } catch (error) {
        console.error('加载商品失败:', error);
        showEmptyState();
        showToast('加载商品失败，请刷新页面', 'error');
    }
}

// 显示空状态
function showEmptyState() {
    const grid = document.getElementById('itemGrid');
    const emptyState = document.getElementById('emptyState');

    if (grid) {
        grid.innerHTML = '';
    }
    if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<p style="font-size: 1.2rem;">暂无商品信息</p>';
    }
}

// 加载我的商品（仅加载数据，不主动渲染）
async function loadMyItems() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/item/user/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200 && result.data) {
            myItems = result.data;
            // 只有在当前页面是"我的商品"时才渲染
            if (currentPage === 'my-items') {
                renderItemsWithActions();
            }
        }
    } catch (error) {
        console.error('加载我的商品失败:', error);
        showToast('加载我的商品失败', 'error');
    }
}


// 渲染商品列表
function renderItems(items) {
    const grid = document.getElementById('itemGrid');
    const emptyState = document.getElementById('emptyState');

    if (!items || items.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = items.map(item => createItemCard(item)).join('');
}

// 渲染带操作按钮的商品列表
function renderItemsWithActions() {
    if (!currentUser) {
        loadItems();
        return;
    }

    const grid = document.getElementById('itemGrid');
    const emptyState = document.getElementById('emptyState');

    if (!myItems || myItems.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<p style="font-size: 1.2rem;">暂无商品，点击右上角发布闲置</p>';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = myItems.map(item => createItemCardWithActions(item)).join('');
}

// 创建商品卡片
function createItemCard(item) {
    const typeToCategoryClass = {
        1: 'other',
        2: 'books',
        3: 'digital',
        4: 'lost'
    };

    const categoryClass = typeToCategoryClass[item.type] || 'other';
    const badge = item.type === 4 ? '<span class="badge">寻物启事</span>' : '';
    const priceDisplay = item.price && item.price > 0 ? `¥ ${parseFloat(item.price).toFixed(2)}` : (item.type === 4 ? '急寻' : '免费');

    const createTime = formatTime(item.createTime);
    const quantityInfo = item.quantity && item.quantity > 1 ? `<span style="color: #6b7280; font-size: 0.85rem;">×${item.quantity}</span>` : '';

    // 检查是否是下架商品且是当前用户自己的
    let ownerBadge = '';
    if (item.status === 2 && currentUser && item.userId === currentUser.id) {
        ownerBadge = '<span class="badge" style="background: #ef4444;">已下架（仅自己可见）</span>';
    }

    const imageHtml = item.imageUrl ?
        `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
         <div class="card-img placeholder-${getCategoryIcon(categoryClass)}" style="display:none;"></div>` :
        `<div class="card-img placeholder-${getCategoryIcon(categoryClass)}"></div>`;

    const isFavorited = favoriteItemIds.has(item.id);
    const favoriteBtnText = isFavorited ? '❤️ 已收藏' : '🤍 收藏';
    const favoriteBtnClass = isFavorited ? 'btn-favorite favorited' : 'btn-favorite';

    // 添加私信按钮（如果不是自己的商品）
    let privateChatButton = '';
    if (currentUser && item.userId && currentUser.id !== item.userId) {
        // 获取卖家名称，优先使用 userName，其次使用 sellerName
        const sellerName = item.userName || item.sellerName || '卖家';
        privateChatButton = `<button class="btn-private-chat" onclick="openPrivateChat(${item.userId}, '${escapeHtml(sellerName)}', ${item.id})">💬 私信</button>`;
    }

    return `        <article class="glass-card item ${categoryClass}" data-category="${categoryClass}" data-id="${item.id}">
            ${imageHtml}            <div class="card-content">
                ${badge}                ${ownerBadge}                <h3 class="title">${escapeHtml(item.title)}</h3>
                <p class="desc">${escapeHtml(item.description || '暂无描述')}</p>
                <div class="card-info">
                    <span class="${item.type === 4 ? 'status' : 'price'}">${priceDisplay} ${quantityInfo}</span>
                    <span class="time">${createTime}</span>
                </div>
                <div class="card-actions">
                    <button class="${favoriteBtnClass}" data-item-id="${item.id}" onclick="toggleFavorite(${item.id}, event)">
                        ${favoriteBtnText}                    </button>
                    <button class="btn-detail" onclick="showItemDetail(${item.id})">📋 详情</button>
                    <button class="btn-message" onclick="openMessageModal(${item.id})"> 留言</button>
                    ${privateChatButton}                </div>
            </div>
        </article>
    `;
}


// 创建带操作按钮的商品卡片
function createItemCardWithActions(item) {
    const typeToCategoryClass = {
        1: 'other',
        2: 'books',
        3: 'digital',
        4: 'lost'
    };

    const categoryClass = typeToCategoryClass[item.type] || 'other';
    const badge = item.type === 4 ? '<span class="badge">寻物启事</span>' : '';
    const priceDisplay = item.price && item.price > 0 ? `¥ ${parseFloat(item.price).toFixed(2)}` : (item.type === 4 ? '急寻' : '免费');

    const createTime = formatTime(item.createTime);
    const quantityInfo = item.quantity && item.quantity > 1 ? `<span style="color: #6b7280; font-size: 0.85rem;">×${item.quantity}</span>` : '';

    const imageHtml = item.imageUrl ?
        `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
         <div class="card-img placeholder-${getCategoryIcon(categoryClass)}" style="display:none;"></div>` :
        `<div class="card-img placeholder-${getCategoryIcon(categoryClass)}"></div>`;

    let statusBadge = '';
    if (item.status === 0) {
        statusBadge = '<span class="badge" style="background: #f59e0b;">待审核</span>';
    } else if (item.status === 2) {
        statusBadge = '<span class="badge" style="background: #ef4444;">已下架</span>';
    }

    let actionButtons = '';
    if (item.status === 1) {
        actionButtons = `            <button class="btn-offshelf" onclick="offshelfItem(${item.id})">🗑️ 下架</button>
            <button class="btn-delete" onclick="deleteMyItem(${item.id})">❌ 删除</button>
        `;
    } else if (item.status === 2) {
        actionButtons = `            <button class="btn-restore" onclick="restoreMyItem(${item.id})">↺ 重新上架</button>
            <button class="btn-delete" onclick="deleteMyItem(${item.id})">❌ 删除</button>
        `;
    } else if (item.status === 0) {
        actionButtons = `            <button class="btn-delete" onclick="deleteMyItem(${item.id})">❌ 删除</button>
        `;
    }

    return `        <article class="glass-card item ${categoryClass}" data-category="${categoryClass}" data-id="${item.id}">
            ${imageHtml}            <div class="card-content">
                ${badge}                ${statusBadge}                <h3 class="title">${escapeHtml(item.title)}</h3>
                <p class="desc">${escapeHtml(item.description || '暂无描述')}</p>
                <div class="card-info">
                    <span class="${item.type === 4 ? 'status' : 'price'}">${priceDisplay} ${quantityInfo}</span>
                    <span class="time">${createTime}</span>
                </div>
                <div class="card-actions">
                    ${actionButtons}                </div>
            </div>
        </article>
    `;
}


// 获取分类图标
function getCategoryIcon(category) {
    const icons = {
        'books': 'book',
        'digital': 'tech',
        'lost': 'lost',
        'other': 'other'
    };
    return icons[category] || 'other';
}

// 格式化时间
function formatTime(timeStr) {
    if (!timeStr) return '未知时间';

    const now = new Date();
    const time = new Date(timeStr);
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return time.toLocaleDateString('zh-CN');
    }
}

// HTML转义，防止XSS攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 设置过滤器
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            filterItems(filterValue);
        });
    });
}

// 过滤商品
function filterItems(category) {
    const categoryToType = {
        'all': null,
        'books': 2,
        'digital': 3,
        'lost': 4,
        'other': 1
    };

    let filtered = allItems;

    if (category !== 'all') {
        const targetType = categoryToType[category];
        filtered = allItems.filter(item => item.type === targetType);
    }

    renderItems(filtered);
}

// 搜索商品 - 暴露到全局
window.searchItems = function searchItems() {
    const keyword = document.getElementById('searchInput').value.trim();

    if (!keyword) {
        if (currentPage === 'my-items') {
            renderItemsWithActions();
        } else if (currentPage === 'favorites') {
            showMyFavorites();
        } else {
            loadItems();
        }
        return;
    }

    const grid = document.getElementById('itemGrid');
    grid.innerHTML = '<div class="loading">搜索中...</div>';

    if (currentPage === 'my-items') {
        const filtered = myItems.filter(item =>
            (item.title && item.title.includes(keyword)) ||
            (item.description && item.description.includes(keyword))
        );

        if (!filtered || filtered.length === 0) {
            grid.innerHTML = '';
            const emptyState = document.getElementById('emptyState');
            emptyState.style.display = 'block';
            emptyState.innerHTML = `<p style="font-size: 1.2rem;">没有找到包含"${keyword}"的商品</p>`;
        } else {
            const emptyState = document.getElementById('emptyState');
            emptyState.style.display = 'none';
            grid.innerHTML = filtered.map(item => createItemCardWithActions(item)).join('');
        }
    } else if (currentPage === 'favorites') {
        try {
            fetch(`/api/favorite/list/${currentUser.id}`)
                .then(res => res.json())
                .then(result => {
                    if (result.code === 200 && result.data) {
                        const filtered = result.data.filter(item =>
                            (item.title && item.title.includes(keyword)) ||
                            (item.description && item.description.includes(keyword))
                        );

                        if (!filtered || filtered.length === 0) {
                            grid.innerHTML = '';
                            const emptyState = document.getElementById('emptyState');
                            emptyState.style.display = 'block';
                            emptyState.innerHTML = `<p style="font-size: 1.2rem;">没有找到包含"${keyword}"的收藏商品</p>`;
                        } else {
                            const emptyState = document.getElementById('emptyState');
                            emptyState.style.display = 'none';
                            grid.innerHTML = filtered.map(item => createItemCard(item)).join('');
                        }
                    }
                });
        } catch (error) {
            console.error('搜索收藏商品失败:', error);
            showToast('搜索失败', 'error');
        }
    } else {
        const filtered = allItems.filter(item =>
            (item.title && item.title.includes(keyword)) ||
            (item.description && item.description.includes(keyword))
        );

        renderItems(filtered);
    }
};

// 设置表单
function setupForms() {
    // 登录表单
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // 注册表单
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // 添加注册表单实时验证
    setupRegisterValidation();

    // 发布商品表单
    document.getElementById('publishForm').addEventListener('submit', handlePublish);


    // 图片预览
    setupImagePreview();
}

// 设置图片预览
function setupImagePreview() {
    const publishImageInput = document.getElementById('itemImage');
    const previewDiv = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (publishImageInput) {
        publishImageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImg.src = e.target.result;
                    previewDiv.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewDiv.style.display = 'none';
            }
        });
    }

    const editImageInput = document.getElementById('editItemImage');
    const editPreviewDiv = document.getElementById('editImagePreview');
    const editPreviewImg = document.getElementById('editPreviewImg');

    if (editImageInput) {
        editImageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    editPreviewImg.src = e.target.result;
                    editPreviewImg.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// 设置注册表单实时验证
function setupRegisterValidation() {
    const usernameInput = document.getElementById('registerUsername');
    const passwordInput = document.getElementById('registerPassword');
    const emailInput = document.getElementById('registerEmail');
    const phoneInput = document.getElementById('registerPhone');

    // 用户名验证
    usernameInput.addEventListener('blur', () => {
        validateUsername(usernameInput.value);
    });

    usernameInput.addEventListener('input', () => {
        clearFieldError(usernameInput);
    });

    // 密码验证
    passwordInput.addEventListener('blur', () => {
        validatePassword(passwordInput.value);
    });

    passwordInput.addEventListener('input', () => {
        clearFieldError(passwordInput);
    });

    // 邮箱验证
    emailInput.addEventListener('blur', () => {
        if (emailInput.value.trim()) {
            validateEmail(emailInput.value);
        }
    });

    emailInput.addEventListener('input', () => {
        clearFieldError(emailInput);
    });

    // 手机号验证
    phoneInput.addEventListener('blur', () => {
        if (phoneInput.value.trim()) {
            validatePhone(phoneInput.value);
        }
    });

    phoneInput.addEventListener('input', () => {
        clearFieldError(phoneInput);
    });
}

// 验证用户名
function validateUsername(username) {
    const input = document.getElementById('registerUsername');

    if (!username || username.trim().length === 0) {
        showFieldError(input, '用户名不能为空');
        return false;
    }

    if (username.length < 3 || username.length > 20) {
        showFieldError(input, '用户名长度必须在3-20个字符之间');
        return false;
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
        showFieldError(input, '用户名只能包含字母、数字、下划线或中文');
        return false;
    }

    clearFieldError(input);
    return true;
}

// 验证密码
function validatePassword(password) {
    const input = document.getElementById('registerPassword');

    if (!password || password.length === 0) {
        showFieldError(input, '密码不能为空');
        return false;
    }

    if (password.length < 6 || password.length > 20) {
        showFieldError(input, '密码长度必须在6-20个字符之间');
        return false;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,20}$/.test(password)) {
        showFieldError(input, '密码必须包含字母和数字');
        return false;
    }

    clearFieldError(input);
    return true;
}

// 验证邮箱
function validateEmail(email) {
    const input = document.getElementById('registerEmail');

    if (!email || email.trim().length === 0) {
        clearFieldError(input);
        return true;
    }

    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        showFieldError(input, '邮箱格式不正确');
        return false;
    }

    clearFieldError(input);
    return true;
}

// 验证手机号
function validatePhone(phone) {
    const input = document.getElementById('registerPhone');

    if (!phone || phone.trim().length === 0) {
        clearFieldError(input);
        return true;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
        showFieldError(input, '手机号格式不正确');
        return false;
    }

    clearFieldError(input);
    return true;
}

// 显示字段错误
function showFieldError(input, message) {
    input.style.borderColor = '#ef4444';
    input.setAttribute('data-error', message);

    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('field-error')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '0.3rem';
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = message;
}

// 清除字段错误
function clearFieldError(input) {
    input.style.borderColor = '';
    input.removeAttribute('data-error');

    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('field-error')) {
        errorDiv.remove();
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();

    // 前端验证
    if (!validateUsername(username)) {
        showToast('请检查用户名格式', 'warning');
        return;
    }

    if (!validatePassword(password)) {
        showToast('请检查密码格式', 'warning');
        return;
    }

    if (email && !validateEmail(email)) {
        showToast('请检查邮箱格式', 'warning');
        return;
    }

    if (phone && !validatePhone(phone)) {
        showToast('请检查手机号格式', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password, email, phone})
        });

        const result = await response.json();

        if (result.code === 200) {
            showToast('注册成功！请登录', 'success');
            closeRegisterModal();
            showLoginModal();
        } else {
            showToast(result.msg || '注册失败', 'error');
        }
    } catch (error) {
        console.error('注册失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}


// 处理登录
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.code === 200 && result.data) {
            currentUser = result.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            closeLoginModal();
            showToast('登录成功！', 'success');
            loadMyItems(); // 预加载数据
            loadUnreadCount();
            loadFavoriteIds();
            // 保持在首页，不自动切换到"我的商品"
        } else {
            showToast(result.msg || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

// ... existing code ...

// 处理发布商品
async function handlePublish(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('请先登录！', 'warning');
        showLoginModal();
        return;
    }

    const title = document.getElementById('itemTitle').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const quantity = parseInt(document.getElementById('itemQuantity').value) || 1;
    const type = parseInt(document.getElementById('itemCategory').value) || 1;
    const imageFile = document.getElementById('itemImage').files[0];

    if (!title) {
        showToast('请输入标题', 'warning');
        return;
    }

    if (price < 0) {
        showToast('价格不能为负数', 'warning');
        return;
    }

    if (quantity < 1) {
        showToast('数量至少为1', 'warning');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('userId', currentUser.id);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('quantity', quantity);
        formData.append('type', type);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await fetch('/api/item/addWithImage', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.code === 200) {
            showToast('发布成功！等待管理员审核', 'success');
            closePublishModal();
            document.getElementById('publishForm').reset();
            document.getElementById('imagePreview').style.display = 'none';
            loadMyItems();
        } else {
            showToast(result.msg || '发布失败', 'error');
        }
    } catch (error) {
        console.error('发布失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}


// 下架商品
function offshelfItem(itemId) {
    showConfirm(
        '确认下架',
        '确定要下架此商品吗？下架后将不再显示在主页。',
        async () => {
            try {
                const response = await fetch(`/api/item/offshelf/${itemId}?userId=${currentUser.id}`, {
                    method: 'PUT'
                });

                const result = await response.json();

                if (result.code === 200) {
                    showToast('下架成功！', 'success');
                    loadMyItems();
                } else {
                    showToast(result.msg || '下架失败', 'error');
                }
            } catch (error) {
                console.error('下架失败:', error);
                showToast('网络错误，请稍后重试', 'error');
            }
        },
        true
    );
}

// 重新上架商品
function restoreMyItem(itemId) {
    showConfirm(
        '确认重新上架',
        '确定要重新上架此商品吗？上架后将显示在主页供用户浏览。',
        async () => {
            try {
                const response = await fetch(`/api/item/restore/${itemId}`, {
                    method: 'PUT'
                });

                const result = await response.json();

                if (result.code === 200) {
                    showToast('重新上架成功！', 'success');
                    loadMyItems();
                } else {
                    showToast(result.msg || '重新上架失败', 'error');
                }
            } catch (error) {
                console.error('重新上架失败:', error);
                showToast('网络错误，请稍后重试', 'error');
            }
        }
    );
}

// 删除商品
function deleteMyItem(itemId) {
    showConfirm(
        '确认删除',
        '确定要删除此商品吗？此操作不可恢复！',
        async () => {
            try {
                const response = await fetch(`/api/item/delete/${itemId}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.code === 200) {
                    showToast('删除成功！', 'success');
                    loadMyItems();
                } else {
                    showToast(result.msg || '删除失败', 'error');
                }
            } catch (error) {
                console.error('删除失败:', error);
                showToast('网络错误，请稍后重试', 'error');
            }
        },
        true
    );
}

// 模态框控制函数
function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

function showRegisterModal() {
    closeLoginModal();
    document.getElementById('registerModal').classList.add('show');
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('show');
}

function showPublishModal() {
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        showLoginModal();
        return;
    }
    document.getElementById('publishModal').classList.add('show');
}

function closePublishModal() {
    document.getElementById('publishModal').classList.remove('show');
}

function showEditModal(itemId) {
    const item = myItems.find(i => i.id === itemId);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }

    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemTitle').value = item.title;
    document.getElementById('editItemDescription').value = item.description || '';
    document.getElementById('editItemPrice').value = item.price || 0;
    document.getElementById('editItemQuantity').value = item.quantity || 1;
    document.getElementById('editItemCategory').value = item.type || 1;

    const editPreviewImg = document.getElementById('editPreviewImg');
    if (item.imageUrl) {
        editPreviewImg.src = item.imageUrl;
        editPreviewImg.style.display = 'block';
    } else {
        editPreviewImg.style.display = 'none';
    }

    document.getElementById('editItemImage').value = '';

    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

// 显示我的商品
function showMyItems() {
    hideUserDropdown();
    renderItemsWithActions();
}

// 显示我的收藏
async function showMyFavorites() {
    closeUserCenterPanel();

    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }

    const grid = document.getElementById('itemGrid');
    const emptyState = document.getElementById('emptyState');

    grid.innerHTML = '<div class="loading">加载中</div>';

    try {
        const response = await fetch(`/api/favorite/list/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200 && result.data) {
            if (result.data.length === 0) {
                grid.innerHTML = '';
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<p style="font-size: 1.2rem;">暂无收藏商品</p>';
            } else {
                emptyState.style.display = 'none';
                grid.innerHTML = result.data.map(item => createItemCard(item)).join('');
            }
        } else {
            showToast('加载收藏列表失败', 'error');
        }
    } catch (error) {
        console.error('加载收藏列表失败:', error);
        showToast('网络错误', 'error');
    }
}


// 返回首页 - 暴露到全局
window.backToHome = function backToHome() {
    console.log('返回首页');
    closeUserCenterPanel();
    currentPage = 'home';
    updateBreadcrumb();
    updateSearchPlaceholder();
    loadItems();
}

// 更新搜索框提示文本
function updateSearchPlaceholder() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        switch (currentPage) {
            case 'my-items':
                searchInput.placeholder = '搜索我的商品...';
                break;
            case 'favorites':
                searchInput.placeholder = '搜索收藏的商品...';
                break;
            default:
                searchInput.placeholder = '搜索二手书、数码、寻物启事...';
        }
    }
}

// 导航到指定页面
window.navigateToPage = function navigateToPage(page) {
    console.log('navigateToPage called with:', page, 'currentPage:', currentPage);

    if (page === currentPage) {
        // 如果已经在当前页面，重新加载数据
        if (page === 'home') {
            loadItems();
        } else if (page === 'my-items') {
            loadMyItems();
        }
        return;
    }

    switch (page) {
        case 'home':
            backToHome();
            break;
        case 'my-items':
            showMyItems();
            break;
        case 'favorites':
            showMyFavorites();
            break;
    }
}

// 更新面包屑导航状态
function updateBreadcrumb() {
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');

    breadcrumbItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        }
    });
}


// 退出登录
window.logout = function logout() {
    // 先关闭所有可能遮挡的UI元素
    hideUserDropdown();
    closeUserCenterPanel();

    showConfirm(
        '退出登录',
        '确定要退出登录吗？',
        () => {
            console.log('执行退出登录...');
            currentUser = null;
            localStorage.removeItem('currentUser');
            myItems = [];
            currentPage = 'home'; // 重置为首页
            updateBreadcrumb(); // 更新面包屑导航
            updateUserUI();
            loadItems();
            showToast('已退出登录', 'info');
        },
        false
    );
}

// ... existing code ...

// 隐藏用户下拉菜单
function hideUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// 点击模态框外部关闭
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// ================= 留言模块逻辑 =================

// 打开留言板
window.openMessageModal = (itemId) => {
    if (!currentUser) {
        showToast('请先登录后再留言！', 'warning');
        showLoginModal();
        return;
    }
    document.getElementById('messageItemId').value = itemId;
    document.getElementById('messageContent').value = '';
    document.getElementById('messageModal').classList.add('show');
    loadMessages(itemId);
};

// 关闭留言板
window.closeMessageModal = () => {
    document.getElementById('messageModal').classList.remove('show');
};

// 加载该商品的留言
async function loadMessages(itemId) {
    const list = document.getElementById('messageList');
    list.innerHTML = '<div class="loading">加载留言中...</div>';

    try {
        const response = await fetch(`/api/message/item/${itemId}`);
        const result = await response.json();

        if (result.code === 200) {
            if (result.data.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:#9ca3af;">暂无留言，快来抢沙发！</p>';
            } else {
                list.innerHTML = result.data.map(m => `
                    <div class="message-item" style="margin-bottom:12px; padding:12px; background:rgba(255,255,255,0.7); border-radius:12px; border-left:3px solid var(--ios-primary);">
                        <div class="message-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="color:var(--ios-primary); font-weight:700; font-size: 0.95rem;">👤 ${escapeHtml(m.fromUserName)}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">${formatTime(m.createTime)}</span>
                        </div>
                        <p style="margin:0; font-size: 0.95rem; color:var(--text-main); line-height:1.5; font-weight:500;">${escapeHtml(m.content)}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        list.innerHTML = '<p style="color:red; text-align:center;">留言加载失败</p>';
        showToast('留言加载失败', 'error');
    }
}

// 绑定发送留言表单事件
document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = document.getElementById('messageItemId').value;
    const content = document.getElementById('messageContent').value.trim();

    if (!content) {
        showToast('请输入留言内容', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/message/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                itemId: itemId,
                fromUserId: currentUser.id,
                content: content
            })
        });

        const result = await response.json();
        if (result.code === 200) {
            document.getElementById('messageContent').value = '';
            showToast('留言发送成功！', 'success');
            loadMessages(itemId);
        } else {
            showToast(result.msg || '留言发送失败', 'error');
        }
    } catch (error) {
        showToast('网络错误，请稍后重试', 'error');
    }
});

// 加载未读通知数量
async function loadUnreadCount() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/message/unread/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200) {
            const badge = document.getElementById('unreadBadge');
            if (badge) {
                if (result.data > 0) {
                    badge.textContent = result.data > 99 ? '99+' : result.data;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('加载未读数量失败:', error);
    }
}

// 显示系统通知
async function showNotifications() {
    hideUserDropdown();

    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }

    try {
        // 先加载我的商品信息，确保能显示正确的商品标题
        await loadMyItems();

        const response = await fetch(`/api/message/notifications/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200) {
            showNotificationModal(result.data);
        } else {
            showToast('加载通知失败', 'error');
        }
    } catch (error) {
        console.error('加载通知失败:', error);
        showToast('网络错误', 'error');
    }
}

// 显示通知模态框
function showNotificationModal(notifications) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'notificationModal';

    let notificationList = '';
    if (!notifications || notifications.length === 0) {
        notificationList = '<p style="text-align: center; color: #9ca3af; padding: 2rem;">暂无系统通知</p>';
    } else {
        notificationList = notifications.map(notification => {
            // 先从 myItems 中查找，再从 allItems 中查找
            let item = myItems.find(i => i.id === notification.itemId);
            if (!item) {
                item = allItems.find(i => i.id === notification.itemId);
            }
            const itemTitle = item ? item.title : '商品ID: ' + notification.itemId;
            const isReadClass = notification.isRead === 1 ? 'read' : 'unread';

            return `
                <div class="notification-item ${isReadClass}">
                    <div class="notification-header">
                        <span class="notification-title">📢 商品通知</span>
                        <span class="notification-time">${formatTime(notification.createTime)}</span>
                    </div>
                    <div class="notification-content">${escapeHtml(notification.content)}</div>
                    <div class="notification-footer">
                        <span class="notification-item-link">相关商品：${escapeHtml(itemTitle)}</span>
                        <button class="btn-delete-notification" onclick="deleteNotification(${notification.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.3s;">
                            ✓ 标记已读并删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    modal.innerHTML = `
        <div class="modal-content glass-card" style="max-width: 600px; max-height: 80vh;">
            <span class="close" onclick="closeNotificationModal()">&times;</span>
            <h2>🔔 系统通知</h2>
            <div class="notification-list" style="max-height: 60vh; overflow-y: auto;">
                ${notificationList}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// 删除通知（标记已读并删除）
async function deleteNotification(messageId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/message/${messageId}/${currentUser.id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.code === 200) {
            showToast('已删除通知', 'success');
            closeNotificationModal();
            showNotifications();
            loadUnreadCount();
        } else {
            showToast(result.msg || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除通知失败:', error);
        showToast('网络错误', 'error');
    }
}

// 关闭通知模态框
function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.remove();
    }
}

// 显示商品详情
window.showItemDetail = async function showItemDetail(itemId) {
    try {
        console.log('打开商品详情，ID:', itemId);

        let url = `/api/item/${itemId}`;
        if (currentUser) {
            url += `?currentUserId=${currentUser.id}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.code === 200 && result.data) {
            const item = result.data;
            const detailContent = document.getElementById('itemDetailContent');

            if (!detailContent) {
                console.error('找不到 itemDetailContent 元素');
                showToast('页面错误，请刷新重试', 'error');
                return;
            }

            // 获取卖家信息
            let sellerInfo = '';
            if (item.userId) {
                try {
                    const userResponse = await fetch(`/api/user/${item.userId}`);
                    const userResult = await userResponse.json();
                    if (userResult.code === 200 && userResult.data) {
                        const user = userResult.data;
                        sellerInfo = `
                            <div class="seller-info">
                                <h4>卖家信息</h4>
                                <div class="seller-details">
                                    <div class="seller-avatar">${user.username.charAt(0).toUpperCase()}</div>
                                    <div class="seller-name">${escapeHtml(user.username)}</div>
                                </div>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('获取卖家信息失败:', error);
                }
            }

            // 构建商品详情HTML
            const typeNames = {
                1: '普通商品',
                2: '二手教材',
                3: '数码外设',
                4: '寻物启事'
            };

            const statusNames = {
                0: '待审核',
                1: '在售',
                2: '已下架'
            };

            const typeToCategoryClass = {
                1: 'other',
                2: 'books',
                3: 'digital',
                4: 'lost'
            };

            const categoryIcon = getCategoryIcon(typeToCategoryClass[item.type] || 'other');

            const imageHtml = item.imageUrl ?
                `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" class="detail-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                 <div class="detail-image-placeholder placeholder-${categoryIcon}" style="display:none;"></div>` :
                `<div class="detail-image-placeholder placeholder-${categoryIcon}"></div>`;

            detailContent.innerHTML = `
                <div class="item-detail-header">
                    <h2>${escapeHtml(item.title)}</h2>
                    <div class="item-meta">
                        <span class="item-type">${typeNames[item.type] || '未知分类'}</span>
                        <span class="item-status status-${item.status}">${statusNames[item.status] || '未知状态'}</span>
                    </div>
                </div>
                
                <div class="item-detail-body">
                    ${imageHtml}
                    
                    <div class="item-info-grid">
                        <div class="info-item">
                            <span class="info-label">价格：</span>
                            <span class="info-value price-value">${item.price && item.price > 0 ? `¥${parseFloat(item.price).toFixed(2)}` : (item.type === 4 ? '急寻' : '免费')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">数量：</span>
                            <span class="info-value">${item.quantity || 1}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">发布时间：</span>
                            <span class="info-value">${formatTime(item.createTime)}</span>
                        </div>
                    </div>
                    
                    <div class="item-description">
                        <h4>商品描述</h4>
                        <p>${escapeHtml(item.description || '暂无描述')}</p>
                    </div>
                    
                    ${sellerInfo}
                </div>
                
                <div class="item-detail-actions">
                    <button class="btn-contact" onclick="openMessageModal(${item.id}); closeItemDetailModal();">💬 联系卖家</button>
                    <button class="btn-favorite-detail ${favoriteItemIds.has(item.id) ? 'favorited' : ''}" onclick="toggleFavorite(${item.id}, event); updateDetailFavoriteButton(${item.id});">
                        ${favoriteItemIds.has(item.id) ? '❤️ 已收藏' : '🤍 收藏'}
                    </button>
                </div>
            `;

            const modal = document.getElementById('itemDetailModal');
            if (modal) {
                modal.classList.add('show');
                console.log('商品详情模态框已显示');
            } else {
                console.error('找不到 itemDetailModal 元素');
                showToast('页面错误，请刷新重试', 'error');
            }
        } else {
            showToast(result.msg || '获取商品详情失败', 'error');
        }
    } catch (error) {
        console.error('获取商品详情失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
};

// 更新详情页收藏按钮状态
window.updateDetailFavoriteButton = function updateDetailFavoriteButton(itemId) {
    const btn = document.querySelector('.btn-favorite-detail');
    if (btn) {
        if (favoriteItemIds.has(itemId)) {
            btn.classList.add('favorited');
            btn.innerHTML = '❤️ 已收藏';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '🤍 收藏';
        }
    }
};

// 关闭商品详情模态框
window.closeItemDetailModal = function closeItemDetailModal() {
    const modal = document.getElementById('itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

// 加载已收藏的商品ID列表
async function loadFavoriteIds() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/favorite/list/${currentUser.id}`);
        const result = await response.json();

        if (result.code === 200 && result.data) {
            favoriteItemIds = new Set(result.data.map(item => item.id));
            updateFavoriteButtons();
        }
    } catch (error) {
        console.error('加载收藏列表失败:', error);
    }
}

// 更新收藏按钮状态
function updateFavoriteButtons() {
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        const itemId = parseInt(btn.dataset.itemId);
        if (favoriteItemIds.has(itemId)) {
            btn.classList.add('favorited');
            btn.innerHTML = '❤️ 已收藏';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '🤍 收藏';
        }
    });
}

// 切换收藏状态
async function toggleFavorite(itemId, event) {
    if (event) {
        event.stopPropagation();
    }

    if (!currentUser) {
        showToast('请先登录', 'warning');
        showLoginModal();
        return;
    }

    try {
        if (favoriteItemIds.has(itemId)) {
            // 取消收藏
            const response = await fetch(`/api/favorite/remove?userId=${currentUser.id}&itemId=${itemId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.code === 200) {
                favoriteItemIds.delete(itemId);
                showToast('已取消收藏', 'success');
                updateFavoriteButtons();
            } else {
                showToast(result.msg || '取消收藏失败', 'error');
            }
        } else {
            // 添加收藏
            const response = await fetch(`/api/favorite/add?userId=${currentUser.id}&itemId=${itemId}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (result.code === 200) {
                favoriteItemIds.add(itemId);
                showToast('收藏成功', 'success');
                updateFavoriteButtons();
            } else {
                showToast(result.msg || '收藏失败', 'error');
            }
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        showToast('网络错误', 'error');
    }
}

// ================= WebSocket 实时私信功能 =================

let wsConnection = null;
let currentChatUserId = null;
let chatHistory = [];

// 初始化 WebSocket 连接
function initWebSocket() {
    if (!currentUser || wsConnection) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?userId=${currentUser.id}`;

    try {
        wsConnection = new WebSocket(wsUrl);

        wsConnection.onopen = function () {
            console.log('WebSocket 连接已建立');
            showToast('实时聊天已连接', 'success');
        };

        wsConnection.onmessage = function (event) {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        };

        wsConnection.onerror = function (error) {
            console.error('WebSocket 错误:', error);
            showToast('聊天连接异常', 'error');
        };

        wsConnection.onclose = function () {
            console.log('WebSocket 连接已关闭');
            wsConnection = null;
            // 尝试重连
            setTimeout(initWebSocket, 3000);
        };
    } catch (error) {
        console.error('WebSocket 连接失败:', error);
    }
}

// 处理接收到的 WebSocket 消息
function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'CHAT':
            handleChatMessage(message);
            break;
        case 'JOIN':
            console.log(`${message.fromUserName} 加入了聊天`);
            break;
        case 'LEAVE':
            console.log(`${message.fromUserName} 离开了聊天`);
            updateOnlineStatus(message.fromUserId, false);
            break;
        case 'READ_RECEIPT':
            handleReadReceipt(message);
            break;
    }
}

// 处理聊天消息
function handleChatMessage(message) {
    // 如果当前正在与发送者聊天，则立即显示消息
    if (currentChatUserId === message.fromUserId) {
        appendMessageToChat(message);
        // 标记为已读
        sendReadReceipt(message.fromUserId);
    } else {
        // 否则显示通知
        showToast(`收到来自 ${message.fromUserName} 的新消息`, 'info');
        // 可以在这里添加未读消息计数
    }
}

// 处理已读回执
function handleReadReceipt(message) {
    // 更新本地消息状态为已读
    chatHistory.forEach(msg => {
        if (msg.fromUserId === currentUser.id && msg.toUserId === message.fromUserId) {
            msg.isRead = true;
        }
    });
}

// 发送已读回执
function sendReadReceipt(toUserId) {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) return;

    const receipt = {
        type: 'READ_RECEIPT',
        fromUserId: currentUser.id,
        toUserId: toUserId,
        timestamp: new Date().toISOString()
    };

    wsConnection.send(JSON.stringify(receipt));
}

// 打开私信对话框
window.openPrivateChat = function openPrivateChat(otherUserId, otherUserName, itemId) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        showLoginModal();
        return;
    }

    console.log('打开私信对话框:', otherUserId, otherUserName);

    currentChatUserId = otherUserId;
    currentChatItemId = itemId || null; // 保存商品 ID

    // 创建或显示私信对话框
    showChatModal(otherUserId, otherUserName);

    // 加载聊天历史
    async function loadChatHistory(otherUserId) {
        console.log('=== 开始加载聊天历史 ===');
        console.log('当前用户ID:', currentUser?.id);
        console.log('对方用户ID:', otherUserId);

        const messagesContainer = document.getElementById(`chatMessages_${otherUserId}`);
        if (!messagesContainer) {
            console.error('❌ 找不到消息容器: chatMessages_' + otherUserId);
            console.log('尝试查找所有聊天容器...');
            const allContainers = document.querySelectorAll('[id^="chatMessages_"]');
            console.log('找到的容器:', Array.from(allContainers).map(el => el.id));
            return;
        }

        console.log('✅ 找到消息容器:', messagesContainer.id);
        messagesContainer.innerHTML = '<div class="loading">加载聊天记录...</div>';

        try {
            const apiUrl = `/api/message/private/${currentUser.id}/${otherUserId}`;
            console.log('请求API:', apiUrl);

            const response = await fetch(apiUrl);
            const result = await response.json();

            console.log('API响应:', result);
            console.log('消息数量:', result.data?.length || 0);

            if (result.code === 200) {
                chatHistory = result.data || [];
                console.log('准备渲染消息，数量:', chatHistory.length);

                if (chatHistory.length > 0) {
                    console.log('第一条消息:', chatHistory[0]);
                    console.log('最后一条消息:', chatHistory[chatHistory.length - 1]);
                }

                renderChatMessages(chatHistory, otherUserId);
            } else {
                console.error('API返回错误:', result.msg);
                messagesContainer.innerHTML = '<p style="text-align:center;color:#9ca3af;">加载聊天记录失败</p>';
            }
        } catch (error) {
            console.error('❌ 加载聊天历史异常:', error);
            messagesContainer.innerHTML = '<p style="text-align:center;color:#9ca3af;">网络错误</p>';
        }

        console.log('=== 加载聊天历史结束 ===');
    }


    // 标记消息为已读
    sendReadReceipt(otherUserId);
};

// 显示聊天模态框
function showChatModal(otherUserId, otherUserName) {
    // 检查是否已存在聊天窗口
    let chatModal = document.getElementById(`chatModal_${otherUserId}`);

    if (!chatModal) {
        console.log('创建新的聊天窗口:', otherUserId, otherUserName);

        chatModal = document.createElement('div');
        chatModal.className = 'modal show chat-modal';
        chatModal.id = `chatModal_${otherUserId}`;

        chatModal.innerHTML = `            <div class="modal-content glass-card chat-container">
                <div class="chat-header">
                    <h3>与 ${escapeHtml(otherUserName)} 的对话</h3>
                    <span class="close" onclick="closeChatModal(${otherUserId})">&times;</span>
                </div>
                <div class="chat-messages" id="chatMessages_${otherUserId}">
                    <!-- 消息将在这里动态加载 -->
                </div>
                <div class="chat-input-area">
                    <textarea id="chatInput_${otherUserId}" placeholder="输入消息..." rows="2"></textarea>
                    <button class="btn-send" onclick="sendChatMessage(${otherUserId})">发送</button>
                </div>
            </div>
        `;

        document.body.appendChild(chatModal);
        console.log('聊天窗口创建完成，容器ID: chatMessages_' + otherUserId);
    } else {
        console.log('使用已存在的聊天窗口:', otherUserId);
        chatModal.classList.add('show');
    }
}


// 关闭聊天模态框
window.closeChatModal = function closeChatModal(otherUserId) {
    const chatModal = document.getElementById(`chatModal_${otherUserId}`);
    if (chatModal) {
        chatModal.classList.remove('show');
    }
    currentChatUserId = null;
};

async function loadChatHistory(otherUserId) {
    const messagesContainer = document.getElementById(`chatMessages_${otherUserId}`);
    if (!messagesContainer) {
        console.error('找不到消息容器: chatMessages_' + otherUserId);
        return;
    }

    messagesContainer.innerHTML = '<div class="loading">加载聊天记录...</div>';

    try {
        console.log('加载聊天历史:', currentUser.id, otherUserId);
        const response = await fetch(`/api/message/private/${currentUser.id}/${otherUserId}`);
        const result = await response.json();

        console.log('聊天历史响应:', result);

        if (result.code === 200) {
            chatHistory = result.data;
            // 直接传递 otherUserId 而不是使用 currentChatUserId
            renderChatMessages(chatHistory, otherUserId);
        } else {
            messagesContainer.innerHTML = '<p style="text-align:center;color:#9ca3af;">加载聊天记录失败</p>';
        }
    } catch (error) {
        console.error('加载聊天历史失败:', error);
        messagesContainer.innerHTML = '<p style="text-align:center;color:#9ca3af;">网络错误</p>';
    }
}


// 渲染聊天消息
function renderChatMessages(messages, userId) {
    console.log('--- 开始渲染聊天消息 ---');

    // 使用传入的 userId，如果没有则使用 currentChatUserId
    const targetUserId = userId || currentChatUserId;
    console.log('目标用户ID:', targetUserId);

    const messagesContainer = document.getElementById(`chatMessages_${targetUserId}`);

    if (!messagesContainer) {
        console.error('❌ 渲染时找不到消息容器: chatMessages_' + targetUserId);
        return;
    }

    console.log('✅ 找到渲染容器:', messagesContainer.id);

    if (!messages || messages.length === 0) {
        console.log('没有消息，显示空状态');
        messagesContainer.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;">暂无聊天记录，开始聊天吧！</p>';
        return;
    }

    console.log('渲染', messages.length, '条消息');

    const html = messages.map((msg, index) => {
        const isMine = msg.fromUserId === currentUser.id;
        const time = formatTime(msg.createTime);

        if (index === 0 || index === messages.length - 1) {
            console.log(`消息[${index}]:`, {
                from: msg.fromUserId,
                to: msg.toUserId,
                isMine: isMine,
                content: msg.content?.substring(0, 20),
                time: time
            });
        }

        return `            <div class="message-bubble ${isMine ? 'mine' : 'other'}">
                <div class="message-content">${escapeHtml(msg.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');

    messagesContainer.innerHTML = html;
    console.log('HTML渲染完成，内容长度:', html.length);

    // 滚动到底部
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log('已滚动到底部');
    console.log('--- 渲染聊天消息结束 ---');
}


// 追加单条消息到聊天界面
function appendMessageToChat(message) {
    const messagesContainer = document.getElementById(`chatMessages_${currentChatUserId}`);
    if (!messagesContainer) {
        console.error('找不到消息容器: chatMessages_' + currentChatUserId);
        return;
    }

    const isMine = message.fromUserId === currentUser.id;
    const time = formatTime(message.timestamp || new Date().toISOString());

    const messageHtml = `        <div class="message-bubble ${isMine ? 'mine' : 'other'}">
            <div class="message-content">${escapeHtml(message.content)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


// 发送聊天消息
window.sendChatMessage = function sendChatMessage(toUserId) {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
        showToast('聊天连接未建立', 'error');
        return;
    }

    const input = document.getElementById(`chatInput_${toUserId}`);
    const content = input.value.trim();

    if (!content) {
        showToast('请输入消息内容', 'warning');
        return;
    }

    const message = {
        type: 'CHAT',
        fromUserId: currentUser.id,
        toUserId: toUserId,
        content: content,
        timestamp: new Date().toISOString()
    };

    wsConnection.send(JSON.stringify(message));

    // 清空输入框
    input.value = '';

    // 立即显示在自己的聊天窗口中
    appendMessageToChat({
        fromUserId: currentUser.id,
        toUserId: toUserId,
        content: content,
        timestamp: new Date().toISOString()
    });
};

// 更新用户在线状态
function updateOnlineStatus(userId, isOnline) {
    // 可以在这里更新UI显示用户在线状态
    const statusIndicator = document.getElementById(`online-status-${userId}`);
    if (statusIndicator) {
        statusIndicator.className = isOnline ? 'online' : 'offline';
    }
}

// 在页面加载完成后初始化 WebSocket
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...

    // 初始化 WebSocket 连接
    if (currentUser) {
        initWebSocket();
    }
});

// 在用户登录成功后初始化 WebSocket
const originalHandleLogin = window.handleLogin;
window.handleLogin = async function handleLogin(e) {
    if (originalHandleLogin) {
        await originalHandleLogin(e);
    }

    // 登录成功后初始化 WebSocket
    if (currentUser) {
        setTimeout(initWebSocket, 1000);
    }
};

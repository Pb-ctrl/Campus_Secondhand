// 全局状态
const $ = id => document.getElementById(id);
let currentStatus = 0, allItems = [];
let currentAdmin = null;
let filteredItems = [];
let selectedItems = new Set();

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('后台页面加载完成，初始化...');
    checkAdminLogin();
    setupEventListeners();
    initAIStandardsToggle();
});

// 初始化页面状态
function initializePageState() {
    console.log('初始化页面状态...');
    const loginContainer = $('adminLoginContainer');
    const adminContent = $('adminContent');

    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }

    if (adminContent) {
        adminContent.classList.remove('show');
    }

    console.log('页面状态初始化完成');
}


// AI 标准面板切换
function initAIStandardsToggle() {
    const hasSeenStandards = localStorage.getItem('hasSeenAIStandards');
    if (!hasSeenStandards) {
        const standardsContent = document.getElementById('aiStandardsContent');
        if (standardsContent) {
            standardsContent.style.display = 'block';
            const toggle = document.getElementById('aiStandardsToggle');
            if (toggle) {
                toggle.textContent = '▲';
            }
        }
    }
}

window.toggleAIStandards = function toggleAIStandards() {
    const content = document.getElementById('aiStandardsContent');
    const toggle = document.getElementById('aiStandardsToggle');

    if (content && toggle) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲';
            localStorage.setItem('hasSeenAIStandards', 'true');
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
}

// 绑定事件监听器
function setupEventListeners() {
    // 绑定登录表单
    const loginForm = $('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    // 绑定标签切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(tab =>
        tab.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = parseInt(tab.dataset.status);
            clearSelection();
            applyFilters();
        }
    );
}

// 应用所有筛选条件
function applyFilters() {
    const keyword = $('searchKeyword') ? $('searchKeyword').value.trim().toLowerCase() : '';
    const category = $('filterCategory') ? $('filterCategory').value : 'all';
    const sortBy = $('sortBy') ? $('sortBy').value : 'newest';

    // 先按状态筛选
    filteredItems = allItems.filter(item => item.status === currentStatus);

    // 按关键词筛选
    if (keyword) {
        filteredItems = filteredItems.filter(item => {
            const title = (item.title || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            return title.includes(keyword) || description.includes(keyword);
        });
    }

    // 按分类筛选
    if (category !== 'all') {
        const categoryNum = parseInt(category);
        filteredItems = filteredItems.filter(item => item.type === categoryNum);
    }

    // 排序
    filteredItems.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createTime) - new Date(a.createTime);
            case 'oldest':
                return new Date(a.createTime) - new Date(b.createTime);
            case 'price-high':
                return (b.price || 0) - (a.price || 0);
            case 'price-low':
                return (a.price || 0) - (b.price || 0);
            default:
                return 0;
        }
    });

    renderTable();
    updateFilterCount();
}

// 重置筛选条件
function resetFilters() {
    if ($('searchKeyword')) $('searchKeyword').value = '';
    if ($('filterCategory')) $('filterCategory').value = 'all';
    if ($('sortBy')) $('sortBy').value = 'newest';
    applyFilters();
    showToast('筛选条件已重置', 'info');
}

// 更新筛选结果计数
function updateFilterCount() {
    const countEl = $('filterResultCount');
    if (countEl) {
        countEl.textContent = `共 ${filteredItems.length} 条记录`;
    }
}

// 检查管理员登录状态
function checkAdminLogin() {
    console.log('检查管理员登录状态...');
    const adminStr = localStorage.getItem('currentAdmin');

    if (adminStr) {
        try {
            currentAdmin = JSON.parse(adminStr);
            console.log('已登录管理员:', currentAdmin.username);

            // 更新管理员名称显示
            const adminNameEl = $('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = currentAdmin.username;
            }

            showAdminContent();
            loadItems();
        } catch (error) {
            console.error('解析管理员信息失败:', error);
            localStorage.removeItem('currentAdmin');
            showLoginContainer();
        }
    } else {
        console.log('未登录，显示登录界面');
        showLoginContainer();
    }
}



// 处理管理员登录
async function handleAdminLogin(e) {
    e.preventDefault();

    const username = $('adminUsername').value.trim();
    const password = $('adminPassword').value;

    if (!username || !password) {
        showToast('请输入用户名和密码', 'warning');
        return;
    }

    try {
        console.log('尝试登录...', username);
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password})
        });

        const result = await response.json();
        console.log('登录结果:', result);

        if (result.code === 200 && result.data) {
            currentAdmin = result.data;
            localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));

            // 更新管理员名称显示
            const adminNameEl = $('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = currentAdmin.username;
            }

            showToast('登录成功！', 'success');
            showAdminContent();
            loadItems();
        } else {
            showToast(result.msg || '登录失败，请检查账号密码', 'error');
        }
    } catch (error) {
        console.error('登录失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

// 显示后台内容
function showAdminContent() {
    console.log('显示后台内容');
    const loginContainer = $('adminLoginContainer');
    const adminContent = $('adminContent');

    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
    if (adminContent) {
        adminContent.style.display = 'block';
    }
}

// 显示登录界面
function showLoginContainer() {
    console.log('显示登录界面');
    const loginContainer = $('adminLoginContainer');
    const adminContent = $('adminContent');

    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }
    if (adminContent) {
        adminContent.style.display = 'none';
    }
}

// 返回首页
window.backToHome = function backToHome() {
    window.location.href = '/';
}

// 退出登录
function logoutAdmin() {
    showConfirm('退出登录', '确定要退出后台管理吗？', () => {
        currentAdmin = null;
        localStorage.removeItem('currentAdmin');
        showLoginContainer();
        showToast('已退出登录', 'info');
    });
}


// 确认对话框 - iOS 18 Alert 风格（与前台统一）
function showConfirm(title, message, callback, isDanger = false) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'confirmModal';
    modal.innerHTML = `
        <div class="modal-content confirm-dialog" style="max-width: 400px; text-align: center;">
            <h3 style="margin-bottom: 1rem; color: #1C1C1E; font-size: 1.3rem; font-weight: 700;">${title}</h3>
            <p style="margin-bottom: 1.5rem; color: #636366; font-size: 0.95rem; line-height: 1.5; white-space: pre-line;">${message}</p>
            <div class="confirm-buttons" style="display: flex; gap: 0.8rem; justify-content: center;">
                <button class="btn-cancel" style="padding: 0.7rem 1.8rem; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.95rem; background: rgba(118, 118, 128, 0.16); color: #1C1C1E; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">取消</button>
                <button class="btn-confirm ${isDanger ? 'danger' : ''}" style="padding: 0.7rem 1.8rem; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.95rem; background: ${isDanger ? '#FF3B30' : '#007AFF'}; color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">确定</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('.btn-cancel');
    const confirmBtn = modal.querySelector('.btn-confirm');

    cancelBtn.onclick = () => {
        modal.remove();
    };

    cancelBtn.onmouseover = () => {
        cancelBtn.style.background = 'rgba(118, 118, 128, 0.24)';
    };

    cancelBtn.onmouseout = () => {
        cancelBtn.style.background = 'rgba(118, 118, 128, 0.16)';
    };

    confirmBtn.onclick = () => {
        modal.remove();
        if (callback) {
            callback();
        }
    };

    confirmBtn.onmouseover = () => {
        if (isDanger) {
            confirmBtn.style.background = '#D63027';
        } else {
            confirmBtn.style.background = '#0051D5';
        }
        confirmBtn.style.transform = 'translateY(-2px)';
        confirmBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    };

    confirmBtn.onmouseout = () => {
        if (isDanger) {
            confirmBtn.style.background = '#FF3B30';
        } else {
            confirmBtn.style.background = '#007AFF';
        }
        confirmBtn.style.transform = 'translateY(0)';
        confirmBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    };

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Toast 提示函数
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
        font-size: 0.95rem;
    `;

    if (type === 'success') {
        toast.style.borderLeft = '4px solid #10b981';
        toast.textContent = '✓ ' + message;
    } else if (type === 'error') {
        toast.style.borderLeft = '4px solid #ef4444';
        toast.textContent = '✕ ' + message;
    } else if (type === 'warning') {
        toast.style.borderLeft = '4px solid #f59e0b';
        toast.textContent = '⚠ ' + message;
    } else {
        toast.style.borderLeft = '4px solid #3b82f6';
        toast.textContent = 'ℹ ' + message;
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// 加载商品列表
async function loadItems() {
    try {
        const headers = {};
        if (currentAdmin) {
            headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
        }

        // 修改为调用安全的后台列表接口
        const res = await fetch('/api/admin/item/list', {headers});
        const {code, data} = await res.json();
        if (code === 200 && data) {
            allItems = data;
            updateStats();
            renderTable();
        } else {
            showToast('加载数据失败', 'error');
        }
    } catch (err) {
        console.error('加载失败:', err);
        showToast('加载数据失败', 'error');
    }
}

function updateStats() {
    const stats = {0: 0, 1: 0, 2: 0};
    allItems.forEach(item => stats[item.status]++);
    $('pendingCount').textContent = stats[0];
    $('approvedCount').textContent = stats[1];
    $('rejectedCount').textContent = stats[2];
}


async function renderTable() {
    const tbody = $('reviewTableBody');

    if (!filteredItems || filteredItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:2rem;color:#6b7280;">暂无数据</td></tr>';
        return;
    }

    const categories = {1: '普通商品', 2: '二手教材', 3: '数码外设', 4: '寻物启事'};
    const statusLabels = {0: '待审核', 1: '已通过', 2: '已下架'};

    const rows = await Promise.all(filteredItems.map(async (item) => {
        const imageHtml = item.imageUrl ?
            `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="showImagePreview('${item.imageUrl}')">` :
            '<span style="color:#9ca3af;">无图片</span>';

        const statusClass = item.status === 0 ? 'status-pending' : item.status === 1 ? 'status-approved' : 'status-rejected';

        let aiScoreHtml = '';
        let aiApprovedBadge = '';

        if (item.status === 0) {
            try {
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                }

                const response = await fetch(`/api/admin/ai/review/${item.id}`, {headers});
                const result = await response.json();

                if (result.code === 200 && result.data) {
                    const score = result.data.score;
                    const recommendation = result.data.recommendation;
                    const autoApproved = result.data.autoApproved;
                    const message = result.data.message;
                    const cached = result.data.cached;

                    let scoreColor = score >= 80 ? '#34C759' : score >= 50 ? '#FF9500' : '#FF3B30';
                    let recText = recommendation === 'approve' ? '建议通过' : recommendation === 'review' ? '建议复审' : '建议拒绝';

                    aiScoreHtml = `<span style="color:${scoreColor}; font-weight:600;">${recText}(${score}分)</span>`;

                    if (cached) {
                        aiScoreHtml += `<br><span style="color:#5AC8FA; font-size:0.7rem;">💾 缓存结果</span>`;
                    }

                    if (autoApproved) {
                        aiScoreHtml += `<br><span style="color:#34C759; font-weight:600; font-size:0.75rem;">✓ ${message || '已自动通过'}</span>`;
                    }
                }
            } catch (e) {
                console.error('获取AI审核结果失败:', e);
            }
        }
        else if (item.status === 1 && item.aiScore != null && item.aiScore >= 80) {
            aiApprovedBadge = `<div class="ai-approved-badge">
                    <div class="ai-title"> AI 自动通过</div>
                    <div class="ai-info">
                        评分: <span class="ai-score">${item.aiScore}分</span>
                        ${item.aiReviewTime ? ` | 审核时间: ${formatDateTime(item.aiReviewTime)}` : ''}                    </div>
                </div>
            `;
        }
        else if (item.status === 2 && item.aiScore != null && item.aiScore < 50) {
            aiApprovedBadge = `<div class="ai-rejected-badge" style="background: rgba(255, 59, 48, 0.1); border-left: 3px solid #FF3B30; padding: 8px; border-radius: 8px; margin-top: 6px;">
                    <div style="color: #FF3B30; font-weight: 600; font-size: 0.85rem;">🤖 AI 自动拒绝</div>
                    <div style="color: #636366; font-size: 0.8rem; margin-top: 4px;">
                        评分: <span style="color: #FF3B30; font-weight: 600;">${item.aiScore}分</span>
                        ${item.aiReviewTime ? ` | 审核时间: ${formatDateTime(item.aiReviewTime)}` : ''}                    </div>
                    ${item.aiReason ? `<div style="color: #FF3B30; font-size: 0.75rem; margin-top: 4px; font-style: italic;">原因: ${escapeHtml(item.aiReason)}</div>` : ''}                </div>
            `;
        }

        const isChecked = selectedItems.has(item.id) ? 'checked' : '';

        const isAIRejected = item.status === 2 && item.aiScore != null && item.aiScore < 50;

        return `<tr class="${isAIRejected ? 'ai-rejected-row' : ''}">
                <td><input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isChecked} onchange="toggleItemSelection(${item.id})" style="cursor: pointer; width: 18px; height: 18px;"></td>
                <td>${item.id}</td>
                <td>${imageHtml}</td>
                <td><strong>${escapeHtml(item.title)}</strong></td>
                <td>${escapeHtml(item.userName || '未知')}</td>
                <td>${categories[item.type] || '其他'}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.description || '')}">${escapeHtml(item.description || '无描述')}</td>
                <td>${formatDateTime(item.createTime)}</td>
                <td>
                    <span class="${statusClass}">${statusLabels[item.status]}</span>
                    ${aiApprovedBadge}                </td>
                <td style="min-width: 200px;">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <button class="btn-view" onclick="viewItem(${item.id})">查看详情</button>
                        ${item.status === 0 ? `                            <button class="btn-approve" onclick="approveItem(${item.id})">通过</button>
                            <button class="btn-reject" onclick="rejectItem(${item.id})">下架</button>
                            ${aiScoreHtml ? `<div style="font-size: 0.8rem; margin-top: 4px;">${aiScoreHtml}</div>` : ''}                        ` : item.status === 1 ? `                            <button class="btn-reject" onclick="rejectItem(${item.id})">下架</button>
                        ` : `                            <button class="btn-approve" onclick="updateItemStatus(${item.id}, 0)" ${isAIRejected ? 'disabled title="AI自动拒绝的违规商品，无法恢复"' : ''} style="${isAIRejected ? 'opacity: 0.5; cursor: not-allowed;' : ''}">恢复</button>
                            ${isAIRejected ? '<span style="color: #FF3B30; font-size: 0.7rem;">⚠️ 严重违规，禁止恢复</span>' : ''}                        `}                    </div>
                </td>
            </tr>`;
    }));

    tbody.innerHTML = rows.join('');
    updateSelectAllCheckbox();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(timeStr) {
    return timeStr ? new Date(timeStr).toLocaleString('zh-CN') : '未知时间';
}

async function updateItemStatus(itemId, status) {
    const statusName = status === 1 ? '通过' : status === 0 ? '恢复待审核' : '下架';
    showConfirm(
        `确认${statusName}`,
        `确定要${statusName}此商品吗？`,
        async () => {
            try {
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                }

                const res = await fetch(`/api/item/status/${itemId}?status=${status}`, {
                    method: 'PUT',
                    headers
                });
                const result = await res.json();
                if (result.code === 200) {
                    showToast(`${statusName}成功`, 'success');
                    loadItems();
                } else {
                    showToast(result.msg || `${statusName}失败`, 'error');
                }
            } catch (err) {
                console.error('操作失败:', err);
                showToast('网络错误', 'error');
            }
        }
    );
}


// 审核通过商品
function approveItem(itemId) {
    const item = allItems.find(i => i.id === itemId);

    showConfirm(
        '确认通过',
        `确定要审核通过此商品吗？\n\n商品标题：${item ? item.title : '未知'}\n\n通过后将显示在主页供用户浏览。`,
        async () => {
            try {
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                }

                // 修改为调用后台专用的 approve 接口
                const res = await fetch(`/api/admin/item/approve/${itemId}`, {
                    method: 'PUT',
                    headers
                });
                const result = await res.json();
                if (result.code === 200) {
                    showToast('审核通过', 'success');
                    loadItems();
                } else {
                    showToast(result.msg || '审核失败', 'error');
                }
            } catch (err) {
                console.error('审核失败:', err);
                showToast('网络错误', 'error');
            }
        }
    );
}

// 拒绝/下架待审核商品
function rejectItem(itemId) {
    const item = allItems.find(i => i.id === itemId);

    showRejectDialog(item, async (reason) => {
        try {
            // 先重新获取商品信息，确保有完整的 userId
            const itemResponse = await fetch(`/api/item/${itemId}`);
            const itemResult = await itemResponse.json();

            if (itemResult.code !== 200 || !itemResult.data) {
                showToast('获取商品信息失败', 'error');
                return;
            }

            const currentItem = itemResult.data;
            console.log('当前商品信息:', currentItem);

            const headers = {};
            if (currentAdmin) {
                headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
            }

            // 修改为调用后台专用的 reject 接口
            const res = await fetch(`/api/admin/item/reject/${itemId}`, {
                method: 'PUT',
                headers
            });
            const result = await res.json();
            if (result.code === 200) {
                // 发送系统通知给用户
                let notificationContent = `您的商品"${currentItem.title}"审核未通过，已被下架。`;
                if (reason && reason.trim()) {
                    notificationContent += `\n\n下架原因：${reason}`;
                }

                console.log('准备发送通知给用户ID:', currentItem.userId);
                const notifySuccess = await sendSystemNotification(currentItem.userId, itemId, notificationContent);

                if (notifySuccess) {
                    showToast('已下架该商品并通知用户', 'success');
                } else {
                    showToast('已下架商品，但通知发送失败', 'warning');
                }
                loadItems();
            } else {
                showToast(result.msg || '下架失败', 'error');
            }
        } catch (err) {
            console.error('下架失败:', err);
            showToast('网络错误', 'error');
        }
    });
}

// 显示下架原因输入对话框
function showRejectDialog(item, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'rejectReasonModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="closeRejectModal()">&times;</span>
            <h2>⚠️ 下架商品</h2>
            <p style="margin-bottom: 1rem; color: #6b7280;">商品：<strong>${escapeHtml(item ? item.title : '未知')}</strong></p>
            <div class="form-group">
                <label>下架原因（选填）：</label>
                <textarea id="rejectReason" rows="4" placeholder="请输入下架原因，例如：图片不符合规范、描述不清晰等...（可不填）"></textarea>
            </div>
            <button class="btn-submit" onclick="submitRejectReason(${item ? item.id : 0})" style="background: #ef4444;">确认下架</button>
        </div>
    `;

    document.body.appendChild(modal);

    window.submitRejectReason = function (itemId) {
        const reason = document.getElementById('rejectReason').value.trim();
        closeRejectModal();
        callback(reason);
    };
}

// 关闭下架原因对话框
function closeRejectModal() {
    const modal = document.getElementById('rejectReasonModal');
    if (modal) {
        modal.remove();
    }
}

// 发送系统通知
async function sendSystemNotification(toUserId, itemId, content) {
    try {
        console.log('准备发送系统通知:', {
            toUserId: toUserId,
            itemId: itemId,
            messageType: 1,
            isRead: 0,
            content: content
        });

        const requestBody = {
            itemId: itemId,
            toUserId: toUserId,
            messageType: 1,
            isRead: 0,
            content: content
        };

        console.log('请求体:', JSON.stringify(requestBody));

        const response = await fetch('/api/message/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody)
        });

        console.log('响应状态:', response.status);

        const result = await response.json();
        console.log('响应结果:', result);

        if (result.code === 200) {
            console.log('✓ 系统通知发送成功');
            return true;
        } else {
            console.error('✗ 发送通知失败:', result.msg);
            showToast('通知发送失败: ' + result.msg, 'warning');
            return false;
        }
    } catch (error) {
        console.error('✗ 发送通知异常:', error);
        showToast('通知发送异常', 'warning');
        return false;
    }
}

// 下架商品
function offshelfItem(itemId) {
    const item = allItems.find(i => i.id === itemId);

    showRejectDialog(item, async (reason) => {
        try {
            // 先重新获取商品信息，确保有完整的 userId
            const itemResponse = await fetch(`/api/item/${itemId}`);
            const itemResult = await itemResponse.json();

            if (itemResult.code !== 200 || !itemResult.data) {
                showToast('获取商品信息失败', 'error');
                return;
            }

            const currentItem = itemResult.data;
            console.log('当前商品信息:', currentItem);

            const headers = {};
            if (currentAdmin) {
                headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
            }

            const res = await fetch(`/api/item/offshelf/${itemId}`, {
                method: 'PUT',
                headers
            });
            const result = await res.json();
            if (result.code === 200) {
                // 发送系统通知给用户
                let notificationContent = `您的商品"${currentItem.title}"已被管理员下架。`;
                if (reason && reason.trim()) {
                    notificationContent += `\n\n下架原因：${reason}`;
                }

                console.log('准备发送通知给用户ID:', currentItem.userId);
                const notifySuccess = await sendSystemNotification(currentItem.userId, itemId, notificationContent);

                if (notifySuccess) {
                    showToast('下架成功并通知用户', 'success');
                } else {
                    showToast('下架成功，但通知发送失败', 'warning');
                }
                loadItems();
            } else {
                showToast(result.msg || '下架失败', 'error');
            }
        } catch (err) {
            console.error('下架失败:', err);
            showToast('网络错误', 'error');
        }
    });
}

// 恢复商品
function restoreItem(itemId) {
    showConfirm(
        '确认恢复',
        '确定要恢复此商品吗？恢复后商品将重新显示在主页。',
        async () => {
            try {
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                }

                const res = await fetch(`/api/item/restore/${itemId}`, {
                    method: 'PUT',
                    headers
                });
                const result = await res.json();
                if (result.code === 200) {
                    showToast('恢复成功', 'success');
                    loadItems();
                } else {
                    showToast(result.msg || '恢复失败', 'error');
                }
            } catch (err) {
                console.error('恢复失败:', err);
                showToast('网络错误', 'error');
            }
        }
    );
}

// 编辑商品
function editItem(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }

    const categories = {1: '普通商品', 2: '二手教材', 3: '数码外设', 4: '寻物启事'};

    showEditDialog(item);
}

// 显示编辑对话框
function showEditDialog(item) {
    const categories = {1: '普通商品', 2: '二手教材', 3: '数码外设', 4: '寻物启事'};

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'editItemModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="closeEditModal()">&times;</span>
            <h2>编辑商品</h2>
            <form id="editItemForm">
                <div class="form-group">
                    <label>标题：</label>
                    <input type="text" id="editTitle" value="${escapeHtml(item.title)}" required>
                </div>
                <div class="form-group">
                    <label>描述：</label>
                    <textarea id="editDescription" rows="4">${escapeHtml(item.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>价格：</label>
                    <input type="number" id="editPrice" step="0.01" value="${item.price || 0}" required>
                </div>
                <div class="form-group">
                    <label>分类：</label>
                    <select id="editType">
                        <option value="1" ${item.type === 1 ? 'selected' : ''}>普通商品</option>
                        <option value="2" ${item.type === 2 ? 'selected' : ''}>二手教材</option>
                        <option value="3" ${item.type === 3 ? 'selected' : ''}>数码外设</option>
                        <option value="4" ${item.type === 4 ? 'selected' : ''}>寻物启事</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit">保存修改</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('editItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveItemEdit(item.id);
    });
}

// 保存编辑
async function saveItemEdit(itemId) {
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value) || 0;
    const type = parseInt(document.getElementById('editType').value) || 1;

    if (!title) {
        showToast('请输入标题', 'warning');
        return;
    }

    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (currentAdmin) {
            headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
        }

        const res = await fetch(`/api/item/update/${itemId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                title,
                description,
                price,
                type
            })
        });

        const result = await res.json();
        if (result.code === 200) {
            showToast('修改成功', 'success');
            closeEditModal();
            loadItems();
        } else {
            showToast(result.msg || '修改失败', 'error');
        }
    } catch (err) {
        console.error('修改失败:', err);
        showToast('网络错误', 'error');
    }
}

// 关闭编辑模态框
function closeEditModal() {
    const modal = document.getElementById('editItemModal');
    if (modal) {
        modal.remove();
    }
}

// 删除商品
function deleteItem(itemId) {
    showConfirm(
        '确认删除',
        '确定要删除此商品吗？此操作不可恢复！',
        async () => {
            try {
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                }

                const res = await fetch(`/api/item/delete/${itemId}`, {
                    method: 'DELETE',
                    headers
                });
                const result = await res.json();
                if (result.code === 200) {
                    showToast('删除成功', 'success');
                    loadItems();
                } else {
                    showToast(result.msg || '删除失败', 'error');
                }
            } catch (err) {
                console.error('删除失败:', err);
                showToast('网络错误', 'error');
            }
        },
        true
    );
}

function viewItem(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }

    const categories = {1: '普通商品', 2: '二手教材', 3: '数码外设', 4: '寻物启事'};
    const statusLabels = {0: '待审核', 1: '已通过', 2: '已下架'};

    // 获取发布者用户名
    let userName = item.userName || '未知';
    if (!item.userName && item.userId) {
        fetch(`/api/user/${item.userId}`)
            .then(res => res.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    userName = result.data.username;
                    // 更新显示的用户名
                    const userNameEl = document.getElementById('detailUserName');
                    if (userNameEl) {
                        userNameEl.textContent = userName;
                    }
                }
            })
            .catch(err => console.error('获取用户信息失败:', err));
    }

    const imageHtml = item.imageUrl ?
        `<div class="detail-row">
            <span class="detail-label">商品图片：</span>
            <div class="detail-value">
                <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" style="max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain; cursor: pointer;" onclick="showImagePreview('${item.imageUrl}')">
            </div>
        </div>` : '';

    // AI 审核信息
    let aiReviewHtml = '';
    if (item.aiScore != null) {
        const scoreColor = item.aiScore >= 80 ? '#34C759' : item.aiScore >= 50 ? '#FF9500' : '#FF3B30';
        const autoApprovedTag = item.aiScore >= 80 && item.status === 1 ?
            '<span style="background: #34C759; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; margin-left: 8px;">AI 自动通过</span>' : '';

        aiReviewHtml = `
            <div class="detail-row">
                <span class="detail-label">AI 审核：</span>
                <div class="detail-value">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: ${scoreColor}; font-weight: 700; font-size: 1.1rem;">${item.aiScore}分</span>
                        ${autoApprovedTag}
                    </div>
                    ${item.aiRecommendation ? `<div style="color: #636366; font-size: 0.85rem; margin-top: 4px;">建议: ${item.aiRecommendation === 'approve' ? '通过' : item.aiRecommendation === 'review' ? '复审' : '拒绝'}</div>` : ''}
                    ${item.aiReviewTime ? `<div style="color: #636366; font-size: 0.85rem; margin-top: 2px;">审核时间: ${formatDateTime(item.aiReviewTime)}</div>` : ''}
                    ${item.aiReason ? `<div style="color: #636366; font-size: 0.85rem; margin-top: 2px;">理由: ${escapeHtml(item.aiReason)}</div>` : ''}
                </div>
            </div>
        `;
    }
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'viewItemModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <span class="close" onclick="closeViewModal()">&times;</span>
            <h2>📋 商品详细信息</h2>
            <div class="view-item-details">
                <div class="detail-row">
                    <span class="detail-label">商品ID：</span>
                    <span class="detail-value">${item.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">标题：</span>
                    <span class="detail-value" style="font-size: 1.1rem; font-weight: 600;">${escapeHtml(item.title)}</span>
                </div>
                ${imageHtml}
                <div class="detail-row">
                    <span class="detail-label">描述：</span>
                    <span class="detail-value" style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(item.description || '无描述')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">价格：</span>
                    <span class="detail-value price-value">${item.price ? '¥' + parseFloat(item.price).toFixed(2) : '免费'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">数量：</span>
                    <span class="detail-value">${item.quantity || 1}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">分类：</span>
                    <span class="detail-value">${categories[item.type] || '未知'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">状态：</span>
                    <span class="detail-value"><span class="status-badge status-${item.status}">${statusLabels[item.status] || '未知'}</span></span>
                </div>
                ${aiReviewHtml}
                <div class="detail-row">
                    <span class="detail-label">发布者：</span>
                    <span class="detail-value" id="detailUserName">用户ID: ${item.userId} (${userName})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">发布时间：</span>
                    <span class="detail-value">${formatDateTime(item.createTime)}</span>
                </div>
                ${item.updateTime ? `
                <div class="detail-row">
                    <span class="detail-label">更新时间：</span>
                    <span class="detail-value">${formatDateTime(item.updateTime)}</span>
                </div>
                ` : ''}
            </div>
            <div class="view-actions">
                <button class="btn-submit" onclick="closeViewModal(); editItem(${item.id});" style="background: #3b82f6;">✏️ 编辑此商品</button>
                ${item.status === 0 ? `
                    <button class="btn-submit" onclick="closeViewModal(); updateItemStatus(${item.id}, 1);" style="background: #10b981;">✓ 审核通过</button>
                    <button class="btn-submit" onclick="closeViewModal(); rejectItem(${item.id});" style="background: #ef4444;">✗ 下架商品</button>
                ` : ''}
                ${item.status === 1 ? `
                    <button class="btn-submit" onclick="closeViewModal(); offshelfItem(${item.id});" style="background: #f59e0b;">⬇ 下架商品</button>
                ` : ''}
                ${item.status === 2 ? `
                    <button class="btn-submit" onclick="closeViewModal(); restoreItem(${item.id});" style="background: #10b981;">↺ 恢复上架</button>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// 显示图片预览
function showImagePreview(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'imagePreviewModal';
    modal.style.zIndex = '10002'; // 图片预览最高层级
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; max-height: 90%; background: transparent; box-shadow: none;">
            <span class="close" onclick="closeImagePreview()" style="color: white; font-size: 2rem; position: fixed; top: 20px; right: 40px; z-index: 10003;">&times;</span>
            <img src="${imageUrl}" style="max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px;">
        </div>
    `;

    modal.onclick = function (e) {
        if (e.target === modal) {
            closeImagePreview();
        }
    };

    document.body.appendChild(modal);
}

// 关闭图片预览
function closeImagePreview() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) {
        modal.remove();
    }
}

// 关闭查看模态框
function closeViewModal() {
    const modal = document.getElementById('viewItemModal');
    if (modal) {
        modal.remove();
    }
}

// 全选/取消全选
function toggleSelectAll() {
    const selectAllCheckbox = $('selectAll');
    const checkboxes = document.querySelectorAll('.item-checkbox');

    if (selectAllCheckbox.checked) {
        filteredItems.forEach(item => selectedItems.add(item.id));
    } else {
        selectedItems.clear();
    }

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const itemId = parseInt(checkbox.dataset.id);
        if (selectAllCheckbox.checked) {
            selectedItems.add(itemId);
        } else {
            selectedItems.delete(itemId);
        }
    });

    updateBatchActions();
}


// 切换单个商品选择
function toggleItemSelection(itemId) {
    if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
    } else {
        selectedItems.add(itemId);
    }

    updateSelectAllCheckbox();
    updateBatchActions();
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const selectAllCheckbox = $('selectAll');
    const checkboxes = document.querySelectorAll('.item-checkbox');

    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        return;
    }

    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;
}

// 更新批量操作栏显示
function updateBatchActions() {
    const batchActions = $('batchActions');
    const selectedCount = $('selectedCount');
    const count = selectedItems.size;

    if (count > 0) {
        batchActions.style.display = 'flex';
        selectedCount.textContent = `已选择 ${count} 项`;

        // 根据选中商品的状态显示/隐藏对应按钮
        const selectedStatuses = new Set();
        selectedItems.forEach(id => {
            const item = allItems.find(i => i.id === id);
            if (item) selectedStatuses.add(item.status);
        });

        // 待审核商品才显示批量通过
        $('btnBatchApprove').style.display = selectedStatuses.has(0) ? 'inline-block' : 'none';

        // 已下架商品显示批量恢复
        $('btnBatchRestore').style.display = selectedStatuses.has(2) ? 'inline-block' : 'none';

        // 已通过和待审核商品显示批量下架
        $('btnBatchOffshelf').style.display = (selectedStatuses.has(0) || selectedStatuses.has(1)) ? 'inline-block' : 'none';

        // 所有状态都可以删除
        $('btnBatchDelete').style.display = 'inline-block';
    } else {
        batchActions.style.display = 'none';
    }
}

// 清空选择
function clearSelection() {
    selectedItems.clear();
    const selectAllCheckbox = $('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    renderTable();
    updateBatchActions();
}

// 批量审核通过
async function batchApprove() {
    if (selectedItems.size === 0) {
        showToast('请先选择商品', 'warning');
        return;
    }

    const pendingItems = Array.from(selectedItems).filter(id => {
        const item = allItems.find(i => i.id === id);
        return item && item.status === 0;
    });

    if (pendingItems.length === 0) {
        showToast('选中的商品中没有待审核的商品', 'warning');
        return;
    }

    showConfirm(
        '批量审核通过',
        `确定要批量通过 ${pendingItems.length} 个商品吗？\n\n通过后这些商品将显示在主页供用户浏览。`,
        async () => {
            let successCount = 0;
            let failCount = 0;

            for (const itemId of pendingItems) {
                try {
                    const headers = {};
                    if (currentAdmin) {
                        headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                    }

                    const res = await fetch(`/api/admin/item/approve/${itemId}`, {
                        method: 'PUT',
                        headers
                    });
                    const result = await res.json();

                    if (result.code === 200) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    console.error('审核失败:', err);
                    failCount++;
                }
            }

            showToast(`批量通过完成：成功 ${successCount} 个，失败 ${failCount} 个`,
                failCount === 0 ? 'success' : 'warning');

            clearSelection();
            loadItems();
        }
    );
}

// 批量下架
async function batchOffshelf() {
    if (selectedItems.size === 0) {
        showToast('请先选择商品', 'warning');
        return;
    }

    const offshelfItems = Array.from(selectedItems).filter(id => {
        const item = allItems.find(i => i.id === id);
        return item && (item.status === 0 || item.status === 1);
    });

    if (offshelfItems.length === 0) {
        showToast('选中的商品中没有可以下架的商品', 'warning');
        return;
    }

    showRejectDialogBatch(offshelfItems, async (reason) => {
        let successCount = 0;
        let failCount = 0;

        for (const itemId of offshelfItems) {
            try {
                // 获取商品信息
                const itemResponse = await fetch(`/api/item/${itemId}`);
                const itemResult = await itemResponse.json();

                if (itemResult.code !== 200 || !itemResult.data) {
                    failCount++;
                    continue;
                }

                const currentItem = itemResult.data;
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                }

                const res = await fetch(`/api/item/offshelf/${itemId}`, {
                    method: 'PUT',
                    headers
                });
                const result = await res.json();

                if (result.code === 200) {
                    // 发送通知
                    let notificationContent = `您的商品"${currentItem.title}"已被管理员批量下架。`;
                    if (reason && reason.trim()) {
                        notificationContent += `\n\n下架原因：${reason}`;
                    }

                    await sendSystemNotification(currentItem.userId, itemId, notificationContent);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error('下架失败:', err);
                failCount++;
            }
        }

        showToast(`批量下架完成：成功 ${successCount} 个，失败 ${failCount} 个`,
            failCount === 0 ? 'success' : 'warning');

        clearSelection();
        loadItems();
    });
}

// 批量恢复已下架商品
async function batchRestore() {
    if (selectedItems.size === 0) {
        showToast('请先选择商品', 'warning');
        return;
    }

    const restoreItems = Array.from(selectedItems).filter(id => {
        const item = allItems.find(i => i.id === id);
        return item && item.status === 2;
    });

    if (restoreItems.length === 0) {
        showToast('选中的商品中没有已下架的商品', 'warning');
        return;
    }

    showConfirm(
        '批量恢复',
        `确定要批量恢复 ${restoreItems.length} 个已下架的商品吗？\n\n恢复后这些商品将变为待审核状态，需要重新审核通过后才能显示在主页。`,
        async () => {
            let successCount = 0;
            let failCount = 0;

            for (const itemId of restoreItems) {
                try {
                    const headers = {};
                    if (currentAdmin) {
                        headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                    }

                    const res = await fetch(`/api/item/restore/${itemId}`, {
                        method: 'PUT',
                        headers
                    });
                    const result = await res.json();

                    if (result.code === 200) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    console.error('恢复失败:', err);
                    failCount++;
                }
            }

            showToast(`批量恢复完成：成功 ${successCount} 个，失败 ${failCount} 个`,
                failCount === 0 ? 'success' : 'warning');

            clearSelection();
            loadItems();
        }
    );
}

// 批量删除
async function batchDelete() {
    if (selectedItems.size === 0) {
        showToast('请先选择商品', 'warning');
        return;
    }

    showConfirm(
        '批量删除',
        `确定要批量删除 ${selectedItems.size} 个商品吗？\n\n此操作不可恢复！`,
        async () => {
            let successCount = 0;
            let failCount = 0;

            for (const itemId of Array.from(selectedItems)) {
                try {
                    const headers = {};
                    if (currentAdmin) {
                        headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                    }

                    const res = await fetch(`/api/item/delete/${itemId}`, {
                        method: 'DELETE',
                        headers
                    });
                    const result = await res.json();

                    if (result.code === 200) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    console.error('删除失败:', err);
                    failCount++;
                }
            }

            showToast(`批量删除完成：成功 ${successCount} 个，失败 ${failCount} 个`,
                failCount === 0 ? 'success' : 'warning');

            clearSelection();
            loadItems();
        },
        true
    );
}

// 显示批量下架原因输入对话框
function showRejectDialogBatch(itemIds, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'batchRejectModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="closeBatchRejectModal()">&times;</span>
            <h2>⚠️ 批量下架商品</h2>
            <p style="margin-bottom: 1rem; color: #1C1C1E; font-weight: 600;">共选择 ${itemIds.length} 个商品</p>
            <div class="form-group">
                <label>下架原因（选填）：</label>
                <textarea id="batchRejectReason" rows="4" placeholder="请输入下架原因，例如：图片不符合规范、描述不清晰等...（可不填）"></textarea>
            </div>
            <button class="btn-submit" onclick="submitBatchRejectReason()" style="background: #FF9500;">确认批量下架</button>
        </div>
    `;

    document.body.appendChild(modal);

    window.submitBatchRejectReason = function () {
        const reason = document.getElementById('batchRejectReason').value.trim();
        closeBatchRejectModal();
        callback(reason);
    };
}

// 关闭批量下架原因对话框
function closeBatchRejectModal() {
    const modal = document.getElementById('batchRejectModal');
    if (modal) {
        modal.remove();
    }
}

// AI 批量审核
async function aiBatchReview() {
    if (selectedItems.size === 0) {
        showToast('请先选择商品', 'warning');
        return;
    }

    showConfirm(
        'AI 批量审核',
        `确定要对选中的 ${selectedItems.size} 个商品进行 AI 审核吗？`,
        async () => {
            try {
                const headers = {};
                if (currentAdmin) {
                    headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
                    headers['Content-Type'] = 'application/json';
                }

                showToast('AI 正在审核中，请稍候...', 'info');

                const res = await fetch('/api/admin/ai/batch-review', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify(Array.from(selectedItems))
                });

                const result = await res.json();

                if (result.code === 200 && result.data) {
                    const stats = result.data.statistics;
                    let message = `AI 审核完成！\n\n`;
                    message += `总商品数：${stats.totalCount}\n`;
                    message += `建议通过：${stats.approveCount}\n`;
                    message += `建议复审：${stats.reviewCount}\n`;
                    message += `建议拒绝：${stats.rejectCount}`;

                    showToast(message, 'success');
                    loadItems();
                } else {
                    showToast(result.msg || 'AI 审核失败', 'error');
                }
            } catch (err) {
                console.error('AI 审核失败:', err);
                showToast('网络错误', 'error');
            }
        }
    );
}

// 显示 AI 审核详情
async function showAIReviewDetail(itemId) {
    try {
        const headers = {};
        if (currentAdmin) {
            headers['X-Admin-Auth'] = JSON.stringify(currentAdmin);
        }

        const response = await fetch(`/api/admin/ai/review/${itemId}`, {headers});
        const result = await response.json();

        if (result.code === 200 && result.data) {
            const reviewData = result.data;
            const score = reviewData.score;
            const recommendation = reviewData.recommendation;
            const warnings = reviewData.warnings || [];
            const suggestions = reviewData.suggestions || [];

            let scoreColor = score >= 80 ? '#34C759' : score >= 50 ? '#FF9500' : '#FF3B30';
            let recText = recommendation === 'approve' ? '建议通过' : recommendation === 'review' ? '建议复审' : '建议拒绝';

            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.id = 'aiReviewModal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    <h2>🤖 AI 审核详情</h2>
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f5f5f7; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600;">审核评分</span>
                            <span style="color: ${scoreColor}; font-size: 1.5rem; font-weight: 700;">${score}分</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600;">AI 建议</span>
                            <span style="color: ${scoreColor}; font-weight: 600;">${recText}</span>
                        </div>
                    </div>
                    ${warnings.length > 0 ? `
                        <div style="margin-bottom: 1rem;">
                            <h3 style="color: #FF3B30; margin-bottom: 0.5rem;">⚠️ 警告 (${warnings.length})</h3>
                            <ul style="list-style: none; padding: 0;">
                                ${warnings.map(w => `<li style="padding: 0.5rem; background: rgba(255, 59, 48, 0.1); border-radius: 8px; margin-bottom: 0.3rem;">${escapeHtml(w)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${suggestions.length > 0 ? `
                        <div>
                            <h3 style="color: #007AFF; margin-bottom: 0.5rem;">💡 建议 (${suggestions.length})</h3>
                            <ul style="list-style: none; padding: 0;">
                                ${suggestions.map(s => `<li style="padding: 0.5rem; background: rgba(0, 122, 255, 0.1); border-radius: 8px; margin-bottom: 0.3rem;">${escapeHtml(s)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;

            document.body.appendChild(modal);
        } else {
            showToast(result.msg || '获取 AI 审核结果失败', 'error');
        }
    } catch (err) {
        console.error('获取 AI 审核详情失败:', err);
        showToast('网络错误', 'error');
    }
}

function backToHome() {
    window.location.href = '/';
}
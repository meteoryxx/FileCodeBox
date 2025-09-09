// FileCodeBox 密码上传插件 - 控制台版本
// 直接复制到浏览器控制台运行

(function() {
    'use strict';
    
    if (window.FileCodeBoxPasswordAddon) {
        console.log('插件已经在运行中！');
        return;
    }
    
    window.FileCodeBoxPasswordAddon = true;
    
    // CSS 样式
    const styles = `
        .fcb-password-container {
            margin: 15px 0;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .fcb-password-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
        }
        .fcb-password-input {
            width: 100%;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            background: rgba(255,255,255,0.9);
            color: #333;
        }
        .fcb-password-input:focus {
            outline: none;
            background: white;
            box-shadow: 0 0 10px rgba(255,255,255,0.3);
        }
        .fcb-password-help {
            margin-top: 8px;
            font-size: 12px;
            opacity: 0.9;
        }
        .fcb-message {
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
        }
        .fcb-message.success {
            background: rgba(40, 167, 69, 0.8);
        }
        .fcb-message.error {
            background: rgba(220, 53, 69, 0.8);
        }
        .fcb-warning {
            margin: 10px 0;
            padding: 12px;
            background: #ff9800;
            color: white;
            border-radius: 5px;
            font-size: 13px;
            font-weight: 500;
        }
    `;
    
    // 添加样式
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    
    let isGuestUploadEnabled = true;
    let hasAddedField = false;
    
    // 获取配置
    async function getConfig() {
        try {
            const response = await fetch('/', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                return data.detail;
            }
        } catch (e) {
            console.warn('获取配置失败:', e);
        }
        return null;
    }
    
    // 创建密码输入框
    function createPasswordField() {
        const container = document.createElement('div');
        container.className = 'fcb-password-container';
        container.id = 'fcb-password-field';
        container.innerHTML = `
            <div class="fcb-warning">🔒 游客上传已关闭，需要管理员密码</div>
            <label class="fcb-password-label">管理员密码</label>
            <input type="password" id="fcb-password-input" class="fcb-password-input" 
                   placeholder="请输入管理员密码" autocomplete="off">
            <div class="fcb-password-help">默认密码：FileCodeBox2023</div>
        `;
        return container;
    }
    
    // 显示消息
    function showMessage(type, text) {
        const existing = document.querySelector('.fcb-message');
        if (existing) existing.remove();
        
        const container = document.getElementById('fcb-password-field');
        if (container) {
            const msg = document.createElement('div');
            msg.className = `fcb-message ${type}`;
            msg.textContent = text;
            container.appendChild(msg);
        }
    }
    
    // 添加密码字段
    function addPasswordField() {
        if (hasAddedField) return;
        
        // 尝试多种选择器
        const selectors = [
            '.upload', '.file-upload', '.uploader', '.el-upload',
            '[class*="upload"]', 'form', '.container', '.main'
        ];
        
        let target = null;
        for (const sel of selectors) {
            target = document.querySelector(sel);
            if (target) break;
        }
        
        if (!target) target = document.body;
        
        const passwordField = createPasswordField();
        if (target === document.body) {
            target.insertBefore(passwordField, target.firstChild);
        } else {
            target.insertBefore(passwordField, target.firstChild);
        }
        
        hasAddedField = true;
        console.log('✅ 密码输入框已添加');
    }
    
    // 移除密码字段
    function removePasswordField() {
        const field = document.getElementById('fcb-password-field');
        if (field) {
            field.remove();
            hasAddedField = false;
            console.log('❌ 密码输入框已移除');
        }
    }
    
    // 获取密码
    function getPassword() {
        const input = document.getElementById('fcb-password-input');
        return input ? input.value.trim() : '';
    }
    
    // 拦截 fetch
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        const isUpload = typeof url === 'string' && url.includes('/share/');
        
        if (isUpload && !isGuestUploadEnabled) {
            const password = getPassword();
            if (password) {
                if (url.includes('/chunk/')) {
                    if (!options.headers) options.headers = {};
                    options.headers['X-Admin-Password'] = password;
                } else if (options.body instanceof FormData) {
                    options.body.append('password', password);
                }
                console.log('🔐 已添加密码到请求');
            }
        }
        
        try {
            const response = await originalFetch(url, options);
            
            if (isUpload && !isGuestUploadEnabled) {
                if (response.ok) {
                    showMessage('success', '✅ 上传成功！');
                } else if (response.status === 401) {
                    showMessage('error', '❌ 密码错误');
                } else if (response.status === 403) {
                    showMessage('error', '❌ 权限不足');
                }
            }
            
            return response;
        } catch (error) {
            if (isUpload && !isGuestUploadEnabled) {
                showMessage('error', '❌ 网络错误');
            }
            throw error;
        }
    };
    
    // 检查状态
    async function checkStatus() {
        const config = await getConfig();
        if (config) {
            const newState = config.openUpload === 1;
            if (newState !== isGuestUploadEnabled) {
                isGuestUploadEnabled = newState;
                if (!isGuestUploadEnabled) {
                    addPasswordField();
                } else {
                    removePasswordField();
                }
            }
        }
    }
    
    // 初始化
    console.log('🚀 FileCodeBox 密码插件已启动');
    checkStatus();
    setInterval(checkStatus, 2000);
    
    // 监听页面变化
    if (window.MutationObserver) {
        const observer = new MutationObserver(() => {
            if (!hasAddedField && !isGuestUploadEnabled) {
                setTimeout(addPasswordField, 500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    console.log('✨ 插件加载完成！如果游客上传关闭，会自动显示密码输入框。');
    
})();
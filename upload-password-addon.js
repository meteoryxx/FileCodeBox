/**
 * FileCodeBox 上传密码插件
 * 当游客上传关闭时，自动添加密码输入框
 */
(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        checkInterval: 1000, // 检查页面状态的间隔（毫秒）
        apiUrl: '/', // 配置接口URL
        passwordFieldName: 'password', // 密码字段名
        headerPasswordName: 'X-Admin-Password' // 分块上传密码头名称
    };
    
    // 全局状态
    let isGuestUploadEnabled = true;
    let hasAddedPasswordField = false;
    
    // CSS 样式
    const styles = `
        .password-addon-container {
            margin: 10px 0;
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .password-addon-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #495057;
            font-size: 14px;
        }
        
        .password-addon-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        
        .password-addon-input:focus {
            outline: 0;
            border-color: #80bdff;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .password-addon-help {
            margin-top: 6px;
            font-size: 12px;
            color: #6c757d;
        }
        
        .password-addon-error {
            margin-top: 6px;
            font-size: 12px;
            color: #dc3545;
        }
        
        .password-addon-success {
            margin-top: 6px;
            font-size: 12px;
            color: #28a745;
        }
        
        .password-addon-warning {
            margin: 10px 0;
            padding: 10px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            color: #856404;
            font-size: 13px;
        }
    `;
    
    // 添加CSS样式到页面
    function addStyles() {
        if (document.getElementById('password-addon-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'password-addon-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
    
    // 获取系统配置
    async function getSystemConfig() {
        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.detail;
            }
        } catch (error) {
            console.warn('获取系统配置失败:', error);
        }
        return null;
    }
    
    // 创建密码输入框HTML
    function createPasswordField() {
        return `
            <div class="password-addon-container" id="password-addon-field">
                <label class="password-addon-label" for="admin-password-input">
                    管理员密码
                </label>
                <input 
                    type="password" 
                    id="admin-password-input" 
                    class="password-addon-input"
                    placeholder="请输入管理员密码以上传文件"
                    autocomplete="off"
                >
                <div class="password-addon-help">
                    本站未开启游客上传，需要管理员密码验证
                </div>
            </div>
        `;
    }
    
    // 创建警告信息
    function createWarningMessage() {
        return `
            <div class="password-addon-warning" id="password-addon-warning">
                ⚠️ 游客上传已关闭，需要输入管理员密码才能上传文件
            </div>
        `;
    }
    
    // 显示消息
    function showMessage(type, message) {
        const existingMsg = document.getElementById('password-addon-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        const passwordField = document.getElementById('password-addon-field');
        if (passwordField) {
            const msgDiv = document.createElement('div');
            msgDiv.id = 'password-addon-message';
            msgDiv.className = `password-addon-${type}`;
            msgDiv.textContent = message;
            passwordField.appendChild(msgDiv);
        }
    }
    
    // 添加密码字段到上传表单
    function addPasswordFieldToUploadForm() {
        if (hasAddedPasswordField) return;
        
        // 查找可能的上传容器
        const uploadSelectors = [
            '.upload-container',
            '.file-upload',
            '.upload-form',
            '[class*="upload"]',
            'form',
            '.el-upload',
            '.uploader'
        ];
        
        let uploadContainer = null;
        for (const selector of uploadSelectors) {
            uploadContainer = document.querySelector(selector);
            if (uploadContainer) break;
        }
        
        // 如果没找到特定容器，尝试在body中查找合适的位置
        if (!uploadContainer) {
            // 查找包含上传相关文本的元素
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                const text = element.textContent || '';
                if (text.includes('上传') || text.includes('拖拽') || text.includes('选择文件')) {
                    uploadContainer = element.closest('div') || element;
                    break;
                }
            }
        }
        
        if (uploadContainer) {
            // 添加警告信息
            const warningHtml = createWarningMessage();
            uploadContainer.insertAdjacentHTML('afterbegin', warningHtml);
            
            // 添加密码输入框
            const passwordHtml = createPasswordField();
            uploadContainer.insertAdjacentHTML('afterbegin', passwordHtml);
            
            hasAddedPasswordField = true;
            console.log('密码输入框已添加到上传区域');
        } else {
            // 如果找不到合适的容器，添加到body顶部
            const warningHtml = createWarningMessage();
            const passwordHtml = createPasswordField();
            document.body.insertAdjacentHTML('afterbegin', passwordHtml + warningHtml);
            hasAddedPasswordField = true;
            console.log('密码输入框已添加到页面顶部');
        }
    }
    
    // 移除密码字段
    function removePasswordField() {
        const passwordField = document.getElementById('password-addon-field');
        const warningField = document.getElementById('password-addon-warning');
        
        if (passwordField) {
            passwordField.remove();
        }
        if (warningField) {
            warningField.remove();
        }
        
        hasAddedPasswordField = false;
    }
    
    // 获取当前输入的密码
    function getCurrentPassword() {
        const passwordInput = document.getElementById('admin-password-input');
        return passwordInput ? passwordInput.value : '';
    }
    
    // 拦截并修改fetch请求
    function interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(url, options = {}) {
            // 检查是否是上传相关的API
            const isUploadApi = url.includes('/share/') && 
                              (url.includes('/text/') || url.includes('/file/') || url.includes('/chunk/'));
            
            if (isUploadApi && !isGuestUploadEnabled) {
                const password = getCurrentPassword();
                
                if (password) {
                    if (!options.headers) {
                        options.headers = {};
                    }
                    
                    // 对于分块上传，添加到头部
                    if (url.includes('/chunk/')) {
                        options.headers[CONFIG.headerPasswordName] = password;
                    } else {
                        // 对于普通上传，需要添加到FormData中
                        if (options.body instanceof FormData) {
                            options.body.append(CONFIG.passwordFieldName, password);
                        }
                    }
                    
                    console.log('已为上传请求添加密码验证');
                }
            }
            
            try {
                const response = await originalFetch(url, options);
                
                // 处理上传响应
                if (isUploadApi && !isGuestUploadEnabled) {
                    if (response.ok) {
                        showMessage('success', '上传成功！');
                    } else if (response.status === 401) {
                        showMessage('error', '密码错误，请检查后重试');
                    } else if (response.status === 403) {
                        showMessage('error', '权限不足，请输入正确的管理员密码');
                    }
                }
                
                return response;
            } catch (error) {
                if (isUploadApi && !isGuestUploadEnabled) {
                    showMessage('error', '网络错误，请稍后重试');
                }
                throw error;
            }
        };
    }
    
    // 拦截XMLHttpRequest
    function interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._url = url;
            return originalOpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            const isUploadApi = this._url && this._url.includes('/share/') && 
                              (this._url.includes('/text/') || this._url.includes('/file/') || this._url.includes('/chunk/'));
            
            if (isUploadApi && !isGuestUploadEnabled) {
                const password = getCurrentPassword();
                
                if (password) {
                    if (this._url.includes('/chunk/')) {
                        this.setRequestHeader(CONFIG.headerPasswordName, password);
                    } else if (data instanceof FormData) {
                        data.append(CONFIG.passwordFieldName, password);
                    }
                }
            }
            
            return originalSend.call(this, data);
        };
    }
    
    // 检查并更新UI状态
    async function checkAndUpdateUI() {
        const config = await getSystemConfig();
        
        if (config) {
            const newGuestUploadState = config.openUpload === 1;
            
            if (newGuestUploadState !== isGuestUploadEnabled) {
                isGuestUploadEnabled = newGuestUploadState;
                
                if (!isGuestUploadEnabled) {
                    // 游客上传关闭，添加密码字段
                    addPasswordFieldToUploadForm();
                } else {
                    // 游客上传开启，移除密码字段
                    removePasswordField();
                }
            }
        }
    }
    
    // 初始化
    function init() {
        console.log('FileCodeBox 上传密码插件已加载');
        
        // 添加样式
        addStyles();
        
        // 拦截网络请求
        interceptFetch();
        interceptXHR();
        
        // 初始检查
        checkAndUpdateUI();
        
        // 定期检查状态
        setInterval(checkAndUpdateUI, CONFIG.checkInterval);
        
        // 监听页面变化（SPA应用）
        if (window.MutationObserver) {
            const observer = new MutationObserver(() => {
                if (!hasAddedPasswordField && !isGuestUploadEnabled) {
                    setTimeout(addPasswordFieldToUploadForm, 500);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
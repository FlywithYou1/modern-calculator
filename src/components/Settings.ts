/**
 * 计算器设置面板组件
 * 提供主题切换、精度设置、功能配置等选项，支持导入导出和实时预览
 */

import type { AppSettings, Theme } from '../types/calculator.js';

export class Settings {
  private element: HTMLElement;
  private settings: AppSettings;
  private onSettingsChange?: (settings: AppSettings) => void;
  private isVisible: boolean = false;

  constructor(container: HTMLElement) {
    this.settings = this.getDefaultSettings();
    this.element = this.createElement();
    container.appendChild(this.element);
    this.setupEventListeners();
  }

  /**
   * 初始化组件
   */
  async init(): Promise<void> {
    await this.loadSettings();
    this.render();
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(): AppSettings {
    return {
      theme: {
        name: 'dark',
        mode: 'dark' as const,
        type: 'builtin' as const,
        colors: {
          primary: '#0066cc',
          secondary: '#004499',
          background: '#1a1a1a',
          surface: '#2d2d2d',
          text: '#ffffff',
          textSecondary: '#cccccc',
        },
        cssVariables: {
          '--primary-color': '#0066cc',
          '--secondary-color': '#004499',
          '--background-color': '#1a1a1a',
          '--surface-color': '#2d2d2d',
          '--text-color': '#ffffff',
          '--text-secondary-color': '#cccccc'
        },
      },
      display: {
        decimalPlaces: 10,
        scientificNotation: true,
        thousandSeparator: true,
        angleUnit: 'degrees',
        fontSize: 16,
      },
      layout: {
        buttonSize: 'medium',
        keyboardLayout: 'standard',
        compactMode: false,
        showHistory: true,
      },
      general: {
        enableHaptic: true,
        maxHistoryItems: 100,
        autoSaveHistory: true,
        enableKeyboardShortcuts: true,
        enableAnimations: true,
      },
    };
  }

  /**
   * 创建设置面板元素
   */
  private createElement(): HTMLElement {
    const settings = document.createElement('div');
    settings.className = 'calculator-settings';
    settings.setAttribute('role', 'dialog');
    settings.setAttribute('aria-label', '计算器设置');
    settings.style.display = 'none';
    return settings;
  }

  /**
   * 渲染设置面板
   */
  private render(): void {
    this.element.innerHTML = `
      <div class="settings-overlay">
        <div class="settings-panel">
          <div class="settings-header">
            <h2 class="settings-title">计算器设置</h2>
            <div class="settings-header-actions">
              <button class="settings-action-btn import-btn" aria-label="导入设置">
                <span class="icon-import">📁</span>
              </button>
              <button class="settings-action-btn export-btn" aria-label="导出设置">
                <span class="icon-export">💾</span>
              </button>
              <button class="settings-close-btn" aria-label="关闭设置">
                <span class="icon-close">✕</span>
              </button>
            </div>
          </div>
          
          <div class="settings-content">
            <div class="settings-tabs">
              <button class="settings-tab active" data-tab="theme">主题</button>
              <button class="settings-tab" data-tab="display">显示</button>
              <button class="settings-tab" data-tab="layout">布局</button>
              <button class="settings-tab" data-tab="general">通用</button>
              <button class="settings-tab" data-tab="advanced">高级</button>
            </div>
            
            <div class="settings-panels">
              <div class="settings-panel-content active" data-panel="theme">
                ${this.renderThemeSettings()}
              </div>
              
              <div class="settings-panel-content" data-panel="display">
                ${this.renderDisplaySettings()}
              </div>
              
              <div class="settings-panel-content" data-panel="layout">
                ${this.renderLayoutSettings()}
              </div>
              
              <div class="settings-panel-content" data-panel="general">
                ${this.renderGeneralSettings()}
              </div>
              
              <div class="settings-panel-content" data-panel="advanced">
                ${this.renderAdvancedSettings()}
              </div>
            </div>
          </div>
          
          <div class="settings-footer">
            <button class="settings-btn secondary reset-btn">重置为默认</button>
            <div class="settings-footer-actions">
              <button class="settings-btn secondary cancel-btn">取消</button>
              <button class="settings-btn primary save-btn">保存设置</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染主题设置
   */
  private renderThemeSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">主题模式</h3>
        
        <div class="theme-mode-selector">
          <div class="radio-group">
            <label class="radio-option ${this.settings.theme.mode === 'light' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="light" ${this.settings.theme.mode === 'light' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview light-preview"></div>
                <span>浅色模式</span>
              </div>
            </label>
            
            <label class="radio-option ${this.settings.theme.mode === 'dark' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="dark" ${this.settings.theme.mode === 'dark' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview dark-preview"></div>
                <span>深色模式</span>
              </div>
            </label>
            
            <label class="radio-option ${this.settings.theme.mode === 'auto' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="auto" ${this.settings.theme.mode === 'auto' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview auto-preview"></div>
                <span>跟随系统</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">自定义颜色</h3>
        
        <div class="color-settings">
          <div class="color-setting">
            <label for="primary-color">主要颜色</label>
            <div class="color-input-group">
              <input type="color" id="primary-color" value="${this.settings.theme.colors.primary}" data-setting="theme.colors.primary">
              <input type="text" class="color-text" value="${this.settings.theme.colors.primary}" data-setting="theme.colors.primary">
            </div>
          </div>
          
          <div class="color-setting">
            <label for="secondary-color">次要颜色</label>
            <div class="color-input-group">
              <input type="color" id="secondary-color" value="${this.settings.theme.colors.secondary}" data-setting="theme.colors.secondary">
              <input type="text" class="color-text" value="${this.settings.theme.colors.secondary}" data-setting="theme.colors.secondary">
            </div>
          </div>
          
          <div class="color-setting">
            <label for="accent-color">强调颜色</label>
            <div class="color-input-group">
              <input type="color" id="accent-color" value="${this.settings.theme.colors.accent || '#ff6b35'}" data-setting="theme.colors.accent">
              <input type="text" class="color-text" value="${this.settings.theme.colors.accent || '#ff6b35'}" data-setting="theme.colors.accent">
            </div>
          </div>
        </div>

        <div class="theme-presets">
          <h4>预设主题</h4>
          <div class="preset-grid">
            <button class="preset-btn" data-preset="default">默认</button>
            <button class="preset-btn" data-preset="ocean">海洋蓝</button>
            <button class="preset-btn" data-preset="forest">森林绿</button>
            <button class="preset-btn" data-preset="sunset">日落橙</button>
            <button class="preset-btn" data-preset="purple">紫罗兰</button>
            <button class="preset-btn" data-preset="gold">金色</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染显示设置
   */
  private renderDisplaySettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">数值显示</h3>
        
        <div class="setting-item">
          <label for="decimal-places">小数位数</label>
          <div class="number-input-group">
            <input type="range" id="decimal-places" min="0" max="20" value="${this.settings.display.decimalPlaces}" data-setting="display.decimalPlaces">
            <span class="number-value">${this.settings.display.decimalPlaces}</span>
          </div>
        </div>
        
        <div class="setting-item">
          <label for="angle-unit">角度单位</label>
          <select id="angle-unit" data-setting="display.angleUnit">
            <option value="degrees" ${this.settings.display.angleUnit === 'degrees' ? 'selected' : ''}>度 (°)</option>
            <option value="radians" ${this.settings.display.angleUnit === 'radians' ? 'selected' : ''}>弧度 (rad)</option>
          </select>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="scientific-notation" ${this.settings.display.scientificNotation ? 'checked' : ''} data-setting="display.scientificNotation">
            <span class="checkmark"></span>
            <span class="label-text">使用科学记数法</span>
          </label>
          <div class="setting-description">当数值过大或过小时自动使用科学记数法</div>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="thousands-separator" ${this.settings.display.thousandSeparator ? 'checked' : ''} data-setting="display.thousandSeparator">
            <span class="checkmark"></span>
            <span class="label-text">千位分隔符</span>
          </label>
          <div class="setting-description">使用逗号分隔千位数字</div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">字体设置</h3>
        
        <div class="setting-item">
          <label for="font-size">字体大小</label>
          <div class="number-input-group">
            <input type="range" id="font-size" min="12" max="32" step="2" value="${this.settings.display.fontSize}" data-setting="display.fontSize">
            <span class="number-value">${this.settings.display.fontSize}px</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染布局设置
   */
  private renderLayoutSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">键盘布局</h3>
        
        <div class="setting-item">
          <label for="keyboard-layout">布局类型</label>
          <select id="keyboard-layout" data-setting="layout.keyboardLayout">
            <option value="standard" ${this.settings.layout.keyboardLayout === 'standard' ? 'selected' : ''}>标准计算器</option>
            <option value="scientific" ${this.settings.layout.keyboardLayout === 'scientific' ? 'selected' : ''}>科学计算器</option>
            <option value="programmer" ${this.settings.layout.keyboardLayout === 'programmer' ? 'selected' : ''}>程序员计算器</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="button-size">按钮大小</label>
          <div class="radio-group horizontal">
            <label class="radio-option">
              <input type="radio" name="button-size" value="small" ${this.settings.layout.buttonSize === 'small' ? 'checked' : ''} data-setting="layout.buttonSize">
              <span>小</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="button-size" value="medium" ${this.settings.layout.buttonSize === 'medium' ? 'checked' : ''} data-setting="layout.buttonSize">
              <span>中</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="button-size" value="large" ${this.settings.layout.buttonSize === 'large' ? 'checked' : ''} data-setting="layout.buttonSize">
              <span>大</span>
            </label>
          </div>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="compact-mode" ${this.settings.layout.compactMode ? 'checked' : ''} data-setting="layout.compactMode">
            <span class="checkmark"></span>
            <span class="label-text">紧凑模式</span>
          </label>
          <div class="setting-description">减少界面间距和边距</div>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="show-history" ${this.settings.layout.showHistory ? 'checked' : ''} data-setting="layout.showHistory">
            <span class="checkmark"></span>
            <span class="label-text">显示历史记录按钮</span>
          </label>
          <div class="setting-description">在界面上显示历史记录访问按钮</div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染通用设置
   */
  private renderGeneralSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">交互体验</h3>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-haptic" ${this.settings.general.enableHaptic ? 'checked' : ''} data-setting="general.enableHaptic">
            <span class="checkmark"></span>
            <span class="label-text">触觉反馈</span>
          </label>
          <div class="setting-description">按钮点击时提供震动反馈（移动设备）</div>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-animations" ${this.settings.general.enableAnimations ? 'checked' : ''} data-setting="general.enableAnimations">
            <span class="checkmark"></span>
            <span class="label-text">界面动画</span>
          </label>
          <div class="setting-description">启用按钮点击和界面切换动画</div>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-shortcuts" ${this.settings.general.enableKeyboardShortcuts ? 'checked' : ''} data-setting="general.enableKeyboardShortcuts">
            <span class="checkmark"></span>
            <span class="label-text">键盘快捷键</span>
          </label>
          <div class="setting-description">支持键盘数字键和运算符快捷输入</div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">历史记录</h3>
        
        <div class="setting-item">
          <label for="max-history">最大记录数</label>
          <div class="number-input-group">
            <input type="range" id="max-history" min="10" max="1000" step="10" value="${this.settings.general.maxHistoryItems}" data-setting="general.maxHistoryItems">
            <span class="number-value">${this.settings.general.maxHistoryItems}</span>
          </div>
        </div>
        
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="auto-save-history" ${this.settings.general.autoSaveHistory ? 'checked' : ''} data-setting="general.autoSaveHistory">
            <span class="checkmark"></span>
            <span class="label-text">自动保存历史</span>
          </label>
          <div class="setting-description">应用关闭时自动保存计算历史记录</div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染高级设置
   */
  private renderAdvancedSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">数据管理</h3>
        
        <div class="setting-item">
          <label>设置管理</label>
          <div class="action-buttons">
            <button class="action-btn import-settings-btn">
              <span class="icon">📁</span>
              导入设置文件
            </button>
            <button class="action-btn export-settings-btn">
              <span class="icon">💾</span>
              导出设置文件
            </button>
          </div>
        </div>
        
        <div class="setting-item">
          <label>历史记录管理</label>
          <div class="action-buttons">
            <button class="action-btn export-history-btn">
              <span class="icon">📊</span>
              导出历史记录
            </button>
            <button class="action-btn clear-history-btn danger">
              <span class="icon">🗑️</span>
              清空历史记录
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label>缓存管理</label>
          <div class="action-buttons">
            <button class="action-btn clear-cache-btn">
              <span class="icon">🧹</span>
              清除应用缓存
            </button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">关于应用</h3>
        
        <div class="about-info">
          <div class="info-item">
            <span class="info-label">版本号</span>
            <span class="info-value">1.0.0</span>
          </div>
          <div class="info-item">
            <span class="info-label">构建日期</span>
            <span class="info-value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">技术栈</span>
            <span class="info-value">Tauri + TypeScript + Rust</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 关闭按钮
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.closest('.settings-close-btn') || target.closest('.cancel-btn')) {
        this.hide();
      } else if (target.closest('.save-btn')) {
        this.saveSettings();
      } else if (target.closest('.reset-btn')) {
        this.confirmReset();
      } else if (target.closest('.settings-overlay') && !target.closest('.settings-panel')) {
        this.hide();
      }
    });

    // 标签切换
    this.element.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).closest('.settings-tab') as HTMLElement;
      if (tab) {
        this.switchTab(tab.dataset.tab || 'theme');
      }
    });

    // 设置变更
    this.element.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const settingPath = target.getAttribute('data-setting');
      
      if (settingPath) {
        this.updateSetting(settingPath, target);
      }
    });

    // 实时预览（滑块）
    this.element.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      
      if (target.type === 'range') {
        const valueSpan = target.parentElement?.querySelector('.number-value') as HTMLElement;
        if (valueSpan) {
          const unit = target.id === 'font-size' ? 'px' : '';
          valueSpan.textContent = target.value + unit;
        }
        
        const settingPath = target.getAttribute('data-setting');
        if (settingPath) {
          this.updateSetting(settingPath, target);
        }
      }
    });

    // 颜色输入同步
    this.element.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      
      if (target.type === 'color' || target.classList.contains('color-text')) {
        const group = target.closest('.color-input-group');
        if (group) {
          const colorInput = group.querySelector('input[type="color"]') as HTMLInputElement;
          const textInput = group.querySelector('.color-text') as HTMLInputElement;
          
          if (target.type === 'color') {
            textInput.value = target.value;
          } else {
            colorInput.value = target.value;
          }
          
          const settingPath = target.getAttribute('data-setting');
          if (settingPath) {
            this.updateSetting(settingPath, target);
          }
        }
      }
    });

    // 键盘快捷键
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveSettings();
      }
    });
  }

  /**
   * 切换标签
   */
  private switchTab(tabName: string): void {
    // 更新标签状态
    const tabs = this.element.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // 更新面板显示
    const panels = this.element.querySelectorAll('.settings-panel-content');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-panel') === tabName);
    });
  }

  /**
   * 更新设置值
   */
  private updateSetting(path: string, element: HTMLInputElement | HTMLSelectElement): void {
    const pathParts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = this.settings;

    // 导航到父对象
    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i];
      if (key) {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }

    // 设置值
    const finalKey = pathParts[pathParts.length - 1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = element.value;

    if (element.type === 'checkbox') {
      value = (element as HTMLInputElement).checked;
    } else if (element.type === 'number' || element.type === 'range') {
      value = parseInt(element.value);
    }

    if (finalKey) {
      current[finalKey] = value;
    }

    // 实时应用某些设置
    if (path.startsWith('theme.')) {
      this.applyThemePreview();
    }
  }

  /**
   * 应用主题预览
   */
  private applyThemePreview(): void {
    if (this.onSettingsChange) {
      this.onSettingsChange(this.settings);
    }
  }

  /**
   * 保存设置
   */
  private async saveSettings(): Promise<void> {
    try {
      // 这里可以调用 Tauri 命令保存设置
      // await invoke('save_app_settings', { settings: this.settings });
      
      if (this.onSettingsChange) {
        this.onSettingsChange(this.settings);
      }
      
      this.showToast('设置已保存', 'success');
      this.hide();
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showToast('保存失败', 'error');
    }
  }

  /**
   * 确认重置设置
   */
  private confirmReset(): void {
    if (confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {
      this.resetSettings();
    }
  }

  /**
   * 重置设置
   */
  private resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.render();
    this.showToast('设置已重置', 'info');
  }

  /**
   * 加载设置
   */
  private async loadSettings(): Promise<void> {
    try {
      // 这里可以调用 Tauri 命令加载设置
      // const settings = await invoke('get_app_settings');
      // this.settings = { ...this.getDefaultSettings(), ...settings };
    } catch (error) {
      console.warn('加载设置失败，使用默认设置:', error);
    }
  }

  /**
   * 显示设置面板
   */
  show(): void {
    this.isVisible = true;
    this.element.style.display = 'flex';
    setTimeout(() => {
      this.element.classList.add('visible');
    }, 10);
    
    // 聚焦到关闭按钮
    const closeBtn = this.element.querySelector('.settings-close-btn') as HTMLElement;
    closeBtn?.focus();
  }

  /**
   * 隐藏设置面板
   */
  hide(): void {
    this.isVisible = false;
    this.element.classList.remove('visible');
    setTimeout(() => {
      if (!this.isVisible) {
        this.element.style.display = 'none';
      }
    }, 300);
  }

  /**
   * 设置变更回调
   */
  onSettingsChanged(callback: (settings: AppSettings) => void): void {
    this.onSettingsChange = callback;
  }

  /**
   * 获取当前设置
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(newSettings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.render();
  }

  /**
   * 更新主题
   */
  updateTheme(theme: Theme): void {
    this.element.className = `calculator-settings theme-${theme.mode}`;
    
    // 应用主题颜色
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value);
    });
  }

  /**
   * 显示提示消息
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);
    
    // 动画显示
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 自动移除
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

//! 现代化跨平台科学计算器 - 后端 Rust 计算引擎
//! 
//! Tauri 计算器应用后端 - 支持桌面端(Windows/macOS/Linux)和移动端(Android)
//! 
//! 提供高精度数学计算、历史记录管理、设置存储等功能

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;
use serde::{Deserialize, Serialize};

// 模块声明
pub mod math;
pub mod parser;
pub mod history;
pub mod settings;
pub mod commands;
pub mod mcp;

/// 计算结果类型
#[derive(Debug, Serialize, Deserialize)]
pub struct CalculationResult {
    pub success: bool,
    pub result: Option<String>,
    pub error: Option<String>,
    pub warnings: Option<Vec<String>>,
}

/// 历史记录项类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub expression: String,
    pub result: String,
    pub timestamp: String, // 改为字符串以兼容 v1.x
    pub tags: Option<Vec<String>>,
}

/// 应用状态
#[derive(Debug)]
pub struct AppState {
    pub calculation_count: Arc<Mutex<u64>>,
    pub calculator: Arc<Mutex<math::Calculator>>,
    pub history_manager: Arc<Mutex<history::HistoryManager>>,
    pub settings_manager: Arc<Mutex<settings::SettingsManager>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            calculation_count: Arc::new(Mutex::new(0)),
            calculator: Arc::new(Mutex::new(math::Calculator::default())),
            history_manager: Arc::new(Mutex::new(history::HistoryManager::default())),
            settings_manager: Arc::new(Mutex::new(settings::SettingsManager::default())),
        }
    }
}

/// Tauri 应用入口点 - 支持桌面和移动端
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 注入全局状态
        .manage(AppState::default())
        // 注册命令
        .invoke_handler(tauri::generate_handler![
            commands::calculate,
            commands::get_history,
            commands::save_history,
            commands::get_settings,
            commands::save_settings,
            commands::export_history,
            commands::import_history,
            commands::clear_history,
            commands::update_history_item,
            commands::search_history,
            commands::get_history_stats,
            commands::set_theme,
            commands::add_custom_theme,
            commands::remove_custom_theme,
            commands::get_available_themes,
            commands::update_display_settings,
            commands::update_layout_settings,
            commands::reset_settings,
            commands::get_mcp_performance_stats,
            commands::set_mcp_debugging,
            commands::convert_base,
            commands::calculate_statistics,
            commands::calculate_complex,
            commands::matrix_operation,
            commands::convert_units,
        ])
        // 应用设置
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                log::info!("🚀 科学计算器后端服务已启动 - 支持桌面端和移动端");
                // 初始化 MCP 调试器
                mcp::init_mcp_debugger();
                log::info!("🔧 MCP 调试器已启用");
            }

            // 初始化应用数据目录
            let data_dir = app.path().app_data_dir().ok();
            if let Some(dir) = &data_dir {
                let _ = std::fs::create_dir_all(dir);
            }

            // 加载持久化的设置与历史记录
            if let Some(state) = app.try_state::<AppState>() {
                // 加载设置
                if let Some(dir) = &data_dir {
                    let settings_path = dir.join("settings.json");
                    if settings_path.exists() {
                        if let Ok(json) = std::fs::read_to_string(&settings_path) {
                            if let Ok(mut settings) = state.settings_manager.try_lock() {
                                let _ = settings.import_from_json(&json);
                            }
                        }
                    }

                    // 加载历史记录
                    let history_path = dir.join("history.json");
                    if history_path.exists() {
                        if let Ok(mut history) = state.history_manager.try_lock() {
                            let _ = history.import_from_path(&history_path);
                        }
                    }
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用时发生错误");
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal::Decimal;
    use std::str::FromStr;

    #[test]
    fn test_calculation_result_serialization() {
        let result = CalculationResult {
            success: true,
            result: Some("42".to_string()),
            error: None,
            warnings: None,
        };

        let serialized = serde_json::to_string(&result).unwrap();
        let deserialized: CalculationResult = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(result.success, deserialized.success);
        assert_eq!(result.result, deserialized.result);
    }

    #[test]
    fn test_high_precision_decimal() {
        // 测试高精度小数计算
        let a = Decimal::from_str("0.1").unwrap();
        let b = Decimal::from_str("0.2").unwrap();
        let sum = a + b;
        let expected = Decimal::from_str("0.3").unwrap();
        
        assert_eq!(sum, expected);
    }
}
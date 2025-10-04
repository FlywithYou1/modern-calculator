// ! Tauri 命令处理模块
// !
// ! 提供前端与后端交互的命令接口

use tauri::{State, Manager, Wry};
use serde_json::{json, Value};
use std::collections::HashMap;
use rust_decimal::prelude::ToPrimitive;

use crate::{AppState, CalculationResult, HistoryItem};

type AppHandle = tauri::AppHandle<Wry>;

// / 执行数学计算
#[tauri::command]
pub async fn calculate(
    expression: String,
    display_expression: Option<String>,
    state: State<'_, AppState>,
) -> Result<CalculationResult, String> {
    let start_time = std::time::Instant::now();
    let display_expression = display_expression.unwrap_or_else(|| expression.clone());
    
    // 增加计算次数
    {
        let mut count = state.calculation_count.lock().await;
        *count += 1;
    }

    // 克隆 计算器 (calculator) 以避免跨 await 持有锁
    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    // MCP调试：记录计算开始
    #[cfg(debug_assertions)]
    {
        let debugger = crate::mcp::get_mcp_debugger();
        debugger.track_state_change(&display_expression, "计算中...", "0", None);
    }

    // 执行计算
    let calculation_result = match crate::parser::parse_and_evaluate(&expression, &calculator).await {
        Ok(result) => {
            let result_str = result.to_string();
            let execution_time = start_time.elapsed().as_millis() as f64;
            
            // MCP调试：记录成功的计算
            #[cfg(debug_assertions)]
            {
                let debugger = crate::mcp::get_mcp_debugger();
                debugger.track_calculation_execution(&display_expression, &result_str, execution_time, 0);
                debugger.track_state_change(&display_expression, &result_str, "0", None);
            }
            
            CalculationResult {
                success: true,
                result: Some(result_str),
                error: None,
                warnings: None,
            }
        },
        Err(e) => {
            let error_msg = format!("计算错误: {}", e);
            
            // MCP调试：记录计算错误
            #[cfg(debug_assertions)]
            {
                let debugger = crate::mcp::get_mcp_debugger();
                let mut context = std::collections::HashMap::new();
                context.insert("expression".to_string(), display_expression.clone());
                context.insert("error_type".to_string(), format!("{:?}", e));
                debugger.track_error("CalculationError", &error_msg, context);
                debugger.track_state_change(&display_expression, "错误", "0", Some(&error_msg));
            }
            
            CalculationResult {
                success: false,
                result: None,
                error: Some(error_msg),
                warnings: None,
            }
        },
    };

    // 如果计算成功，保存到历史记录
    if calculation_result.success {
        if let Some(ref result_value) = calculation_result.result {
            let mut history = state.history_manager.lock().await;
            let metadata = if display_expression != expression {
                Some(json!({ "normalizedExpression": expression }))
            } else {
                None
            };

            let history_item = HistoryItem {
                id: uuid::Uuid::new_v4().to_string(),
                expression: display_expression,
                result: result_value.clone(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                tags: None,
                notes: None,
                metadata,
                source: Some("calculator".to_string()),
            };
            history.add_item(history_item);
        }
    }
    
    Ok(calculation_result)
}

// / 获取历史记录
#[tauri::command]
pub async fn get_history(
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<HistoryItem>, String> {
    let history_manager = state.history_manager.lock().await;
    Ok(history_manager.get_recent_items(limit.unwrap_or(100)))
}

// / 保存历史记录到存储
#[tauri::command]
pub async fn save_history(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))
        .map(|p| p.join("history.json"))?;
    let history_manager = state.history_manager.lock().await;
    history_manager
        .export_to_path(path)
        .map_err(|e| format!("保存历史记录失败: {}", e))
}

// / 获取应用设置
#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let settings_manager = state.settings_manager.lock().await;
    let s = settings_manager.get_settings();

    // 将 Rust 设置映射为前端期望的 camelCase 结构与小写枚举
    let theme_mode = match &s.theme.mode {
        crate::settings::ThemeMode::Light => "light",
        crate::settings::ThemeMode::Dark => "dark",
        crate::settings::ThemeMode::Auto => "auto",
        crate::settings::ThemeMode::Custom(_name) => "dark", // 自定义暂时映射为 dark
    };

    let angle_unit = match &s.display.angle_unit {
        crate::settings::AngleUnit::Degrees => "degrees",
        crate::settings::AngleUnit::Radians => "radians",
        crate::settings::AngleUnit::Gradians => "gradians",
    };

    let value = serde_json::json!({
        "theme": {
            "name": s.theme.name,
            "mode": theme_mode,
        },
        "display": {
            "decimalPlaces": s.display.decimal_places,
            "scientificNotation": matches!(s.display.number_format, crate::settings::NumberFormat::Scientific),
            "thousandsSeparator": s.display.thousands_separator,
            "angleUnit": angle_unit,
        },
        "general": {
            "enableHaptic": s.general.enable_haptic_feedback,
            "maxHistoryItems": s.general.max_history_items,
            "autoSave": s.general.auto_save_history,
            "enableKeyboardShortcuts": s.general.enable_keyboard_shortcuts,
            // 后端没有直接的动画开关，这里沿用声音开关的反义作为占位，前端仍保留自身控制
            "enableAnimations": true
        },
        "layout": {
            "compactMode": s.layout.compact_mode,
            "showHistory": s.layout.show_history_panel,
            "showMemory": s.layout.show_memory_panel,
        }
    });

    Ok(value)
}

// / 保存应用设置
#[tauri::command]
pub async fn save_settings(
    settings: Value,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut settings_manager = state.settings_manager.lock().await;
    settings_manager
        .update_from_json(&settings.to_string())
        .map_err(|e| format!("设置保存失败: {}", e))?;

    // 持久化到磁盘
    let settings_path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))
        .map(|p| p.join("settings.json"))?;
    let json = settings_manager
        .export_to_json()
        .map_err(|e| format!("导出设置失败: {}", e))?;
    std::fs::create_dir_all(settings_path.parent().unwrap())
        .map_err(|e| format!("创建设置目录失败: {}", e))?;
    std::fs::write(settings_path, json).map_err(|e| format!("写入设置文件失败: {}", e))
}

// / 其他简化的命令
#[tauri::command]
pub async fn export_history(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let history_manager = state.history_manager.lock().await;
    history_manager.export_to_json()
        .map_err(|e| format!("导出失败: {}", e))
}

#[tauri::command]
pub async fn import_history(
    json_data: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut history_manager = state.history_manager.lock().await;
    history_manager.import_from_json(&json_data)
        .map_err(|e| format!("导入失败: {}", e))
}

#[tauri::command]
pub async fn clear_history(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut history_manager = state.history_manager.lock().await;
    history_manager.clear();
    Ok(())
}

#[tauri::command]
pub async fn record_history_entry(
    expression: String,
    result: String,
    tags: Option<Vec<String>>,
    notes: Option<String>,
    metadata: Option<Value>,
    source: Option<String>,
    state: State<'_, AppState>,
) -> Result<HistoryItem, String> {
    let mut history_manager = state.history_manager.lock().await;
    let history_item = HistoryItem {
        id: uuid::Uuid::new_v4().to_string(),
        expression,
        result,
        timestamp: chrono::Utc::now().to_rfc3339(),
        tags,
        notes,
        metadata,
        source,
    };
    history_manager.add_item(history_item.clone());
    Ok(history_item)
}

#[tauri::command]
pub async fn update_history_item(
    id: String,
    tags: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut history_manager = state.history_manager.lock().await;
    history_manager.update_item_tags(&id, tags)
        .map_err(|e| format!("更新失败: {}", e))
}

#[tauri::command]
pub async fn search_history(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<HistoryItem>, String> {
    let history_manager = state.history_manager.lock().await;
    Ok(history_manager.search(&query))
}

#[tauri::command]
pub async fn get_history_stats(
    state: State<'_, AppState>,
) -> Result<HashMap<String, u32>, String> {
    let history_manager = state.history_manager.lock().await;
    Ok(history_manager.get_stats())
}

#[tauri::command]
pub async fn set_theme(
    _theme_name: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn add_custom_theme(
    _theme_name: String,
    _theme_data: Value,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn remove_custom_theme(
    _theme_name: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn get_available_themes(
    _state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    Ok(vec!["light".to_string(), "dark".to_string()])
}

#[tauri::command]
pub async fn update_display_settings(
    _settings: Value,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn update_layout_settings(
    _settings: Value,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn reset_settings(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut settings_manager = state.settings_manager.lock().await;
    settings_manager.reset_to_defaults();

    // 覆盖保存默认设置
    let settings_path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?
        .join("settings.json");
    let json = settings_manager
        .export_to_json()
        .map_err(|e| format!("导出设置失败: {}", e))?;
    if let Some(parent) = settings_path.parent() { let _ = std::fs::create_dir_all(parent); }
    std::fs::write(settings_path, json).map_err(|e| format!("写入设置文件失败: {}", e))
}

// / MCP调试相关命令

// / 获取MCP调试性能统计
#[tauri::command]
pub async fn get_mcp_performance_stats() -> Result<Value, String> {
    #[cfg(debug_assertions)]
    {
        let debugger = crate::mcp::get_mcp_debugger();
        if let Some(stats) = debugger.get_performance_summary() {
            Ok(serde_json::json!({
                "totalCalculations": stats.total_calculations,
                "totalCalculationTimeMs": stats.total_calculation_time_ms,
                "peakMemoryUsageMb": stats.peak_memory_usage_mb,
                "errorCount": stats.error_count,
                "lastUpdate": stats.last_update,
                "averageCalculationTimeMs": if stats.total_calculations > 0 {
                    stats.total_calculation_time_ms / stats.total_calculations as f64
                } else {
                    0.0
                }
            }))
        } else {
            Ok(serde_json::json!({}))
        }
    }
    #[cfg(not(debug_assertions))]
    {
        Err("MCP调试功能仅在调试模式下可用".to_string())
    }
}

// / 启用/禁用MCP调试
#[tauri::command]
pub async fn set_mcp_debugging(enabled: bool) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        // 注意：由于 MCPDebugger 使用静态实例，我们无法直接修改
        // 这里返回当前状态信息
        if enabled {
            Ok(())
        } else {
            Err("MCP调试器无法在运行时禁用".to_string())
        }
    }
    #[cfg(not(debug_assertions))]
    {
        Err("MCP调试功能仅在调试模式下可用".to_string())
    }
}

// / 进制转换命令
#[tauri::command]
pub async fn convert_base(
    number: String,
    from_base: u32,
    to_base: u32,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    // 先从源进制转换为十进制
    let decimal_value = calculator.from_base(&number, from_base)
        .map_err(|e| format!("转换失败: {}", e))?;

    // 再从十进制转换为目标进制
    calculator.to_base(decimal_value, to_base)
        .map_err(|e| format!("转换失败: {}", e))
}

// / 统计计算命令
#[tauri::command]
pub async fn calculate_statistics(
    values: Vec<f64>,
    operation: String,
    state: State<'_, AppState>,
) -> Result<f64, String> {
    if values.is_empty() {
        return Err("数据集不能为空".to_string());
    }

    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    // 转换为Decimal类型
    let decimal_values: Result<Vec<rust_decimal::Decimal>, _> = values.iter()
        .map(|&v| rust_decimal::Decimal::try_from(v))
        .collect();

    let decimal_values = decimal_values.map_err(|e| format!("数值转换失败: {}", e))?;

    let result = match operation.as_str() {
        "mean" | "avg" => calculator.mean(&decimal_values),
        "median" => calculator.median(&decimal_values),
        "variance" | "var" => calculator.variance(&decimal_values),
        "stdev" | "std" => calculator.standard_deviation(&decimal_values),
        "min" => calculator.min(&decimal_values),
        "max" => calculator.max(&decimal_values),
        "sum" => calculator.sum(&decimal_values),
        "product" => calculator.product(&decimal_values),
        "range" => calculator.range(&decimal_values),
        _ => return Err(format!("未知的统计操作: {}", operation)),
    };

    result.map_err(|e| format!("计算失败: {}", e))
        .and_then(|decimal| decimal.to_f64().ok_or("结果转换失败".to_string()))
}

// / 复数运算命令
#[tauri::command]
pub async fn calculate_complex(
    a_real: f64,
    a_imag: f64,
    b_real: f64,
    b_imag: f64,
    operation: String,
    state: State<'_, AppState>,
) -> Result<(f64, f64), String> {
    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    // 转换为Decimal类型
    let a_real_dec = rust_decimal::Decimal::try_from(a_real).map_err(|e| format!("数值转换失败: {}", e))?;
    let a_imag_dec = rust_decimal::Decimal::try_from(a_imag).map_err(|e| format!("数值转换失败: {}", e))?;
    let b_real_dec = rust_decimal::Decimal::try_from(b_real).map_err(|e| format!("数值转换失败: {}", e))?;
    let b_imag_dec = rust_decimal::Decimal::try_from(b_imag).map_err(|e| format!("数值转换失败: {}", e))?;

    let result = match operation.as_str() {
        "add" => calculator.complex_add(a_real_dec, a_imag_dec, b_real_dec, b_imag_dec),
        "subtract" => calculator.complex_subtract(a_real_dec, a_imag_dec, b_real_dec, b_imag_dec),
        "multiply" => calculator.complex_multiply(a_real_dec, a_imag_dec, b_real_dec, b_imag_dec),
        "divide" => calculator.complex_divide(a_real_dec, a_imag_dec, b_real_dec, b_imag_dec),
        _ => return Err(format!("未知的复数操作: {}", operation)),
    };

    result.map_err(|e| format!("计算失败: {}", e))
        .and_then(|(real, imag)| {
            let real_f64 = real.to_f64().ok_or("实部转换失败")?;
            let imag_f64 = imag.to_f64().ok_or("虚部转换失败")?;
            Ok((real_f64, imag_f64))
        })
}

// / 矩阵运算命令
#[tauri::command]
pub async fn matrix_operation(
    operation: String,
    matrix_a: Vec<Vec<f64>>,
    matrix_b: Option<Vec<Vec<f64>>>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    // 转换为Decimal矩阵
    let convert_matrix = |data: Vec<Vec<f64>>| -> Result<crate::math::Matrix, String> {
        let decimal_data: Result<Vec<Vec<rust_decimal::Decimal>>, _> = data.iter()
            .map(|row| row.iter().map(|&v| rust_decimal::Decimal::try_from(v)).collect())
            .collect();
        
        let decimal_data = decimal_data.map_err(|e| format!("矩阵数据转换失败: {}", e))?;
        
        calculator.create_matrix(decimal_data.len(), decimal_data[0].len(), 
            decimal_data.iter().flatten().cloned().collect())
            .map_err(|e| format!("创建矩阵失败: {}", e))
    };

    let matrix_a = convert_matrix(matrix_a)?;
    
    let result = match operation.as_str() {
        "transpose" => {
            let result = calculator.matrix_transpose(&matrix_a);
            let (rows, cols) = result.dimensions();
            let mut data = Vec::new();
            for i in 0..rows {
                let mut row = Vec::new();
                for j in 0..cols {
                    row.push(result.get(i, j).unwrap().to_f64().unwrap_or(0.0));
                }
                data.push(row);
            }
            serde_json::json!({
                "matrix": data,
                "rows": rows,
                "cols": cols
            })
        },
        "determinant" => {
            let det = calculator.matrix_determinant(&matrix_a)
                .map_err(|e| format!("计算行列式失败: {}", e))?;
            serde_json::json!({
                "determinant": det.to_f64().unwrap_or(0.0)
            })
        },
        "inverse" => {
            let result = calculator.matrix_inverse(&matrix_a)
                .map_err(|e| format!("矩阵求逆失败: {}", e))?;
            let (rows, cols) = result.dimensions();
            let mut data = Vec::new();
            for i in 0..rows {
                let mut row = Vec::new();
                for j in 0..cols {
                    row.push(result.get(i, j).unwrap().to_f64().unwrap_or(0.0));
                }
                data.push(row);
            }
            serde_json::json!({
                "matrix": data,
                "rows": rows,
                "cols": cols
            })
        },
        "add" | "subtract" | "multiply" => {
            let matrix_b = matrix_b.ok_or("二元矩阵运算需要两个矩阵")?;
            let matrix_b = convert_matrix(matrix_b)?;
            
            let result = match operation.as_str() {
                "add" => calculator.matrix_add(&matrix_a, &matrix_b),
                "subtract" => calculator.matrix_subtract(&matrix_a, &matrix_b),
                "multiply" => calculator.matrix_multiply(&matrix_a, &matrix_b),
                _ => unreachable!(),
            }.map_err(|e| format!("矩阵运算失败: {}", e))?;
            
            let (rows, cols) = result.dimensions();
            let mut data = Vec::new();
            for i in 0..rows {
                let mut row = Vec::new();
                for j in 0..cols {
                    row.push(result.get(i, j).unwrap().to_f64().unwrap_or(0.0));
                }
                data.push(row);
            }
            serde_json::json!({
                "matrix": data,
                "rows": rows,
                "cols": cols
            })
        },
        _ => return Err(format!("未知的矩阵操作: {}", operation)),
    };

    Ok(result)
}

// / 单位转换命令
#[tauri::command]
pub async fn convert_units(
    value: f64,
    from_unit: String,
    to_unit: String,
    state: State<'_, AppState>,
) -> Result<f64, String> {
    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    let value_decimal = rust_decimal::Decimal::try_from(value)
        .map_err(|e| format!("数值转换失败: {}", e))?;

    // 特殊处理温度转换
    if ["C", "°C", "F", "°F", "K"].contains(&from_unit.as_str()) {
        let result = calculator.convert_temperature(value_decimal, &from_unit, &to_unit)
            .map_err(|e| format!("温度转换失败: {}", e))?;
        return result.to_f64().ok_or("结果转换失败".to_string());
    }

    // 普通单位转换
    let result = calculator.convert_unit(value_decimal, &from_unit, &to_unit)
        .map_err(|e| format!("单位转换失败: {}", e))?;

    result.to_f64().ok_or("结果转换失败".to_string())
}
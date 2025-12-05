



use tauri::{State, Manager, Wry};
use serde_json::{json, Value};
use std::collections::HashMap;
use rust_decimal::prelude::ToPrimitive;

use crate::{AppState, CalculationResult, HistoryItem};

type AppHandle = tauri::AppHandle<Wry>;


#[tauri::command]
pub async fn calculate(
    expression: String,
    display_expression: Option<String>,
    state: State<'_, AppState>,
) -> Result<CalculationResult, String> {
    #[cfg(debug_assertions)]
    let start_time = std::time::Instant::now();
    let display_expression = display_expression.unwrap_or_else(|| expression.clone());
    {
        let mut count = state.calculation_count.lock().await;
        *count += 1;
    }

    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

    #[cfg(debug_assertions)]
    {
        let debugger = crate::mcp::get_mcp_debugger();
        debugger.track_state_change(&display_expression, "计算中...", "0", None);
    }

    let calculation_result = match crate::parser::parse_and_evaluate(&expression, &calculator).await {
        Ok(result) => {
            let result_str = result.to_string();
            #[cfg(debug_assertions)]
            {
                let execution_time = start_time.elapsed().as_millis() as f64;
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


#[tauri::command]
pub async fn get_history(
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<HistoryItem>, String> {
    let history_manager = state.history_manager.lock().await;
    Ok(history_manager.get_recent_items(limit.unwrap_or(100)))
}


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


#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let settings_manager = state.settings_manager.lock().await;
    let s = settings_manager.get_settings();

    let theme_mode = match &s.theme.mode {
        crate::settings::ThemeMode::Light => "light",
        crate::settings::ThemeMode::Dark => "dark",
        crate::settings::ThemeMode::Auto => "auto",
        crate::settings::ThemeMode::Custom(_name) => "dark", 
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


#[tauri::command]
pub async fn set_mcp_debugging(_enabled: bool) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        if _enabled {
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

    let decimal_value = calculator.from_base(&number, from_base)
        .map_err(|e| format!("转换失败: {}", e))?;

    calculator.to_base(decimal_value, to_base)
        .map_err(|e| format!("转换失败: {}", e))
}


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

    if ["C", "°C", "F", "°F", "K"].contains(&from_unit.as_str()) {
        let result = calculator.convert_temperature(value_decimal, &from_unit, &to_unit)
            .map_err(|e| format!("温度转换失败: {}", e))?;
        return result.to_f64().ok_or("结果转换失败".to_string());
    }

    let result = calculator.convert_unit(value_decimal, &from_unit, &to_unit)
        .map_err(|e| format!("单位转换失败: {}", e))?;

    result.to_f64().ok_or("结果转换失败".to_string())
}


/// 计算数值导数
#[tauri::command]
pub async fn calculate_derivative(
    expression: String,
    x: f64,
    h: Option<f64>,
) -> Result<f64, String> {
    use mathjs_eval::MathEvaluator;
    
    let evaluator = MathEvaluator::new();
    let f = |x_val: f64| -> Result<f64, crate::math::MathError> {
        evaluator.evaluate_at(&expression, x_val)
            .map_err(|e| crate::math::MathError::ParseError(e))
    };
    
    let calc = crate::math::Calculator::default();
    calc.numerical_derivative(f, x, h)
        .map_err(|e| format!("计算导数失败: {}", e))
}

/// 计算定积分
#[tauri::command]
pub async fn calculate_integral(
    expression: String,
    a: f64,
    b: f64,
    n: Option<usize>,
) -> Result<f64, String> {
    use mathjs_eval::MathEvaluator;
    
    let evaluator = MathEvaluator::new();
    let f = |x_val: f64| -> Result<f64, crate::math::MathError> {
        evaluator.evaluate_at(&expression, x_val)
            .map_err(|e| crate::math::MathError::ParseError(e))
    };
    
    let calc = crate::math::Calculator::default();
    calc.numerical_integral(f, a, b, n)
        .map_err(|e| format!("计算积分失败: {}", e))
}

/// 生成函数绘图数据点
#[tauri::command]
pub async fn generate_function_plot(
    expression: String,
    x_min: f64,
    x_max: f64,
    points: Option<usize>,
) -> Result<Vec<(f64, f64)>, String> {
    use mathjs_eval::MathEvaluator;
    
    let evaluator = MathEvaluator::new();
    let f = |x_val: f64| -> Result<f64, crate::math::MathError> {
        evaluator.evaluate_at(&expression, x_val)
            .map_err(|e| crate::math::MathError::ParseError(e))
    };
    
    let calc = crate::math::Calculator::default();
    calc.generate_plot_points(f, x_min, x_max, points.unwrap_or(200))
        .map_err(|e| format!("生成绘图数据失败: {}", e))
}

/// 增强的矩阵运算
#[tauri::command]
pub async fn advanced_matrix_operation(
    operation: String,
    matrix_a: Vec<Vec<f64>>,
    power: Option<i32>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let calculator = {
        let calc = state.calculator.lock().await;
        (*calc).clone()
    };

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
        "trace" => {
            let trace = calculator.matrix_trace(&matrix_a)
                .map_err(|e| format!("计算迹失败: {}", e))?;
            serde_json::json!({
                "trace": trace.to_f64().unwrap_or(0.0)
            })
        },
        "rank" => {
            let rank = calculator.matrix_rank(&matrix_a)
                .map_err(|e| format!("计算秩失败: {}", e))?;
            serde_json::json!({
                "rank": rank
            })
        },
        "frobenius_norm" => {
            let norm = calculator.matrix_frobenius_norm(&matrix_a)
                .map_err(|e| format!("计算范数失败: {}", e))?;
            serde_json::json!({
                "norm": norm.to_f64().unwrap_or(0.0)
            })
        },
        "power" => {
            let p = power.ok_or("矩阵幂运算需要指定幂次")?;
            let result = calculator.matrix_power(&matrix_a, p)
                .map_err(|e| format!("矩阵幂运算失败: {}", e))?;
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
        "lu" => {
            let (l, u) = calculator.matrix_lu_decomposition(&matrix_a)
                .map_err(|e| format!("LU分解失败: {}", e))?;
            let (l_rows, l_cols) = l.dimensions();
            let (u_rows, u_cols) = u.dimensions();
            
            let mut l_data = Vec::new();
            for i in 0..l_rows {
                let mut row = Vec::new();
                for j in 0..l_cols {
                    row.push(l.get(i, j).unwrap().to_f64().unwrap_or(0.0));
                }
                l_data.push(row);
            }
            
            let mut u_data = Vec::new();
            for i in 0..u_rows {
                let mut row = Vec::new();
                for j in 0..u_cols {
                    row.push(u.get(i, j).unwrap().to_f64().unwrap_or(0.0));
                }
                u_data.push(row);
            }
            
            serde_json::json!({
                "L": l_data,
                "U": u_data
            })
        },
        _ => return Err(format!("未知的矩阵操作: {}", operation)),
    };

    Ok(result)
}

/// 简单的数学表达式求值器模块
mod mathjs_eval {
    pub struct MathEvaluator;
    
    impl MathEvaluator {
        pub fn new() -> Self {
            Self
        }
        
        /// 在指定的 x 值处计算表达式
        pub fn evaluate_at(&self, expression: &str, x: f64) -> Result<f64, String> {
            // 简单的表达式解析和求值
            let expr = expression
                .replace("x", &format!("({})", x))
                .replace("X", &format!("({})", x))
                .replace("pi", &std::f64::consts::PI.to_string())
                .replace("π", &std::f64::consts::PI.to_string())
                .replace("e", &std::f64::consts::E.to_string());
            
            self.eval_simple(&expr)
        }
        
        fn eval_simple(&self, expr: &str) -> Result<f64, String> {
            let expr = expr.trim();
            
            // 处理函数调用
            if let Some(result) = self.try_eval_function(expr) {
                return result;
            }
            
            // 处理括号
            if expr.starts_with('(') && expr.ends_with(')') {
                let inner = &expr[1..expr.len()-1];
                if self.is_balanced(inner) {
                    return self.eval_simple(inner);
                }
            }
            
            // 处理加减法（最低优先级）
            if let Some(pos) = self.find_operator(expr, &['+', '-']) {
                let left = &expr[..pos];
                let op = expr.chars().nth(pos).unwrap();
                let right = &expr[pos+1..];
                
                if !left.is_empty() {
                    let left_val = self.eval_simple(left)?;
                    let right_val = self.eval_simple(right)?;
                    return Ok(if op == '+' { left_val + right_val } else { left_val - right_val });
                } else if op == '-' {
                    // 一元负号
                    return Ok(-self.eval_simple(right)?);
                }
            }
            
            // 处理乘除法
            if let Some(pos) = self.find_operator(expr, &['*', '/']) {
                let left = &expr[..pos];
                let op = expr.chars().nth(pos).unwrap();
                let right = &expr[pos+1..];
                
                let left_val = self.eval_simple(left)?;
                let right_val = self.eval_simple(right)?;
                
                return Ok(if op == '*' { 
                    left_val * right_val 
                } else { 
                    if right_val == 0.0 {
                        return Err("除以零".to_string());
                    }
                    left_val / right_val 
                });
            }
            
            // 处理幂运算
            if let Some(pos) = self.find_operator(expr, &['^']) {
                let left = &expr[..pos];
                let right = &expr[pos+1..];
                
                let left_val = self.eval_simple(left)?;
                let right_val = self.eval_simple(right)?;
                
                return Ok(left_val.powf(right_val));
            }
            
            // 尝试解析为数字
            expr.parse::<f64>().map_err(|_| format!("无法解析表达式: {}", expr))
        }
        
        fn try_eval_function(&self, expr: &str) -> Option<Result<f64, String>> {
            // 使用函数指针类型而不是闭包数组
            let functions: &[(&str, fn(f64) -> f64)] = &[
                ("sin(", f64::sin),
                ("cos(", f64::cos),
                ("tan(", f64::tan),
                ("asin(", f64::asin),
                ("acos(", f64::acos),
                ("atan(", f64::atan),
                ("sinh(", f64::sinh),
                ("cosh(", f64::cosh),
                ("tanh(", f64::tanh),
                ("sqrt(", f64::sqrt),
                ("cbrt(", f64::cbrt),
                ("ln(", f64::ln),
                ("log(", f64::log10),
                ("log10(", f64::log10),
                ("exp(", f64::exp),
                ("abs(", f64::abs),
                ("floor(", f64::floor),
                ("ceil(", f64::ceil),
                ("round(", f64::round),
            ];
            
            for (prefix, func) in functions.iter() {
                if expr.starts_with(prefix) && expr.ends_with(')') {
                    let inner = &expr[prefix.len()..expr.len()-1];
                    return Some(self.eval_simple(inner).map(|x| func(x)));
                }
            }
            
            None
        }
        
        fn find_operator(&self, expr: &str, ops: &[char]) -> Option<usize> {
            let mut paren_depth = 0;
            let chars: Vec<char> = expr.chars().collect();
            
            // 从右到左查找（确保左结合性）
            for i in (0..chars.len()).rev() {
                match chars[i] {
                    ')' => paren_depth += 1,
                    '(' => paren_depth -= 1,
                    c if paren_depth == 0 && ops.contains(&c) => {
                        // 确保不是一元运算符
                        if i > 0 || c != '-' {
                            return Some(i);
                        }
                    }
                    _ => {}
                }
            }
            None
        }
        
        fn is_balanced(&self, expr: &str) -> bool {
            let mut depth = 0;
            for c in expr.chars() {
                match c {
                    '(' => depth += 1,
                    ')' => {
                        depth -= 1;
                        if depth < 0 { return false; }
                    }
                    _ => {}
                }
            }
            depth == 0
        }
    }
}
// ! Model Context Protocol (MCP) 调试支持模块
// !
// ! 提供实时调试接口、性能监控、错误诊断等开发工具

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use tracing::{debug, error, info, warn};

// / MCP 调试事件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MCPEvent {
    // / 计算器状态变化事件
    StateChanged {
        timestamp: u64,
        expression: String,
        result: String,
        memory: String,
        error: Option<String>,
    },
    // / 表达式解析事件
    ExpressionParsed {
        timestamp: u64,
        expression: String,
        ast: String, // AST 的字符串表示
        parse_time_ms: f64,
    },
    // / 计算执行事件
    CalculationExecuted {
        timestamp: u64,
        expression: String,
        result: String,
        execution_time_ms: f64,
        memory_usage_kb: u64,
    },
    // / 错误事件
    ErrorOccurred {
        timestamp: u64,
        error_type: String,
        message: String,
        context: HashMap<String, String>,
    },
    // / 性能监控事件
    PerformanceMetrics {
        timestamp: u64,
        cpu_usage: f64,
        memory_usage_mb: f64,
        active_threads: u32,
        heap_size_mb: f64,
    },
}

// / MCP 调试器实例
#[derive(Debug)]
pub struct MCPDebugger {
    event_sender: broadcast::Sender<MCPEvent>,
    performance_stats: Arc<Mutex<PerformanceStats>>,
    is_enabled: bool,
}

// / 性能统计数据
#[derive(Debug, Clone)]
pub struct PerformanceStats {
    pub total_calculations: u64,
    pub total_calculation_time_ms: f64,
    pub peak_memory_usage_mb: f64,
    pub error_count: u64,
    pub last_update: u64,
}

impl Default for PerformanceStats {
    fn default() -> Self {
        Self {
            total_calculations: 0,
            total_calculation_time_ms: 0.0,
            peak_memory_usage_mb: 0.0,
            error_count: 0,
            last_update: 0,
        }
    }
}

impl MCPDebugger {
    // / 创建新的 MCP 调试器实例
    pub fn new() -> Self {
        let (event_sender, _) = broadcast::channel(1000);
        
        Self {
            event_sender,
            performance_stats: Arc::new(Mutex::new(PerformanceStats::default())),
            is_enabled: cfg!(debug_assertions), // 默认在 调试 (debug) 模式下启用
        }
    }

    // / 启用/禁用调试功能
    pub fn set_enabled(&mut self, enabled: bool) {
        self.is_enabled = enabled;
        info!("MCP 调试器已{}", if enabled { "启用" } else { "禁用" });
    }

    // / 订阅调试事件
    pub fn subscribe(&self) -> broadcast::Receiver<MCPEvent> {
        self.event_sender.subscribe()
    }

    // / 记录计算器状态变化
    pub fn track_state_change(
        &self,
        expression: &str,
        result: &str,
        memory: &str,
        error: Option<&str>,
    ) {
        if !self.is_enabled {
            return;
        }

        let event = MCPEvent::StateChanged {
            timestamp: current_timestamp(),
            expression: expression.to_string(),
            result: result.to_string(),
            memory: memory.to_string(),
            error: error.map(|e| e.to_string()),
        };

        self.send_event(event);
        debug!("状态变化: {} -> {}", expression, result);
    }

    // / 记录表达式解析过程
    pub fn track_expression_parsing(
        &self,
        expression: &str,
        ast: &crate::parser::ASTNode,
        parse_time_ms: f64,
    ) {
        if !self.is_enabled {
            return;
        }

        let event = MCPEvent::ExpressionParsed {
            timestamp: current_timestamp(),
            expression: expression.to_string(),
            ast: format!("{:#?}", ast), // AST 的调试输出
            parse_time_ms,
        };

        self.send_event(event);
        debug!("表达式解析: {} ({}ms)", expression, parse_time_ms);
    }

    // / 记录计算执行过程
    pub fn track_calculation_execution(
        &self,
        expression: &str,
        result: &str,
        execution_time_ms: f64,
        memory_usage_kb: u64,
    ) {
        if !self.is_enabled {
            return;
        }

        // 更新性能统计
        if let Ok(mut stats) = self.performance_stats.lock() {
            stats.total_calculations += 1;
            stats.total_calculation_time_ms += execution_time_ms;
            stats.peak_memory_usage_mb = stats.peak_memory_usage_mb.max(memory_usage_kb as f64 / 1024.0);
            stats.last_update = current_timestamp();
        }

        let event = MCPEvent::CalculationExecuted {
            timestamp: current_timestamp(),
            expression: expression.to_string(),
            result: result.to_string(),
            execution_time_ms,
            memory_usage_kb,
        };

        self.send_event(event);
        info!("计算完成: {} = {} ({}ms)", expression, result, execution_time_ms);
    }

    // / 记录错误事件
    pub fn track_error(
        &self,
        error_type: &str,
        message: &str,
        context: HashMap<String, String>,
    ) {
        if !self.is_enabled {
            return;
        }

        // 更新错误计数
        if let Ok(mut stats) = self.performance_stats.lock() {
            stats.error_count += 1;
        }

        let event = MCPEvent::ErrorOccurred {
            timestamp: current_timestamp(),
            error_type: error_type.to_string(),
            message: message.to_string(),
            context,
        };

        self.send_event(event);
        error!("错误发生: {} - {}", error_type, message);
    }

    // / 记录性能指标
    pub fn track_performance_metrics(&self) {
        if !self.is_enabled {
            return;
        }

        let event = MCPEvent::PerformanceMetrics {
            timestamp: current_timestamp(),
            cpu_usage: get_cpu_usage(),
            memory_usage_mb: get_memory_usage_mb(),
            active_threads: get_active_thread_count(),
            heap_size_mb: get_heap_size_mb(),
        };

        self.send_event(event);
    }

    // / 获取性能统计摘要
    pub fn get_performance_summary(&self) -> Option<PerformanceStats> {
        self.performance_stats.lock().ok().map(|stats| stats.clone())
    }

    // / 发送调试事件
    fn send_event(&self, event: MCPEvent) {
        if let Err(e) = self.event_sender.send(event) {
            warn!("发送调试事件失败: {}", e);
        }
    }
}

// / 获取当前时间戳（毫秒）
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// / 获取 CPU 使用率（简化实现）
fn get_cpu_usage() -> f64 {
    // 在实际应用中，这里应该使用系统 API 获取真实的 CPU 使用率
    // 这里返回一个模拟值
    0.0
}

// / 获取内存使用量（MB）
fn get_memory_usage_mb() -> f64 {
    // 简化实现，在实际应用中应该使用系统 API
    // 这里返回一个模拟值
    0.0
}

// / 获取活跃线程数
fn get_active_thread_count() -> u32 {
    // 简化实现
    std::thread::available_parallelism()
        .map(|p| p.get() as u32)
        .unwrap_or(1)
}

// / 获取堆大小（MB）
fn get_heap_size_mb() -> f64 {
    // 简化实现
    0.0
}

// / MCP 调试器的全局实例
use std::sync::OnceLock;

static MCP_DEBUGGER: OnceLock<MCPDebugger> = OnceLock::new();

// / 获取全局 MCP 调试器实例
pub fn get_mcp_debugger() -> &'static MCPDebugger {
    MCP_DEBUGGER.get_or_init(|| MCPDebugger::new())
}

// / 初始化 MCP 调试器
pub fn init_mcp_debugger() {
    let debugger = get_mcp_debugger();
    info!("MCP 调试器已初始化");

    // 启动性能监控任务
    tokio::spawn(async {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(5));
        loop {
            interval.tick().await;
            debugger.track_performance_metrics();
        }
    });
}

// / 便捷宏：记录计算状态变化
#[macro_export]
macro_rules! mcp_track_state {
    ($expr:expr, $result:expr, $memory:expr) => {
        $crate::mcp::get_mcp_debugger().track_state_change($expr, $result, $memory, None)
    };
    ($expr:expr, $result:expr, $memory:expr, $error:expr) => {
        $crate::mcp::get_mcp_debugger().track_state_change($expr, $result, $memory, Some($error))
    };
}

// / 便捷宏：记录表达式解析
#[macro_export]
macro_rules! mcp_track_parsing {
    ($expr:expr, $ast:expr, $time:expr) => {
        $crate::mcp::get_mcp_debugger().track_expression_parsing($expr, $ast, $time)
    };
}

// / 便捷宏：记录计算执行
#[macro_export]
macro_rules! mcp_track_execution {
    ($expr:expr, $result:expr, $time:expr, $memory:expr) => {
        $crate::mcp::get_mcp_debugger().track_calculation_execution($expr, $result, $time, $memory)
    };
}

// / 便捷宏：记录错误
#[macro_export]
macro_rules! mcp_track_error {
    ($error_type:expr, $message:expr) => {
        $crate::mcp::get_mcp_debugger().track_error($error_type, $message, std::collections::HashMap::new())
    };
    ($error_type:expr, $message:expr, $context:expr) => {
        $crate::mcp::get_mcp_debugger().track_error($error_type, $message, $context)
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mcp_debugger_creation() {
        let debugger = MCPDebugger::new();
        assert!(debugger.is_enabled == cfg!(debug_assertions));
    }

    #[test]
    fn test_performance_stats() {
        let debugger = MCPDebugger::new();
        let stats = debugger.get_performance_summary().unwrap();
        assert_eq!(stats.total_calculations, 0);
        assert_eq!(stats.error_count, 0);
    }

    #[tokio::test]
    async fn test_event_subscription() {
        let debugger = MCPDebugger::new();
        let mut receiver = debugger.subscribe();
        
        debugger.track_state_change("2+2", "4", "0", None);
        
        if let Ok(event) = receiver.recv().await {
            match event {
                MCPEvent::StateChanged { expression, result, .. } => {
                    assert_eq!(expression, "2+2");
                    assert_eq!(result, "4");
                }
                _ => panic!("期望 StateChanged 事件"),
            }
        }
    }
}
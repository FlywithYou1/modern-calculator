//! 计算历史管理模块
//! 
//! 提供计算历史的存储、检索、搜索和统计功能

use crate::HistoryItem;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use std::fs;
use std::path::Path;

/// 历史管理器
#[derive(Debug, Default)]
pub struct HistoryManager {
    items: Vec<HistoryItem>,
    max_items: usize,
}

impl HistoryManager {
    /// 创建新的历史管理器
    pub fn new(max_items: usize) -> Self {
        Self {
            items: Vec::new(),
            max_items,
        }
    }

    /// 添加历史记录项
    pub fn add_item(&mut self, item: HistoryItem) {
        self.items.insert(0, item);
        
        // 保持最大项目数限制
        if self.items.len() > self.max_items {
            self.items.truncate(self.max_items);
        }
    }

    /// 获取最近的历史记录
    pub fn get_recent_items(&self, limit: usize) -> Vec<HistoryItem> {
        self.items.iter().take(limit).cloned().collect()
    }

    /// 根据ID获取历史记录项
    pub fn get_item_by_id(&self, id: &str) -> Option<&HistoryItem> {
        self.items.iter().find(|item| item.id == id)
    }

    /// 更新历史记录项的标签
    pub fn update_item_tags(&mut self, id: &str, tags: Option<Vec<String>>) -> Result<()> {
        if let Some(item) = self.items.iter_mut().find(|item| item.id == id) {
            item.tags = tags;
            Ok(())
        } else {
            Err(anyhow!("找不到ID为 {} 的历史记录项", id))
        }
    }

    /// 删除历史记录项
    pub fn remove_item(&mut self, id: &str) -> Result<()> {
        if let Some(index) = self.items.iter().position(|item| item.id == id) {
            self.items.remove(index);
            Ok(())
        } else {
            Err(anyhow!("找不到ID为 {} 的历史记录项", id))
        }
    }

    /// 搜索历史记录
    pub fn search(&self, query: &str) -> Vec<HistoryItem> {
        let query_lower = query.to_lowercase();
        
        self.items.iter()
            .filter(|item| {
                item.expression.to_lowercase().contains(&query_lower) ||
                item.result.to_lowercase().contains(&query_lower) ||
                item.tags.as_ref().map_or(false, |tags| {
                    tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
                }) ||
                item.notes.as_ref().map_or(false, |notes| notes.to_lowercase().contains(&query_lower)) ||
                item.metadata.as_ref().map_or(false, |meta| meta.to_string().to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    /// 按标签过滤历史记录
    pub fn filter_by_tag(&self, tag: &str) -> Vec<HistoryItem> {
        self.items.iter()
            .filter(|item| {
                item.tags.as_ref().map_or(false, |tags| tags.contains(&tag.to_string()))
            })
            .cloned()
            .collect()
    }

    /// 按日期范围过滤历史记录
    pub fn filter_by_date_range(&self, start: DateTime<Utc>, end: DateTime<Utc>) -> Vec<HistoryItem> {
        self.items.iter()
            .filter(|item| {
                if let Ok(timestamp) = DateTime::parse_from_rfc3339(&item.timestamp) {
                    let timestamp_utc = timestamp.with_timezone(&Utc);
                    timestamp_utc >= start && timestamp_utc <= end
                } else {
                    false
                }
            })
            .cloned()
            .collect()
    }

    /// 获取历史统计信息
    pub fn get_stats(&self) -> HashMap<String, u32> {
        let mut stats = HashMap::new();
        
        stats.insert("total_items".to_string(), self.items.len() as u32);
        
        // 统计标签使用频率
        let mut tag_counts = HashMap::new();
        for item in &self.items {
            if let Some(tags) = &item.tags {
                for tag in tags {
                    *tag_counts.entry(tag.clone()).or_insert(0) += 1;
                }
            }
        }
        
        // 添加最常用的标签
        if let Some((most_used_tag, count)) = tag_counts.iter().max_by_key(|(_, count)| *count) {
            stats.insert("most_used_tag_count".to_string(), *count);
            stats.insert("most_used_tag_length".to_string(), most_used_tag.len() as u32);
        }
        
        // 统计今天的计算次数
        let today = Utc::now().date_naive();
        let today_count = self.items.iter()
            .filter(|item| {
                if let Ok(timestamp) = DateTime::parse_from_rfc3339(&item.timestamp) {
                    timestamp.date_naive() == today
                } else {
                    false
                }
            })
            .count();
        
        stats.insert("today_calculations".to_string(), today_count as u32);
        
        stats
    }

    /// 清空历史记录
    pub fn clear(&mut self) {
        self.items.clear();
    }

    /// 导出为JSON格式
    pub fn export_to_json(&self) -> Result<String> {
        #[derive(Serialize)]
        struct ExportData {
            version: u32,
            export_time: String,
            items: Vec<HistoryItem>,
            metadata: HashMap<String, serde_json::Value>,
        }

        let export_data = ExportData {
            version: 1,
            export_time: Utc::now().to_rfc3339(),
            items: self.items.clone(),
            metadata: {
                let mut meta = HashMap::new();
                meta.insert("total_items".to_string(), serde_json::Value::Number(self.items.len().into()));
                meta.insert("max_items".to_string(), serde_json::Value::Number(self.max_items.into()));
                meta
            },
        };

        serde_json::to_string_pretty(&export_data)
            .map_err(|e| anyhow!("序列化历史记录失败: {}", e))
    }

    /// 保存到路径（JSON 文件）
    pub fn export_to_path<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let json = self.export_to_json()?;
        if let Some(parent) = path.as_ref().parent() {
            fs::create_dir_all(parent).ok();
        }
        fs::write(path, json).map_err(|e| anyhow!("写入历史记录文件失败: {}", e))
    }

    /// 从JSON格式导入
    pub fn import_from_json(&mut self, json_data: &str) -> Result<()> {
        #[derive(Deserialize)]
        struct ImportData {
            #[allow(dead_code)]
            version: Option<u32>,
            items: Vec<HistoryItem>,
        }

        let import_data: ImportData = serde_json::from_str(json_data)
            .map_err(|e| anyhow!("解析历史记录JSON失败: {}", e))?;

        // 合并导入的项目，避免重复
        for new_item in import_data.items {
            if !self.items.iter().any(|existing| existing.id == new_item.id) {
                self.items.push(new_item);
            }
        }

        // 按时间戳排序（最新的在前面）
        self.items.sort_by(|a, b| {
            let time_a = DateTime::parse_from_rfc3339(&a.timestamp).unwrap_or_default();
            let time_b = DateTime::parse_from_rfc3339(&b.timestamp).unwrap_or_default();
            time_b.cmp(&time_a)
        });

        // 保持最大项目数限制
        if self.items.len() > self.max_items {
            self.items.truncate(self.max_items);
        }

        Ok(())
    }

    /// 从路径读取并导入（JSON 文件）
    pub fn import_from_path<P: AsRef<Path>>(&mut self, path: P) -> Result<()> {
        let data = fs::read_to_string(path).map_err(|e| anyhow!("读取历史记录文件失败: {}", e))?;
        self.import_from_json(&data)
    }

    /// 获取项目总数
    pub fn len(&self) -> usize {
        self.items.len()
    }

    /// 检查是否为空
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    /// 设置最大项目数
    pub fn set_max_items(&mut self, max_items: usize) {
        self.max_items = max_items;
        if self.items.len() > max_items {
            self.items.truncate(max_items);
        }
    }
}
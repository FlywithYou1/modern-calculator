



use crate::HistoryItem;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use std::fs;
use std::path::Path;


#[derive(Debug, Default)]
pub struct HistoryManager {
    items: Vec<HistoryItem>,
    max_items: usize,
}

impl HistoryManager {
    pub fn new(max_items: usize) -> Self {
        Self {
            items: Vec::new(),
            max_items,
        }
    }

    pub fn add_item(&mut self, item: HistoryItem) {
        self.items.insert(0, item);
        if self.items.len() > self.max_items {
            self.items.truncate(self.max_items);
        }
    }

    pub fn get_recent_items(&self, limit: usize) -> Vec<HistoryItem> {
        self.items.iter().take(limit).cloned().collect()
    }

    pub fn get_item_by_id(&self, id: &str) -> Option<&HistoryItem> {
        self.items.iter().find(|item| item.id == id)
    }

    pub fn update_item_tags(&mut self, id: &str, tags: Option<Vec<String>>) -> Result<()> {
        if let Some(item) = self.items.iter_mut().find(|item| item.id == id) {
            item.tags = tags;
            Ok(())
        } else {
            Err(anyhow!("找不到ID为 {} 的历史记录项", id))
        }
    }

    pub fn remove_item(&mut self, id: &str) -> Result<()> {
        if let Some(index) = self.items.iter().position(|item| item.id == id) {
            self.items.remove(index);
            Ok(())
        } else {
            Err(anyhow!("找不到ID为 {} 的历史记录项", id))
        }
    }

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

    pub fn filter_by_tag(&self, tag: &str) -> Vec<HistoryItem> {
        self.items.iter()
            .filter(|item| {
                item.tags.as_ref().map_or(false, |tags| tags.contains(&tag.to_string()))
            })
            .cloned()
            .collect()
    }

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

    pub fn get_stats(&self) -> HashMap<String, u32> {
        let mut stats = HashMap::new();
        stats.insert("total_items".to_string(), self.items.len() as u32);
        let mut tag_counts = HashMap::new();
        for item in &self.items {
            if let Some(tags) = &item.tags {
                for tag in tags {
                    *tag_counts.entry(tag.clone()).or_insert(0) += 1;
                }
            }
        }
        if let Some((most_used_tag, count)) = tag_counts.iter().max_by_key(|(_, count)| *count) {
            stats.insert("most_used_tag_count".to_string(), *count);
            stats.insert("most_used_tag_length".to_string(), most_used_tag.len() as u32);
        }
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

    pub fn clear(&mut self) {
        self.items.clear();
    }

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

    pub fn export_to_path<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let json = self.export_to_json()?;
        if let Some(parent) = path.as_ref().parent() {
            fs::create_dir_all(parent).ok();
        }
        fs::write(path, json).map_err(|e| anyhow!("写入历史记录文件失败: {}", e))
    }

    pub fn import_from_json(&mut self, json_data: &str) -> Result<()> {
        #[derive(Deserialize)]
        struct ImportData {
            #[allow(dead_code)]
            version: Option<u32>,
            items: Vec<HistoryItem>,
        }

        let import_data: ImportData = serde_json::from_str(json_data)
            .map_err(|e| anyhow!("解析历史记录JSON失败: {}", e))?;

        for new_item in import_data.items {
            if !self.items.iter().any(|existing| existing.id == new_item.id) {
                self.items.push(new_item);
            }
        }

        self.items.sort_by(|a, b| {
            let time_a = DateTime::parse_from_rfc3339(&a.timestamp).unwrap_or_default();
            let time_b = DateTime::parse_from_rfc3339(&b.timestamp).unwrap_or_default();
            time_b.cmp(&time_a)
        });

        if self.items.len() > self.max_items {
            self.items.truncate(self.max_items);
        }

        Ok(())
    }

    pub fn import_from_path<P: AsRef<Path>>(&mut self, path: P) -> Result<()> {
        let data = fs::read_to_string(path).map_err(|e| anyhow!("读取历史记录文件失败: {}", e))?;
        self.import_from_json(&data)
    }

    pub fn len(&self) -> usize {
        self.items.len()
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    pub fn set_max_items(&mut self, max_items: usize) {
        self.max_items = max_items;
        if self.items.len() > max_items {
            self.items.truncate(max_items);
        }
    }
}
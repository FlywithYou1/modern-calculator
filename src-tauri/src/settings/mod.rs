



use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use anyhow::{Result, anyhow};


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSettings {
    pub name: String,
    pub mode: ThemeMode,
    pub custom_colors: Option<HashMap<String, String>>,
    pub animations_enabled: bool,
    pub transparency: f32,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ThemeMode {
    Light,
    Dark,
    Auto,
    Custom(String),
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplaySettings {
    pub decimal_places: u32,
    pub scientific_notation_threshold: f64,
    pub thousands_separator: bool,
    pub angle_unit: AngleUnit,
    pub number_format: NumberFormat,
    pub font_size: FontSize,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AngleUnit {
    Degrees,
    Radians,
    Gradians,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NumberFormat {
    Standard,
    Engineering,
    Scientific,
    Financial,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FontSize {
    Small,
    Medium,
    Large,
    ExtraLarge,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutSettings {
    pub compact_mode: bool,
    pub show_history_panel: bool,
    pub show_memory_panel: bool,
    pub button_size: ButtonSize,
    pub orientation: Orientation,
    pub keyboard_layout: KeyboardLayout,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ButtonSize {
    Small,
    Medium,
    Large,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Orientation {
    Portrait,
    Landscape,
    Auto,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KeyboardLayout {
    Standard,
    Scientific,
    Programming,
    Custom,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralSettings {
    pub enable_haptic_feedback: bool,
    pub enable_sound_effects: bool,
    pub max_history_items: usize,
    pub auto_save_history: bool,
    pub enable_keyboard_shortcuts: bool,
    pub startup_expression: Option<String>,
    pub precision_mode: PrecisionMode,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PrecisionMode {
    Standard,
    High,
    Financial,
    Scientific,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub version: String,
    pub theme: ThemeSettings,
    pub display: DisplaySettings,
    pub layout: LayoutSettings,
    pub general: GeneralSettings,
    pub custom_data: HashMap<String, serde_json::Value>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            version: "2.0.0".to_string(),
            theme: ThemeSettings {
                name: "modern-dark".to_string(),
                mode: ThemeMode::Auto,
                custom_colors: None,
                animations_enabled: true,
                transparency: 0.95,
            },
            display: DisplaySettings {
                decimal_places: 10,
                scientific_notation_threshold: 1e6,
                thousands_separator: true,
                angle_unit: AngleUnit::Degrees,
                number_format: NumberFormat::Standard,
                font_size: FontSize::Medium,
            },
            layout: LayoutSettings {
                compact_mode: false,
                show_history_panel: false,
                show_memory_panel: true,
                button_size: ButtonSize::Medium,
                orientation: Orientation::Auto,
                keyboard_layout: KeyboardLayout::Scientific,
            },
            general: GeneralSettings {
                enable_haptic_feedback: true,
                enable_sound_effects: false,
                max_history_items: 100,
                auto_save_history: true,
                enable_keyboard_shortcuts: true,
                startup_expression: None,
                precision_mode: PrecisionMode::High,
            },
            custom_data: HashMap::new(),
        }
    }
}


#[derive(Debug, Default)]
pub struct SettingsManager {
    settings: AppSettings,
    is_dirty: bool,
}

impl SettingsManager {
    pub fn new() -> Self {
        Self {
            settings: AppSettings::default(),
            is_dirty: false,
        }
    }

    pub fn with_default_settings() -> Self {
        Self::new()
    }

    pub fn get_settings(&self) -> &AppSettings {
        &self.settings
    }

    pub fn get_settings_mut(&mut self) -> &mut AppSettings {
        self.is_dirty = true;
        &mut self.settings
    }

    pub fn update_theme(&mut self, theme: ThemeSettings) {
        self.settings.theme = theme;
        self.is_dirty = true;
    }

    pub fn update_display(&mut self, display: DisplaySettings) {
        self.settings.display = display;
        self.is_dirty = true;
    }

    pub fn update_layout(&mut self, layout: LayoutSettings) {
        self.settings.layout = layout;
        self.is_dirty = true;
    }

    pub fn update_general(&mut self, general: GeneralSettings) {
        self.settings.general = general;
        self.is_dirty = true;
    }

    pub fn set_theme_mode(&mut self, mode: ThemeMode) {
        self.settings.theme.mode = mode;
        self.is_dirty = true;
    }

    pub fn set_angle_unit(&mut self, unit: AngleUnit) {
        self.settings.display.angle_unit = unit;
        self.is_dirty = true;
    }

    pub fn set_decimal_places(&mut self, places: u32) {
        self.settings.display.decimal_places = places.clamp(0, 20);
        self.is_dirty = true;
    }

    pub fn set_compact_mode(&mut self, enabled: bool) {
        self.settings.layout.compact_mode = enabled;
        self.is_dirty = true;
    }

    pub fn set_history_panel_visible(&mut self, visible: bool) {
        self.settings.layout.show_history_panel = visible;
        self.is_dirty = true;
    }

    pub fn set_haptic_feedback(&mut self, enabled: bool) {
        self.settings.general.enable_haptic_feedback = enabled;
        self.is_dirty = true;
    }

    pub fn set_max_history_items(&mut self, count: usize) {
        self.settings.general.max_history_items = count.clamp(10, 10000);
        self.is_dirty = true;
    }

    pub fn set_custom_value(&mut self, key: String, value: serde_json::Value) {
        self.settings.custom_data.insert(key, value);
        self.is_dirty = true;
    }

    pub fn get_custom_value(&self, key: &str) -> Option<&serde_json::Value> {
        self.settings.custom_data.get(key)
    }

    pub fn remove_custom_value(&mut self, key: &str) -> Option<serde_json::Value> {
        self.is_dirty = true;
        self.settings.custom_data.remove(key)
    }

    pub fn reset_to_defaults(&mut self) {
        self.settings = AppSettings::default();
        self.is_dirty = true;
    }

    pub fn is_dirty(&self) -> bool {
        self.is_dirty
    }

    pub fn mark_clean(&mut self) {
        self.is_dirty = false;
    }

    pub fn validate(&self) -> Result<()> {
        if self.settings.display.decimal_places > 20 {
            return Err(anyhow!("小数位数不能超过20位"));
        }

        if self.settings.general.max_history_items < 10 {
            return Err(anyhow!("历史记录数量不能少于10条"));
        }

        if self.settings.theme.transparency < 0.0 || self.settings.theme.transparency > 1.0 {
            return Err(anyhow!("透明度值必须在0.0到1.0之间"));
        }

        Ok(())
    }

    pub fn export_to_json(&self) -> Result<String> {
        self.validate()?;
        serde_json::to_string_pretty(&self.settings)
            .map_err(|e| anyhow!("序列化设置失败: {}", e))
    }

    pub fn import_from_json(&mut self, json_data: &str) -> Result<()> {
        let settings: AppSettings = serde_json::from_str(json_data)
            .map_err(|e| anyhow!("解析设置JSON失败: {}", e))?;

        let temp_manager = SettingsManager {
            settings: settings.clone(),
            is_dirty: false,
        };
        temp_manager.validate()?;

        self.settings = settings;
        self.is_dirty = true;
        Ok(())
    }

    pub fn update_from_json(&mut self, json_data: &str) -> Result<()> {
        self.import_from_json(json_data)
    }

    pub fn get_summary(&self) -> HashMap<String, String> {
        let mut summary = HashMap::new();
        summary.insert("theme_mode".to_string(), format!("{:?}", self.settings.theme.mode));
        summary.insert("angle_unit".to_string(), format!("{:?}", self.settings.display.angle_unit));
        summary.insert("decimal_places".to_string(), self.settings.display.decimal_places.to_string());
        summary.insert("compact_mode".to_string(), self.settings.layout.compact_mode.to_string());
        summary.insert("max_history".to_string(), self.settings.general.max_history_items.to_string());
        summary.insert("haptic_feedback".to_string(), self.settings.general.enable_haptic_feedback.to_string());
        summary
    }
}
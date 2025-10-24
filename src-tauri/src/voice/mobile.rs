use anyhow::Result;
use serde::de::DeserializeOwned;
use tauri::plugin::PluginApi;
use tauri::{AppHandle, Runtime};

const PLUGIN_IDENTIFIER: &str = "com.calculator.scientific.voice";
const PLUGIN_CLASS: &str = "VoicePlugin";

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> Result<()> {
    api.register_android_plugin(PLUGIN_IDENTIFIER, PLUGIN_CLASS)?;
    Ok(())
}

use tauri::plugin::{Builder, TauriPlugin};
use tauri::Runtime;

#[cfg(target_os = "android")]
mod mobile;

#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
mod desktop;

#[cfg(target_os = "android")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("voice")
        .setup(|app, api| {
            mobile::init(app, api)?;
            Ok(())
        })
        .build()
}

#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    desktop::init::<R>()
}

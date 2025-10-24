use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime};

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "windows")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    windows::init::<R>()
}

#[cfg(target_os = "macos")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    macos::init::<R>()
}

#[cfg(target_os = "linux")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    linux::init::<R>()
}

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux", target_os = "android")))]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("voice").build()
}

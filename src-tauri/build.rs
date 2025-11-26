fn main() {
    // 在 GNU 工具链下，需要确保 MSYS2 的工具链在 PATH 中
    // 这样 windres 调用的 cc1.exe 才能正确处理路径
    #[cfg(target_os = "windows")]
    {
        let target = std::env::var("TARGET").unwrap_or_default();
        if target.contains("gnu") {
            // 尝试找到 MSYS2 UCRT64 bin 目录并添加到 PATH
            let msys2_paths = [
                "C:\\msys64\\ucrt64\\bin",
                "C:\\msys64\\mingw64\\bin",
                "C:\\msys64\\mingw32\\bin",
            ];
            
            for msys2_bin in msys2_paths.iter() {
                if std::path::Path::new(msys2_bin).exists() {
                    if let Ok(current_path) = std::env::var("PATH") {
                        if !current_path.contains(msys2_bin) {
                            let new_path = format!("{};{}", msys2_bin, current_path);
                            // SAFETY: 构建脚本是单线程的，设置环境变量是安全的
                            unsafe {
                                std::env::set_var("PATH", &new_path);
                            }
                            println!("cargo:warning=Added {} to PATH for GNU toolchain", msys2_bin);
                        }
                    }
                    break;
                }
            }
        }
    }
    
    tauri_build::build()
}

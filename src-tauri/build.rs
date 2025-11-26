fn main() {
    // 检测目标平台
    let target = std::env::var("TARGET").unwrap_or_default();
    let is_windows_gnu = target.contains("windows") && target.contains("gnu");
    
    // 为 GNU 工具链添加 MSYS2 路径
    if is_windows_gnu {
        #[cfg(target_os = "windows")]
        {
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
        
        println!("cargo:warning=Building with GNU toolchain");
        
        // 使用 embed-resource 编译 Windows 资源（支持 windres）
        // embed-resource 会自动检测并使用 windres
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let rc_path = std::path::Path::new(&manifest_dir).join("icons").join("icon.ico");
        
        if rc_path.exists() {
            // 创建临时 .rc 文件
            let out_dir = std::env::var("OUT_DIR").unwrap();
            let rc_file = std::path::Path::new(&out_dir).join("app.rc");
            let rc_content = format!(
                r#"1 ICON "{}""#,
                rc_path.to_string_lossy().replace('\\', "\\\\")
            );
            std::fs::write(&rc_file, rc_content).ok();
            
            // 使用 embed-resource 编译
            let _ = embed_resource::compile(&rc_file, embed_resource::NONE);
        }
        
        // 调用 tauri_build，它会跳过已存在的资源
        tauri_build::build();
    } else {
        // 非 GNU 工具链（MSVC 或其他平台），正常构建
        tauri_build::build();
    }
}

fn main() {
    // 检测目标平台
    let target = std::env::var("TARGET").unwrap_or_default();
    let is_windows_gnu = target.contains("windows") && target.contains("gnu");
    
    if is_windows_gnu {
        println!("cargo:warning=Building with GNU toolchain for target: {}", target);
        
        // 为 GNU 工具链添加 MSYS2 路径
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
        
        // GNU 工具链：使用 embed-resource 编译资源
        // 必须设置 WINDRES 环境变量指向 GNU windres
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let icon_path = std::path::Path::new(&manifest_dir).join("icons").join("icon.ico");
        
        // 查找 windres
        let windres_paths = [
            "C:\\msys64\\ucrt64\\bin\\windres.exe",
            "C:\\msys64\\mingw64\\bin\\windres.exe",
            "/usr/bin/x86_64-w64-mingw32-windres",
            "windres",
        ];
        
        let mut windres_found = None;
        for path in windres_paths.iter() {
            if std::path::Path::new(path).exists() || path == &"windres" {
                windres_found = Some(*path);
                break;
            }
        }
        
        if let Some(windres) = windres_found {
            println!("cargo:warning=Using windres: {}", windres);
            
            // 设置环境变量强制 embed-resource 使用 GNU windres
            unsafe {
                std::env::set_var("WINDRES", windres);
            }
            
            if icon_path.exists() {
                // 创建简单的资源文件
                let rc_file = std::path::Path::new(&out_dir).join("app_icon.rc");
                let icon_path_str = icon_path.to_string_lossy().replace('\\', "/");
                
                let rc_content = format!(
                    "// Windows Resource File\n1 ICON \"{}\"\n",
                    icon_path_str
                );
                
                if let Err(e) = std::fs::write(&rc_file, &rc_content) {
                    println!("cargo:warning=Failed to write RC file: {}", e);
                } else {
                    println!("cargo:warning=Created resource file at {:?}", rc_file);
                    
                    // 使用 embed-resource 编译
                    let _ = embed_resource::compile(&rc_file, embed_resource::NONE);
                }
            }
        } else {
            println!("cargo:warning=windres not found, skipping resource compilation");
        }
        
        // 对于 GNU 工具链，完全跳过 tauri-build 的资源编译
        // 通过不设置 window_icon_path 来避免资源编译
        // tauri-build 会生成必要的 Tauri 代码，但我们已经用 embed-resource 编译了图标
        
        // 使用空的 WindowsAttributes（不指定图标）
        let windows = tauri_build::WindowsAttributes::new();
        let attrs = tauri_build::Attributes::new().windows_attributes(windows);
        
        if let Err(e) = tauri_build::try_build(attrs) {
            let err_str = format!("{}", e);
            // 如果是图标相关错误，忽略它
            if err_str.contains("icon") || err_str.contains("Icon") || err_str.contains("resource") || err_str.contains("Resource") {
                println!("cargo:warning=Ignoring icon/resource error (handled by embed-resource): {}", e);
            } else {
                panic!("tauri build failed: {}", e);
            }
        }
    } else {
        // 非 GNU 工具链（MSVC 或其他平台），正常构建
        tauri_build::build();
    }
}

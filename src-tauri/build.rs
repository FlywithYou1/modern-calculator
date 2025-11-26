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
        
        // GNU 工具链：使用 windres + ar 手动编译资源
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let icon_path = std::path::Path::new(&manifest_dir).join("icons").join("icon.ico");
        
        if icon_path.exists() {
            // 1. 创建 RC 文件
            let rc_file_path = std::path::Path::new(&out_dir).join("app_icon.rc");
            let icon_path_str = icon_path.to_string_lossy().replace('\\', "/");
            
            let rc_content = format!(
                "// Windows Resource File\n1 ICON \"{}\"\n",
                icon_path_str
            );
            
            if let Err(e) = std::fs::write(&rc_file_path, &rc_content) {
                println!("cargo:warning=Failed to write RC file: {}", e);
            } else {
                println!("cargo:warning=Created resource file at {:?}", rc_file_path);
                
                // 2. 准备输出文件路径
                let obj_path = format!("{}/app_icon.o", out_dir);
                let lib_path = format!("{}/libapp_icon.a", out_dir);
                
                // 清理旧文件
                let _ = std::fs::remove_file(&obj_path);
                let _ = std::fs::remove_file(&lib_path);
                
                // 3. 运行 windres (生成 COFF 对象)
                // 尝试查找 windres，优先使用 UCRT64
                let windres_cmd = "windres"; 
                // 注意：PATH 已经在上面修改过，或者由 CI 环境设置
                
                let status = std::process::Command::new(windres_cmd)
                    .args(&["--target=pe-x86-64", "-i", rc_file_path.to_str().unwrap(), "-o", &obj_path])
                    .status();
                    
                match status {
                    Ok(s) if s.success() => {
                        println!("cargo:warning=windres success: {}", obj_path);
                        
                        // 4. 运行 ar (打包成静态库)
                        let ar_cmd = "ar";
                        let status_ar = std::process::Command::new(ar_cmd)
                            .args(&["crs", &lib_path, &obj_path])
                            .status();
                            
                        match status_ar {
                            Ok(s_ar) if s_ar.success() => {
                                println!("cargo:warning=ar success: {}", lib_path);
                                
                                // 5. 链接生成的库
                                println!("cargo:rustc-link-search=native={}", out_dir);
                                println!("cargo:rustc-link-lib=static=app_icon");
                            },
                            _ => {
                                println!("cargo:warning=Failed to run ar or ar failed");
                            }
                        }
                    },
                    _ => {
                        println!("cargo:warning=Failed to run windres or windres failed. Ensure ucrt64 windres is in PATH.");
                    }
                }
            }
        }
        
        // 对于 GNU 工具链，完全跳过 tauri-build 的资源编译
        // 使用空的 WindowsAttributes（不指定图标）
        let windows = tauri_build::WindowsAttributes::new();
        let attrs = tauri_build::Attributes::new().windows_attributes(windows);
        
        if let Err(e) = tauri_build::try_build(attrs) {
             println!("cargo:warning=tauri build warning (ignored for GNU): {}", e);
        }
    } else {
        // 非 GNU 工具链（MSVC 或其他平台），正常构建
        tauri_build::build();
    }
}

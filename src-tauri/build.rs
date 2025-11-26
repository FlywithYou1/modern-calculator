fn main() {
    // 检测目标平台
    let target = std::env::var("TARGET").unwrap_or_default();
    let is_windows_gnu = target.contains("windows") && target.contains("gnu");
    
    if is_windows_gnu {
        println!("cargo:warning=Building with GNU toolchain");
        
        // 为 GNU 工具链添加 MSYS2 路径（本地构建时需要）
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
        
        // GNU 工具链：使用 embed-resource 直接编译资源文件
        // embed-resource 会生成 .a 格式（GNU 兼容），而不是 .lib（MSVC 格式）
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let icon_path = std::path::Path::new(&manifest_dir).join("icons").join("icon.ico");
        
        if icon_path.exists() {
            // 创建资源文件
            let rc_file = std::path::Path::new(&out_dir).join("gnu_resource.rc");
            
            // 使用正斜杠路径（windres 更好地处理）
            let icon_path_str = icon_path.to_string_lossy().replace('\\', "/");
            
            // 创建完整的资源文件内容（包含图标和应用程序清单）
            let rc_content = format!(
                r#"// Windows Resource File for GNU toolchain
// Icon resource
1 ICON "{icon_path}"

// Application manifest for Common Controls v6
1 24 {{
    BEGIN
    "<?xml version=""1.0"" encoding=""UTF-8"" standalone=""yes""?>\r\n"
    "<assembly xmlns=""urn:schemas-microsoft-com:asm.v1"" manifestVersion=""1.0"">\r\n"
    "  <dependency>\r\n"
    "    <dependentAssembly>\r\n"
    "      <assemblyIdentity type=""win32"" name=""Microsoft.Windows.Common-Controls"" version=""6.0.0.0"" processorArchitecture=""*"" publicKeyToken=""6595b64144ccf1df"" language=""*"" />\r\n"
    "    </dependentAssembly>\r\n"
    "  </dependency>\r\n"
    "</assembly>\r\n"
    END
}}
"#,
                icon_path = icon_path_str
            );
            
            if let Err(e) = std::fs::write(&rc_file, &rc_content) {
                println!("cargo:warning=Failed to write RC file: {}", e);
            } else {
                println!("cargo:warning=Created resource file at {:?}", rc_file);
                
                // 使用 embed-resource 编译资源
                // 这会自动调用 windres 并生成 .a 文件（GNU 格式）
                let _ = embed_resource::compile(&rc_file, embed_resource::NONE);
            }
        }
        
        // 使用 WindowsAttributes 指定一个不存在的图标路径
        // 这样 tauri-winres 就不会尝试编译资源（因为图标不存在会被跳过）
        let windows = tauri_build::WindowsAttributes::new()
            .window_icon_path("__nonexistent_icon_for_gnu__.ico");
        
        let attrs = tauri_build::Attributes::new()
            .windows_attributes(windows);
        
        tauri_build::try_build(attrs).expect("failed to run tauri build script");
    } else {
        // 非 GNU 工具链（MSVC 或其他平台），正常构建
        tauri_build::build();
    }
}

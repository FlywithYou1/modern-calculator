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
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let icon_path = std::path::Path::new(&manifest_dir).join("icons").join("icon.ico");
        
        if icon_path.exists() {
            // 创建资源文件（只包含图标，不包含内联 manifest）
            let rc_file = std::path::Path::new(&out_dir).join("gnu_resource.rc");
            
            // 使用正斜杠路径（windres 更好地处理）
            let icon_path_str = icon_path.to_string_lossy().replace('\\', "/");
            
            // 创建简单的资源文件（只包含图标）
            let rc_content = format!(
                r#"// Windows Resource File for GNU toolchain
// Application icon
1 ICON "{}"
"#,
                icon_path_str
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
        
        // 为 tauri-build 创建一个虚拟图标文件
        // 这样它就不会报错，但实际的图标由 embed-resource 编译
        let dummy_icon_path = std::path::Path::new(&out_dir).join("dummy_icon.ico");
        
        // 创建最小的有效 ICO 文件（6 字节头 + 16 字节目录项）
        // ICO 格式：https://en.wikipedia.org/wiki/ICO_(file_format)
        let ico_header: [u8; 22] = [
            0x00, 0x00, // Reserved
            0x01, 0x00, // Type: ICO
            0x01, 0x00, // Number of images: 1
            // Directory entry (16 bytes)
            0x01, // Width: 1
            0x01, // Height: 1
            0x00, // Color palette: 0
            0x00, // Reserved
            0x01, 0x00, // Color planes: 1
            0x01, 0x00, // Bits per pixel: 1
            0x0C, 0x00, 0x00, 0x00, // Size of image data: 12
            0x16, 0x00, 0x00, 0x00, // Offset to image data: 22
        ];
        
        // 最小的 BMP 数据（1x1 黑色像素）
        let bmp_data: [u8; 12] = [
            // BITMAPINFOHEADER (简化)
            0x0C, 0x00, 0x00, 0x00, // Header size: 12
            0x01, 0x00, // Width: 1
            0x01, 0x00, // Height: 1
            0x01, 0x00, // Planes: 1
            0x01, 0x00, // Bits: 1
        ];
        
        let mut ico_data = Vec::new();
        ico_data.extend_from_slice(&ico_header);
        ico_data.extend_from_slice(&bmp_data);
        
        if let Err(e) = std::fs::write(&dummy_icon_path, &ico_data) {
            println!("cargo:warning=Failed to create dummy icon: {}", e);
        }
        
        // 使用虚拟图标路径（tauri-build 需要一个存在的文件）
        let windows = tauri_build::WindowsAttributes::new()
            .window_icon_path(&dummy_icon_path);
        
        let attrs = tauri_build::Attributes::new()
            .windows_attributes(windows);
        
        // 使用 try_build 并忽略资源编译错误
        if let Err(e) = tauri_build::try_build(attrs) {
            let error_msg = format!("{}", e);
            // 如果只是资源编译错误，忽略它（我们已经用 embed-resource 编译了）
            if !error_msg.contains("Resource") && !error_msg.contains("resource") {
                panic!("tauri build failed: {}", e);
            } else {
                println!("cargo:warning=Ignoring tauri-winres error (using embed-resource instead): {}", e);
            }
        }
    } else {
        // 非 GNU 工具链（MSVC 或其他平台），正常构建
        tauri_build::build();
    }
}

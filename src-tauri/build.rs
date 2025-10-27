fn main() {
  // Windows GNU toolchain: ensure the correct resource compiler is used so we don't require MSVC.
  // Prefer the MinGW windres over MSYS one to avoid mixed path issues (e.g., C:Users... without backslashes).
  if let Ok(target) = std::env::var("TARGET") {
    if target.contains("windows-gnu") {
      // Common MinGW locations. If found, hint tauri-winres via WINDRES env var.
      const CANDIDATES: &[&str] = &[
        "C:\\msys64\\mingw64\\bin\\windres.exe",
        "C:\\msys64\\ucrt64\\bin\\windres.exe",
        "C:\\mingw64\\bin\\windres.exe",
      ];
      let chosen = CANDIDATES.iter().find(|p| std::path::Path::new(p).exists());
      if let Some(path) = chosen {
        // Instruct tauri-winres to use this specific windres.
        std::env::set_var("WINDRES", path);
        println!("cargo:warning=Using WINDRES at {} for windows-gnu target", path);
      } else {
        // If llvm-rc is in PATH, many setups will pick it automatically; otherwise, warn.
        println!(
          "cargo:warning=windows-gnu detected but no MinGW windres found in common locations. If build fails, install MSYS2 mingw64 and ensure mingw64/bin precedes usr/bin in PATH, or install LLVM and provide llvm-rc."
        );
      }
    }
  }

  tauri_build::build()
}

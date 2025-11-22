fn main() {
  unsafe {
    std::env::set_var("RC", r"C:\Users\liang\Desktop\789\mcp\src-tauri\windres-wrapper.cmd");
  }
  tauri_build::build()
}

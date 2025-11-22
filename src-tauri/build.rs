fn main() {
  println!("cargo:rustc-env=TAURI_ENV_TARGET_TRIPLE=x86_64-pc-windows-gnu");
  println!("cargo:rustc-cfg=desktop");
  // tauri_build::build()
}

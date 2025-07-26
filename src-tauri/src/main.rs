#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::env;
use tauri::{
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .setup(|app| {
      #[cfg(desktop)]
      let res = app
        .handle()
        .plugin(tauri_plugin_updater::Builder::new().pubkey("dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEE1RDRCNkNFQTVBRERBMTQKUldRVTJxMmx6cmJVcFR3UWtxdnZWdVlCL3RRVUFwOE9ReDB3cDc3VGd4NjVJOGtzQnJZZDlUU24K").build());
      if res.is_err() {
        println!("Error: {:?}", res.err());
      }
      // Create window with transparency enabled
      let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("")
        .inner_size(900.0, 700.0)
        .resizable(true)
        .min_inner_size(850.0, 600.0)
        .fullscreen(false)
        .transparent(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .build()?;

      // Apply macOS translucent vibrancy effect immediately
      #[cfg(target_os = "macos")]
      {
        apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
          .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
      }

      // Handle window close events for macOS
      #[cfg(target_os = "macos")]
      {
        let window_clone = window.clone();
        window.on_window_event(move |event| {
          if let WindowEvent::CloseRequested { api, .. } = event {
            window_clone.hide().unwrap();
            api.prevent_close();
          }
        });
      }
      // #[cfg(debug_assertions)]
      let process_arg: Vec<String> = env::args().collect();
      if process_arg.contains(&"--debug".to_string()) {
        // in prod build, if --debug is passed, open devtools
        app.get_webview_window("main").unwrap().open_devtools();
      }
      #[cfg(debug_assertions)]
      app.get_webview_window("main").unwrap().open_devtools();

      TrayIconBuilder::new()
        .on_tray_icon_event(|tray, event| match event {
          TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } => {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
          _ => {
            println!("unhandled event {event:?}");
          }
        })
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("[TAURI] Error running application");
}

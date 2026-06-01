#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::env;
use tauri::{
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};
use reqwest::Client;
use std::sync::Arc;
use tauri_plugin_opener::OpenerExt;

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

mod commands;
use commands::{fetch_rss, fetch_url, start_webhook_server, stop_webhook_server, RssCache, WebhookServerState};

#[tauri::command]
async fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
  app
    .opener()
    .open_url(url, None::<String>)
    .map_err(|e| e.to_string())
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .setup(|app| {
      app.manage(Client::builder().build().unwrap());
      app.manage(RssCache::new());
      app.manage(Arc::new(WebhookServerState::new()));
      #[cfg(desktop)]
      {
        let res = app
          .handle()
          .plugin(tauri_plugin_updater::Builder::new().pubkey("dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IENFNzFGMjVDNjFFMEI3QkIKUldTN3QrQmhYUEp4em5JRjBvTkFPRG1Zd1RsMkVuOUZKcnhwc1JOWnA4Vm03RkZocHFhTzBwY0IK").build());
        if res.is_err() {
          println!("Error: {:?}", res.err());
        }
      }
      // Create window with transparency enabled
      let builder = {
        let b = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
          .title("")
          .inner_size(1100.0, 800.0)
          .resizable(true)
          .min_inner_size(850.0, 600.0)
          .fullscreen(false)
          .transparent(true);
        // Only set title_bar_style on platforms that support it (macOS).
        // The `TitleBarStyle` type and `title_bar_style` builder are gated
        // behind macOS in this tauri version, so don't reference them on
        // non-macOS targets to avoid unresolved-symbol errors when building
        // for Windows or other OSes.
        #[cfg(target_os = "macos")]
        let b = b.title_bar_style(tauri::TitleBarStyle::Overlay);
        b
      };

      let window = builder.build()?;

      // Apply macOS translucent vibrancy effect immediately
      #[cfg(target_os = "macos")]
      {
        apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
          .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
      }

      // Handle window close events on desktop (macOS, Windows, Linux)
      // On close, hide the window instead of exiting the app.
      #[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
      {
        let window_clone = window.clone();
        window.on_window_event(move |event| {
          if let WindowEvent::CloseRequested { api, .. } = event {
            // hide() and prevent_close() are cross-platform; keep vibrancy mac-only.
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
    .invoke_handler(tauri::generate_handler![fetch_rss, fetch_url, open_external, start_webhook_server, stop_webhook_server])
    .run(tauri::generate_context!())
    .expect("[TAURI] Error running application");
}

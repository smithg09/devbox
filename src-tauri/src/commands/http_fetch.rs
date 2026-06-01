use reqwest::Client;
use tauri::State;

#[tauri::command]
pub async fn fetch_url(client: State<'_, Client>, url: String) -> Result<String, String> {
  client
    .get(&url)
    .header("User-Agent", "Mozilla/5.0 (compatible; Devbox/1.0)")
    .timeout(std::time::Duration::from_secs(15))
    .send()
    .await
    .map_err(|e| e.to_string())?
    .text()
    .await
    .map_err(|e| e.to_string())
}

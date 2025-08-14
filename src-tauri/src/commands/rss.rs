use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use reqwest::Client;
use tauri::State;

pub struct RssCache {
  pub map: Mutex<HashMap<String, (Instant, String)>>,
}

impl RssCache {
  pub fn new() -> Self {
    Self { map: Mutex::new(HashMap::new()) }
  }
}

#[tauri::command]
pub async fn fetch_rss(
  url: String,
  force: bool,
  client: State<'_, Client>,
  cache: State<'_, RssCache>,
) -> Result<String, String> {
  // 30 minutes TTL
  let ttl = Duration::from_secs(30 * 60);

  if !force {
    // Fast path: check cache
    if let Some((ts, body)) = cache.map.lock().unwrap().get(&url).cloned() {
      if ts.elapsed() < ttl {
        return Ok(body);
      }
    }
  }

  // Fetch and store
  let resp = client
    .get(&url)
    .timeout(Duration::from_secs(20))
    .header(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    )
    .send()
    .await
    .map_err(|e| e.to_string())?;

  let text = resp.text().await.map_err(|e| e.to_string())?;
  cache.map.lock().unwrap().insert(url.clone(), (Instant::now(), text.clone()));
  Ok(text)
}



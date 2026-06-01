use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tauri::{AppHandle, Emitter, State};
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    net::TcpListener,
    sync::Mutex,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebhookRequest {
    pub method: String,
    pub path: String,
    pub headers: HashMap<String, String>,
    pub body: String,
}

pub struct WebhookServerState {
    pub shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

impl WebhookServerState {
    pub fn new() -> Self {
        Self {
            shutdown_tx: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub async fn start_webhook_server(
    port: u16,
    app: AppHandle,
    state: State<'_, Arc<WebhookServerState>>,
) -> Result<(), String> {
    // Stop any existing server first
    let mut lock = state.shutdown_tx.lock().await;
    if let Some(tx) = lock.take() {
        let _ = tx.send(());
    }

    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

    let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    *lock = Some(shutdown_tx);
    drop(lock);

    let app_clone = app.clone();
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = &mut shutdown_rx => break,
                result = listener.accept() => {
                    match result {
                        Ok((stream, _)) => {
                            let app_inner = app_clone.clone();
                            tokio::spawn(async move {
                                if let Ok(req) = parse_request(stream).await {
                                    let _ = app_inner.emit("webhook-request", req);
                                }
                            });
                        }
                        Err(_) => break,
                    }
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_webhook_server(
    state: State<'_, Arc<WebhookServerState>>,
) -> Result<(), String> {
    let mut lock = state.shutdown_tx.lock().await;
    if let Some(tx) = lock.take() {
        let _ = tx.send(());
    }
    Ok(())
}

async fn parse_request(mut stream: tokio::net::TcpStream) -> Result<WebhookRequest, ()> {
    let (reader, mut writer) = stream.split();
    let mut buf_reader = BufReader::new(reader);

    // Read request line
    let mut request_line = String::new();
    buf_reader.read_line(&mut request_line).await.map_err(|_| ())?;
    let mut parts = request_line.trim().splitn(3, ' ');
    let method = parts.next().unwrap_or("GET").to_string();
    let path = parts.next().unwrap_or("/").to_string();

    // Read headers
    let mut headers: HashMap<String, String> = HashMap::new();
    let mut content_length: usize = 0;
    loop {
        let mut line = String::new();
        buf_reader.read_line(&mut line).await.map_err(|_| ())?;
        let trimmed = line.trim();
        if trimmed.is_empty() {
            break;
        }
        if let Some(idx) = trimmed.find(':') {
            let key = trimmed[..idx].trim().to_lowercase();
            let val = trimmed[idx + 1..].trim().to_string();
            if key == "content-length" {
                content_length = val.parse().unwrap_or(0);
            }
            headers.insert(key, val);
        }
    }

    // Read body
    let body = if content_length > 0 {
        let mut body_buf = vec![0u8; content_length.min(1_048_576)];
        buf_reader.read_exact(&mut body_buf).await.map_err(|_| ())?;
        String::from_utf8_lossy(&body_buf).to_string()
    } else {
        String::new()
    };

    // Send HTTP 200 response
    let response = "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{}";
    let _ = writer.write_all(response.as_bytes()).await;

    Ok(WebhookRequest {
        method,
        path,
        headers,
        body,
    })
}

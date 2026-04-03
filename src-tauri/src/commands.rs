use reqwest::header::{HeaderMap, HeaderValue, COOKIE, USER_AGENT};
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;

const BASE_URL: &str = "https://api.vrchat.cloud/api/1";
const UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

pub struct AuthState(pub Mutex<Option<String>>);

fn build_headers(token: &str) -> HeaderMap {
    let mut headers = HeaderMap::new();
    let cookie = format!("auth={}", token);
    headers.insert(COOKIE, HeaderValue::from_str(&cookie).unwrap());
    headers.insert(USER_AGENT, HeaderValue::from_static(UA));
    headers
}

#[tauri::command]
pub async fn set_auth_token(state: State<'_, AuthState>, token: String) -> Result<(), String> {
    let mut auth = state.0.lock().map_err(|e| e.to_string())?;
    *auth = Some(token);
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(state: State<'_, AuthState>) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/auth/user", BASE_URL))
        .headers(build_headers(&token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    resp.json::<Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_friends(
    state: State<'_, AuthState>,
    offline: bool,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let mut all_friends: Vec<Value> = Vec::new();
    let page_size = 100;
    let mut offset = 0;

    loop {
        let resp = client
            .get(format!("{}/auth/user/friends", BASE_URL))
            .headers(build_headers(&token))
            .query(&[
                ("offline", if offline { "true" } else { "false" }),
                ("n", &page_size.to_string()),
                ("offset", &offset.to_string()),
            ])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("API error: {}", resp.status()));
        }

        let page: Vec<Value> = resp.json().await.map_err(|e| e.to_string())?;
        let count = page.len();
        all_friends.extend(page);

        if count < page_size {
            break;
        }
        offset += page_size;
    }

    Ok(Value::Array(all_friends))
}

#[tauri::command]
pub async fn get_instance(
    state: State<'_, AuthState>,
    instance_id: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/instances/{}", BASE_URL, instance_id))
        .headers(build_headers(&token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    resp.json::<Value>().await.map_err(|e| e.to_string())
}

use reqwest::header::{HeaderMap, HeaderValue, COOKIE, USER_AGENT};
use serde_json::json;
use serde_json::Value;
use std::sync::Mutex;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

const BASE_URL: &str = "https://api.vrchat.cloud/api/1";
const UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const AUTH_STORE_FILE: &str = "auth.json";
const AUTH_TOKEN_KEY: &str = "auth_token";

pub struct AuthState(pub Mutex<Option<String>>);

pub fn load_persisted_auth_token(app: &AppHandle) -> Result<Option<String>, String> {
    let store = app.store(AUTH_STORE_FILE).map_err(|e| e.to_string())?;
    Ok(store
        .get(AUTH_TOKEN_KEY)
        .and_then(|value| value.as_str().map(str::to_owned)))
}

fn persist_auth_token(app: &AppHandle, token: &str) -> Result<(), String> {
    let store = app.store(AUTH_STORE_FILE).map_err(|e| e.to_string())?;
    store.set(AUTH_TOKEN_KEY.to_string(), json!(token));
    store.save().map_err(|e| e.to_string())
}

fn clear_persisted_auth_token(app: &AppHandle) -> Result<(), String> {
    let store = app.store(AUTH_STORE_FILE).map_err(|e| e.to_string())?;
    store.set(AUTH_TOKEN_KEY.to_string(), Value::Null);
    store.save().map_err(|e| e.to_string())
}

fn build_headers(token: &str) -> HeaderMap {
    let mut headers = HeaderMap::new();
    let cookie = format!("auth={}", token);
    headers.insert(COOKIE, HeaderValue::from_str(&cookie).unwrap());
    headers.insert(USER_AGENT, HeaderValue::from_static(UA));
    headers
}

#[tauri::command]
pub async fn set_auth_token(
    app: AppHandle,
    state: State<'_, AuthState>,
    token: String,
) -> Result<(), String> {
    persist_auth_token(&app, &token)?;
    let mut auth = state.0.lock().map_err(|e| e.to_string())?;
    *auth = Some(token);
    Ok(())
}

#[tauri::command]
pub async fn clear_auth_token(app: AppHandle, state: State<'_, AuthState>) -> Result<(), String> {
    clear_persisted_auth_token(&app)?;
    let mut auth = state.0.lock().map_err(|e| e.to_string())?;
    *auth = None;
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
pub async fn get_notifications(
    state: State<'_, AuthState>,
    notification_type: Option<String>,
    sent: Option<bool>,
    hidden: Option<bool>,
    offset: Option<u32>,
    n: Option<u32>,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let mut params: Vec<(&str, String)> = Vec::new();

    if let Some(value) = notification_type
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
    {
        params.push(("type", value));
    }

    if let Some(value) = sent {
        params.push(("sent", value.to_string()));
    }

    if let Some(value) = hidden {
        params.push(("hidden", value.to_string()));
    }

    if let Some(value) = offset {
        params.push(("offset", value.to_string()));
    }

    if let Some(value) = n {
        params.push(("n", value.to_string()));
    }

    let client = reqwest::Client::new();
    let mut req = client
        .get(format!("{}/auth/user/notifications", BASE_URL))
        .headers(build_headers(&token));

    if !params.is_empty() {
        req = req.query(&params);
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    resp.json::<Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_notification(
    state: State<'_, AuthState>,
    notification_id: String,
) -> Result<(), String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .put(format!(
            "{}/auth/user/notifications/{}/hide",
            BASE_URL, notification_id
        ))
        .headers(build_headers(&token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    Ok(())
}

#[tauri::command]
pub async fn clear_all_notifications(state: State<'_, AuthState>) -> Result<(), String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .put(format!("{}/auth/user/notifications/clear", BASE_URL))
        .headers(build_headers(&token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    Ok(())
}

#[tauri::command]
pub async fn get_user(
    state: State<'_, AuthState>,
    user_id: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/users/{}", BASE_URL, user_id))
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
pub async fn get_mutual_friends(
    state: State<'_, AuthState>,
    user_id: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/users/{}/mutuals/friends", BASE_URL, user_id))
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
pub async fn get_group(
    state: State<'_, AuthState>,
    group_id: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/groups/{}", BASE_URL, group_id))
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

#[tauri::command]
pub async fn get_world(
    state: State<'_, AuthState>,
    world_id: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/worlds/{}", BASE_URL, world_id))
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
pub async fn get_own_prints(
    state: State<'_, AuthState>,
    user_id: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/prints/user/{}", BASE_URL, user_id))
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
pub async fn search_worlds(
    state: State<'_, AuthState>,
    query: String,
    tags: Vec<String>,
    offset: u32,
    n: u32,
    sort_field: Option<String>,
    order: Option<String>,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let sort = sort_field.unwrap_or_else(|| "popularity".to_string());
    let order_val = order.unwrap_or_else(|| "descending".to_string());

    let client = reqwest::Client::new();
    let mut params: Vec<(&str, String)> = vec![
        ("n", n.to_string()),
        ("offset", offset.to_string()),
        ("sort", sort),
        ("order", order_val),
        ("releaseStatus", "public".to_string()),
    ];
    if !query.is_empty() {
        params.push(("search", query));
    }
    for tag in &tags {
        params.push(("tag", tag.clone()));
    }

    let resp = client
        .get(format!("{}/worlds", BASE_URL))
        .headers(build_headers(&token))
        .query(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    resp.json::<Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_instances(state: State<'_, AuthState>) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/instances/recent", BASE_URL))
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
pub async fn invite_myself_to_instance(
    state: State<'_, AuthState>,
    location: String,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/invite/myself/to/{}", BASE_URL, location))
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
pub async fn invite_user(
    state: State<'_, AuthState>,
    user_id: String,
    instance_id: String,
    message_slot: Option<u32>,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let payload = json!({
        "instanceId": instance_id,
        "messageSlot": message_slot.unwrap_or(0),
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/invite/{}", BASE_URL, user_id))
        .headers(build_headers(&token))
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    resp.json::<Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_instance(
    state: State<'_, AuthState>,
    world_id: String,
    instance_type: String,
    region: String,
    owner_id: Option<String>,
    can_request_invite: Option<bool>,
) -> Result<Value, String> {
    let token = {
        let auth = state.0.lock().map_err(|e| e.to_string())?;
        auth.clone().ok_or_else(|| "Not authenticated".to_string())?
    };

    let mut payload = json!({
        "worldId": world_id,
        "type": instance_type,
        "region": region,
        "canRequestInvite": can_request_invite.unwrap_or(false),
    });

    if let Some(owner) = owner_id
        .map(|id| id.trim().to_string())
        .filter(|id| !id.is_empty())
    {
        payload["ownerId"] = json!(owner);
    }

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/instances", BASE_URL))
        .headers(build_headers(&token))
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API error: {}", resp.status()));
    }

    resp.json::<Value>().await.map_err(|e| e.to_string())
}

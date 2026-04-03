mod commands;

use commands::AuthState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AuthState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::set_auth_token,
            commands::clear_auth_token,
            commands::get_current_user,
            commands::get_user,
            commands::get_mutual_friends,
            commands::get_group,
            commands::get_friends,
            commands::get_instance,
            commands::get_world,
            commands::get_own_prints,
        ])
        .setup(|app| {
            if let Some(token) = commands::load_persisted_auth_token(app.handle())? {
                let auth = app.state::<AuthState>();
                let mut current = auth
                    .0
                    .lock()
                    .map_err(|_| "failed to lock auth state")?;
                *current = Some(token);
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

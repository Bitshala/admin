use std::env;

pub fn get_auth_token(role: &str) -> String {
    match role {
        "ta" => env::var("AUTH_TOKEN_TA").unwrap_or_else(|_| "default-token-ta".to_string()),
        "participant" => env::var("AUTH_TOKEN_PARTICIPANT")
            .unwrap_or_else(|_| "default-token-participant".to_string()),
        _ => "default-token".to_string(),
    }
}
// TA email mappings (these don't need to be in env)
pub const TA_EMAILS: &[(&str, &str)] = &[
    ("anmolsharma0234@gmail.com", "AnmolSharma"),
    ("balajic86@gmail.com", "Bala"),
    ("raj@bitshala.org", "Raj"),
    ("setu@bitshala.org", "Setu"),
    ("delcinraj@gmail.com", "Delcin"),
    ("beulahebenezer777@gmail.com", "Beulah"),
];

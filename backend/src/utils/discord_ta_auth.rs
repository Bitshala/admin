
use crate::utils::constants::get_auth_token;
use actix_web::{HttpResponse, Responder, Result, error::ErrorInternalServerError, get, web};
use reqwest::Client;
use serde::Deserialize;
use std::env;


#[derive(Deserialize)]
pub struct OAuthQuery {
    pub code: String,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct User {
    id: String,
    username: String,
    email: Option<String>,
    global_name: Option<String>,
}

#[derive(Deserialize)]
struct Member {
    roles: Vec<String>,
}

#[get("/callback")]
pub async fn discord_ta_oauth(query: web::Query<OAuthQuery>) -> Result<impl Responder> {
    let client_id = env::var("DISCORD_CLIENT_ID").expect("Missing DISCORD_CLIENT_ID");
    let client_secret = env::var("DISCORD_CLIENT_SECRET").expect("Missing DISCORD_CLIENT_SECRET");
    let redirect_uri = env::var("DISCORD_TA_URI").expect("Missing DISCORD_REDIRECT_URI");
    let target_guild_id = env::var("TARGET_GUILD_ID").expect("Missing TARGET_GUILD_ID");
    let ta_role_id = env::var("TA_ROLE_ID").expect("Missing TA_ROLE_ID");
    let bot_token = env::var("DISCORD_BOT_TOKEN").expect("Missing DISCORD_BOT_TOKEN");
    let auth_token = get_auth_token("ta");
    
    let client = Client::new();

    // Step 1: Exchange code for access token
    let token_resp = client
        .post("https://discord.com/api/oauth2/token")
        .form(&[
            ("client_id", &client_id),
            ("client_secret", &client_secret),
            ("grant_type", &"authorization_code".to_string()),
            ("code", &query.code),
            ("redirect_uri", &redirect_uri),
        ])
        .send()
        .await
        .map_err(|_| ErrorInternalServerError("Failed to contact Discord API"))?;

    let status = token_resp.status();
    let text = token_resp
        .text()
        .await
        .map_err(|_| ErrorInternalServerError("Failed to read Discord response"))?;

    println!("token exchange response: {}", text);

    if !status.is_success() {
        return Err(ErrorInternalServerError(format!(
            "Token exchange failed: {}",
            text
        )));
    }

    let token_response: TokenResponse = serde_json::from_str(&text).map_err(|err| {
        println!("JSON parsing failed: {:?}", err);
        ErrorInternalServerError(format!("Invalid token JSON: {}", text))
    })?;

    // Step 2: Get user info to extract user_id
    let user_resp = client
        .get("https://discord.com/api/users/@me")
        .bearer_auth(&token_response.access_token)
        .send()
        .await
        .map_err(|_| ErrorInternalServerError("Failed to get user info"))?;

    let user_text = user_resp
        .text()
        .await
        .map_err(|_| ErrorInternalServerError("Failed to read user response"))?;

    println!("Discord user response: {}", user_text);

    let user: User = serde_json::from_str(&user_text)
        .map_err(|err| {
            println!("User JSON parsing failed: {:?}", err);
            ErrorInternalServerError("User info JSON error")
        })?;

    let user_id = user.id;
    println!("Discord Login - User ID: {}", user_id);
    println!("Discord Login - Username: {}", user.username);
    println!("Discord Login - Display Name: {}", user.global_name.as_deref().unwrap_or("None"));
    println!("Discord Login - Email: {}", user.email.as_deref().unwrap_or("None"));

    // Step 3: Use bot token to fetch member info in guild
    println!("Fetching member info for user {} in guild {}", user_id, target_guild_id);
    let member_resp = client
        .get(format!(
            "https://discord.com/api/guilds/{}/members/{}",
            target_guild_id, user_id
        ))
        .header("Authorization", format!("Bot {}", bot_token))
        .send()
        .await;

    // Handle member response - if user is not in guild or request fails,
    // we still want to continue and redirect to unauthorized page
    let member: Member = match member_resp {
        Ok(resp) => {
            let status = resp.status();
            println!("Guild member API response status: {}", status);
            if status.is_success() {
                match resp.json().await {
                    Ok(json) => json,
                    Err(e) => {
                        println!("Failed to parse member JSON: {:?}", e);
                        let redirect_url = "https://admin.bitshala.org/unauthorized".to_string();
                        return Ok(HttpResponse::Found()
                            .append_header(("Location", redirect_url))
                            .finish());
                    }
                }
            } else {
                println!("Guild member API failed with status: {}", status);
                let redirect_url = "https://admin.bitshala.org/unauthorized".to_string();
                return Ok(HttpResponse::Found()
                    .append_header(("Location", redirect_url))
                    .finish());
            }
        },
        Err(e) => {
            println!("Failed to contact Discord API for guild member info: {:?}", e);
            let redirect_url = "https://admin.bitshala.org/unauthorized".to_string();
            return Ok(HttpResponse::Found()
                .append_header(("Location", redirect_url))
                .finish());
        }
    };

    let has_ta_role = member.roles.contains(&ta_role_id);
    println!("User roles: {:?}", member.roles);
    println!("TA role ID: {}", ta_role_id);
    println!("Has TA role: {}", has_ta_role);


    let redirect_url = if has_ta_role {
        // Redirect back to your login page with token or flags
        let encoded_token = urlencoding::encode(&auth_token);
        format!(
            "http://localhost:5173/select?auth=discord&token={}",
            encoded_token
        )
    } else {
        // Unauthorized page - either no TA role or not in database
        let reason = if !has_ta_role { "missing TA role" } else { "not in database" };
        println!("Access denied - {}", reason);
        "http://localhost:5173/unauthorized".to_string()
    };
    
    println!("Redirecting to: {}", redirect_url);

    Ok(HttpResponse::Found()
        .append_header(("Location", redirect_url))
        .finish())
}

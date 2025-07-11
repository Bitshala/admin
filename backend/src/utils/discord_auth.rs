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
}

#[derive(Deserialize)]
struct Member {
    roles: Vec<String>,
}

#[get("/discord/callback")]
pub async fn discord_oauth(query: web::Query<OAuthQuery>) -> Result<impl Responder> {
    let client_id = env::var("DISCORD_CLIENT_ID").expect("Missing DISCORD_CLIENT_ID");
    let client_secret = env::var("DISCORD_CLIENT_SECRET").expect("Missing DISCORD_CLIENT_SECRET");
    let redirect_uri = env::var("DISCORD_REDIRECT_URI").expect("Missing DISCORD_REDIRECT_URI");
    let target_guild_id = env::var("TARGET_GUILD_ID").expect("Missing TARGET_GUILD_ID");
    let target_role_id = env::var("TARGET_ROLE_ID").expect("Missing TARGET_ROLE_ID");
    let bot_token = env::var("DISCORD_BOT_TOKEN").expect("Missing DISCORD_BOT_TOKEN");
    let auth_token = get_auth_token();
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
    let user: User = client
        .get("https://discord.com/api/users/@me")
        .bearer_auth(&token_response.access_token)
        .send()
        .await
        .map_err(|_| ErrorInternalServerError("Failed to get user info"))?
        .json()
        .await
        .map_err(|_| ErrorInternalServerError("User info JSON error"))?;

    let user_id = user.id;

    // Step 3: Use bot token to fetch member info in guild
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
        Ok(resp) => match resp.json().await {
            Ok(json) => json,
            Err(_) => {
                // User might not be in guild, redirect to unauthorized
                let redirect_url = "https://admin.bitshala.org/unauthorized".to_string();
                return Ok(HttpResponse::Found()
                    .append_header(("Location", redirect_url))
                    .finish());
            }
        },
        Err(_) => {
            // Failed to contact Discord API for guild member info
            let redirect_url = "https://admin.bitshala.org/unauthorized".to_string();
            return Ok(HttpResponse::Found()
                .append_header(("Location", redirect_url))
                .finish());
        }
    };

    let has_role = member.roles.contains(&target_role_id);

    let redirect_url = if has_role {
        // Redirect back to your login page with token or flags
        format!(
            "https://admin.bitshala.org/select?auth=discord&token={}",
            auth_token
        )
    } else {
        // Unauthorized page
        "https://admin.bitshala.org/unauthorized".to_string()
    };

    Ok(HttpResponse::Found()
        .append_header(("Location", redirect_url))
        .finish())
}

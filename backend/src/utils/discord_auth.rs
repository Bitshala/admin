use actix_web::{HttpResponse, Responder, get, web};
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
pub async fn discord_oauth(query: web::Query<OAuthQuery>) -> impl Responder {
    let client_id = env::var("DISCORD_CLIENT_ID").expect("Missing DISCORD_CLIENT_ID");
    let client_secret = env::var("DISCORD_CLIENT_SECRET").expect("Missing DISCORD_CLIENT_SECRET");
    let redirect_uri = env::var("DISCORD_REDIRECT_URI").expect("Missing DISCORD_REDIRECT_URI");
    let target_guild_id = env::var("TARGET_GUILD_ID").expect("Missing TARGET_GUILD_ID");
    let target_role_id = env::var("TARGET_ROLE_ID").expect("Missing TARGET_ROLE_ID");
    let bot_token = env::var("DISCORD_BOT_TOKEN").expect("Missing DISCORD_BOT_TOKEN");
    let TOKEN = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";
    let client = Client::new();

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
        .await;

    let token_response = match token_resp {
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            println!("token exchange response: {}", text);
            if !status.is_success() {
                return HttpResponse::InternalServerError()
                    .body(format!("Token exchange failed: {}", text));
            }
            match serde_json::from_str::<TokenResponse>(&text) {
                Ok(json) => json,
                Err(err) => {
                    println!("JSON parsing failed: {:?}", err);
                    return HttpResponse::InternalServerError()
                        .body(format!("Invalid token JSON: {}", text));
                }
            }
        }
        Err(err) => {
            println!("Request failed: {:?}", err);
            return HttpResponse::InternalServerError().body("Token request failed");
        }
    };

    // Step 2: Get user info to extract user_id
    let user_resp = client
        .get("https://discord.com/api/users/@me")
        .bearer_auth(&token_response.access_token)
        .send()
        .await;

    let user: User = match user_resp {
        Ok(resp) => match resp.json().await {
            Ok(json) => json,
            Err(_) => return HttpResponse::InternalServerError().body("User info JSON error"),
        },
        Err(_) => return HttpResponse::InternalServerError().body("Failed to get user info"),
    };

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

    let member: Member = match member_resp {
        Ok(resp) => match resp.json().await {
            Ok(json) => json,
            Err(_) => {
                return HttpResponse::Ok()
                    .json(serde_json::json!({ "is_member": false, "has_role": false }));
            }
        },
        Err(_) => {
            return HttpResponse::Ok()
                .json(serde_json::json!({ "is_member": false, "has_role": false }));
        }
    };

    let has_role = member.roles.contains(&target_role_id);

    let redirect_url = if has_role {
        // Redirect back to your login page with token or flags
        format!("http://localhost:5173/select?auth=discord&token={}", TOKEN)
    } else {
        // Unauthorized page
        "http://localhost:5173/unauthorized".to_string()
    };

    HttpResponse::Found()
        .append_header(("Location", redirect_url))
        .finish()
}

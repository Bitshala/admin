use crate::database::operations::match_discord_username;
use crate::utils::constants::get_auth_token;
use actix_web::{HttpResponse, Responder, Result, error::ErrorInternalServerError, get, web};
use reqwest::Client;
use serde::Deserialize;
use std::env;
use std::path::PathBuf;

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

#[get("/participant/callback")]
pub async fn discord_participant_oauth(query: web::Query<OAuthQuery>) -> Result<impl Responder> {
    let client_id = env::var("DISCORD_CLIENT_ID").expect("Missing DISCORD_CLIENT_ID");
    let client_secret = env::var("DISCORD_CLIENT_SECRET").expect("Missing DISCORD_CLIENT_SECRET");
    let redirect_uri =
        env::var("DISCORD_PARTICIPANT_URI").expect("Missing DISCORD_PARTICIPANT_REDIRECT_URI");
    let target_guild_id = env::var("TARGET_GUILD_ID").expect("Missing TARGET_GUILD_ID");
    let pb_role_id = env::var("PB_ROLE_ID").expect("Missing PB_ROLE_ID");
    let bot_token = env::var("DISCORD_BOT_TOKEN").expect("Missing DISCORD_BOT_TOKEN");
    let student_url = env::var("STUDENT_URL").expect("Missing STUDENT_URL");

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

    let user: User = serde_json::from_str(&user_text).map_err(|err| {
        println!("User JSON parsing failed: {:?}", err);
        ErrorInternalServerError("User info JSON error")
    })?;

    let user_id = user.id;
    println!("Discord Login - User ID: {}", user_id);
    println!("Discord Login - Username: {}", user.username);
    println!(
        "Discord Login - Display Name: {}",
        user.global_name.as_deref().unwrap_or("None")
    );
    println!(
        "Discord Login - Email: {}",
        user.email.as_deref().unwrap_or("None")
    );

    // Step 3: Use bot token to fetch member info in guild
    println!(
        "Fetching member info for user {} in guild {}",
        user_id, target_guild_id
    );
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
                        let redirect_url = format!("{}/unauthorized", student_url);
                        return Ok(HttpResponse::Found()
                            .append_header(("Location", redirect_url))
                            .finish());
                    }
                }
            } else {
                println!("Guild member API failed with status: {}", status);
                let redirect_url = format!("{}/unauthorized", student_url);
                return Ok(HttpResponse::Found()
                    .append_header(("Location", redirect_url))
                    .finish());
            }
        }
        Err(e) => {
            println!(
                "Failed to contact Discord API for guild member info: {:?}",
                e
            );
            let redirect_url = format!("{}/unauthorized", student_url);
            return Ok(HttpResponse::Found()
                .append_header(("Location", redirect_url))
                .finish());
        }
    };

    let has_pb_role = member.roles.contains(&pb_role_id);
    println!("User roles: {:?}", member.roles);
    println!("PB role ID: {}", pb_role_id);
    println!("Has PB role: {}", has_pb_role);

    // Check if user exists in pb_cohort database
    let db_path = PathBuf::from("pb_cohort.db");
    println!("Looking for database at: {:?}", db_path.canonicalize());
    println!("Current working directory: {:?}", std::env::current_dir());
    let user_in_db = match match_discord_username(&db_path, user.email.as_deref().unwrap_or("")) {
        Ok(participant) => {
            println!("User found in pb_cohort database: {}", participant.name);
            true
        }
        Err(e) => {
            println!(
                "User not found in pb_cohort database: {} - Error: {:?}",
                user.username, e
            );
            false
        }
    };

    let redirect_url = if has_pb_role && user_in_db {
        // Redirect to StudentDetailPage with student parameter and participant token
        let encoded_email = urlencoding::encode(user.email.as_deref().unwrap_or(""));
        let encoded_username = urlencoding::encode(&user.username);
        let participant_token = get_auth_token("participant");
        format!(
            "{}/student?student={}&auth=discord&email={}&username={}&token={}&role=participant",
            student_url, encoded_username, encoded_email, encoded_username, participant_token
        )
    } else {
        // Unauthorized page - either no PB role or not in database
        let reason = if !has_pb_role {
            "missing PB role"
        } else {
            "not in database"
        };
        println!("Access denied - {}", reason);
        format!("{}/unauthorized", student_url)
    };

    println!("Redirecting to: {}", redirect_url);

    Ok(HttpResponse::Found()
        .append_header(("Location", redirect_url))
        .finish())
}

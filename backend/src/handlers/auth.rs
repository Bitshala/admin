use crate::utils::constants::{TA_EMAILS, get_auth_token};
use crate::utils::types::TaLogin;
use actix_web::{HttpResponse, Responder, post, web};
use log::info;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum TA {
    AnmolSharma,
    Bala,
    Raj,
    Setu,
    Delcin,
    Beulah,
}

impl TA {
    pub fn all_variants() -> &'static [TA] {
        &[
            TA::AnmolSharma,
            TA::Bala,
            TA::Raj,
            TA::Setu,
            TA::Delcin,
            TA::Beulah,
        ]
    }

    pub fn from_email(email: &str) -> Option<Self> {
        for (ta_email, ta_name) in TA_EMAILS {
            if email == *ta_email {
                return match *ta_name {
                    "AnmolSharma" => Some(TA::AnmolSharma),
                    "Bala" => Some(TA::Bala),
                    "Raj" => Some(TA::Raj),
                    "Setu" => Some(TA::Setu),
                    "Delcin" => Some(TA::Delcin),
                    "Beulah" => Some(TA::Beulah),
                    _ => None,
                };
            }
        }
        None
    }
}

#[post("/login")]
pub async fn login(item: web::Json<TaLogin>) -> impl Responder {
    info!("TA login attempt: {:?}", item.gmail);
    if let Some(_ta) = TA::from_email(&item.gmail) {
        info!("TA login success.");
        HttpResponse::Ok().json(serde_json::json!({
        "token": get_auth_token()
        }))
    } else {
        info!("TA login failed: not authorized.");
        HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "Access denied"
        }))
    }
}

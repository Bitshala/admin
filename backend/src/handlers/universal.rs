use crate::database::operations::read_from_db;
use crate::utils::types::Table;
use actix_web::{HttpResponse, Responder, post, web};
use log::info;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Deserialize)]
pub struct SwitchCohortRequest {
    pub db_path: String,
}

#[derive(Debug, Serialize)]
pub struct SwitchCohortResponse {
    pub success: bool,
    pub message: String,
    pub new_db_path: String,
}

#[post("/switch_cohort")]
pub async fn switch_cohort_api(
    req: web::Json<SwitchCohortRequest>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    info!("Switching cohort to database: {}", req.db_path);

    let new_path = PathBuf::from(&req.db_path);

    match read_from_db(&new_path) {
        Ok(new_table) => {
            let mut table = state.lock().unwrap();
            *table = new_table;

            info!("Successfully switched to database: {}", req.db_path);
            HttpResponse::Ok().json(SwitchCohortResponse {
                success: true,
                message: "Successfully switched cohort database".to_string(),
                new_db_path: req.db_path.clone(),
            })
        }
        Err(e) => {
            let error_msg = format!("Failed to switch database: {:?}", e);
            info!("{}", error_msg);
            HttpResponse::BadRequest().json(SwitchCohortResponse {
                success: false,
                message: error_msg,
                new_db_path: req.db_path.clone(),
            })
        }
    }
}

use crate::database::operations::register_cohort_participant;
use crate::handlers::students::weekly_data::{get_github_to_name_mapping, get_github_username};
use crate::utils::classroom::{Assignment, get_submitted_assignments};
use crate::utils::types::{CohortParticipant, RowData, Table};
use actix_web::{HttpResponse, Responder, get, post, web};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackgroundData {
    pub describe_yourself: String,
    pub background: String,
    pub skills: String,
    pub location: String,
    pub why: String,
    pub year: String,
    pub book: String,
}

impl Default for BackgroundData {
    fn default() -> Self {
        BackgroundData {
            describe_yourself: String::new(),
            background: String::new(),
            skills: String::new(),
            location: String::new(),
            why: String::new(),
            year: String::new(),
            book: String::new(),
        }
    }
}

pub fn get_background_data(path: &PathBuf, email: &str) -> BackgroundData {
    use rusqlite::{Connection, params};

    let conn = Connection::open(path).ok().unwrap();
    let mut stmt = conn.prepare(
        "SELECT  \"Describe Yourself\" , Background, Skills, Location, Year, Why, Books FROM participants WHERE Email = ?1",
    ).ok().unwrap();

    let rows = stmt
        .query_map(params![email], |row| {
            Ok(BackgroundData {
                describe_yourself: row.get(0)?,
                background: row.get(1)?,
                skills: row.get(2)?,
                location: row.get(3)?,
                year: row.get(4)?,
                why: row.get(5)?,
                book: row.get(6)?,
            })
        })
        .ok()
        .unwrap();

    rows.flatten()
        .next()
        .unwrap_or_else(BackgroundData::default)
}

#[get("/students/{week}/{cohort_name}/{student_name}")]
pub async fn get_student_repo_link(info: web::Path<(i32, String, String)>) -> impl Responder {
    let (week, cohort_name, student_name) = info.into_inner();
    let assignments = get_submitted_assignments(week).await.unwrap();
    let submitted: Vec<&Assignment> = assignments.iter().filter(|a| a.is_submitted()).collect();

    let db_path = PathBuf::from(format!("{}_cohort.db", cohort_name));
    let mut student_url = "".to_string();

    //for loops conclude to unit type ()
    for assignment in &submitted {
        if let Some(participant_name) =
            get_github_to_name_mapping(&db_path, &assignment.github_username)
        {
            if participant_name == student_name {
                student_url = (assignment.student_repository_url).to_string();
            }
        }
    }
    // Return as JSON object with a "url" field
    return HttpResponse::Ok().json(serde_json::json!({ "url": student_url }));
}

#[get("/data/{student_email}")]
pub async fn get_student_background_data(info: web::Path<(String, String)>) -> impl Responder {
    let (cohort_name, student_email) = info.into_inner();
    let db_path = PathBuf::from(format!("{}_cohort.db", cohort_name));

    let data = get_background_data(&db_path, &student_email);

    HttpResponse::Ok().json(data)
}

#[get("/student/github/{name}")]
pub async fn get_student_github_username(info: web::Path<(String, String)>) -> impl Responder {
    let (cohort_name, student_name) = info.into_inner();
    let db_path = PathBuf::from(format!("{}_cohort.db", cohort_name));

    let data = get_github_username(&db_path, &student_name);

    HttpResponse::Ok().json(data)
}

#[post("/register")]
pub async fn register_user(data: web::Json<CohortParticipant>) -> impl Responder {
    let data = data.into_inner();
    info!("Registering cohort participant: {:?}", data.role);

    let db_path = PathBuf::from(format!("{}.db", data.role.clone()));

    let participant_data = data.clone();

    if let Err(e) = register_cohort_participant(&db_path, data) {
        warn!("Failed to register cohort participant: {e}");
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({ "error": e.to_string() }));
    }

    info!("Cohort participant registered successfully.");

    // if participant is registered successfully, send data to external API

    let api_data = HashMap::from([
        ("name", participant_data.name),
        ("email", participant_data.email),
        ("role", participant_data.role),
    ]);

    let client = reqwest::Client::new();
    client
        .post("http://localhost:8080/bot/invite")
        .header("Content-Type", "application/json")
        .json(&api_data)
        .send()
        .await
        .map_err(|_| HttpResponse::InternalServerError().finish())
        .unwrap();

    HttpResponse::Ok().json(serde_json::json!({ "status": "success" }))
}

#[get("/individual_data/{student_name}")]
pub async fn get_individual_student_data(
    info: web::Path<String>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let student_name = info.into_inner();

    // Single lock scope for data collection
    let mut student_data: Vec<RowData> = {
        let state_table = state.lock().unwrap();
        state_table
            .rows
            .iter()
            .filter(|row| row.name == student_name)
            .cloned()
            .collect()
    }; // Lock released here

    // Sort by week after releasing the lock
    student_data.sort_by_key(|row| row.week);

    HttpResponse::Ok().json(student_data)
}

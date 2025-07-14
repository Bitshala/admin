use crate::handlers::students::weekly_data::get_github_to_name_mapping;
use crate::utils::classroom::{Assignment, get_submitted_assignments};
use crate::utils::types::{RowData, Table, CohortParticipant};
use crate::database::operations::register_cohort_participant;
use actix_web::{HttpResponse, Responder, get, web};
use log::{info, warn};
use serde::{Deserialize, Serialize};
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

#[get("/students/{week}/{student_name}")]
pub async fn get_student_repo_link(info: web::Path<(i32, String)>) -> impl Responder {
    let (week, student_name) = info.into_inner();
    let assignments = get_submitted_assignments(week).await.unwrap();
    let submitted: Vec<&Assignment> = assignments.iter().filter(|a| a.is_submitted()).collect();

    let db_path = PathBuf::from("classroom.db");
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
pub async fn get_student_background_data(info: web::Path<String>) -> impl Responder {
    let student_email = info.into_inner();
    let db_path = PathBuf::from("classroom.db");

    let data = get_background_data(&db_path, &student_email);
    println!("{:#?}", data);

    HttpResponse::Ok().json(data)
}

#[get("/register")]
pub async fn register_user(data: web::Json<CohortParticipant>) -> impl Responder {
    let db_path = PathBuf::from("cohortparticipants.db");
    
    if let Err(e) = register_cohort_participant(&db_path, data.into_inner()) {
        warn!("Failed to register cohort participant: {e}");
        return HttpResponse::InternalServerError().json(serde_json::json!({ "error": e.to_string() }));
    }
    
    info!("Cohort participant registered successfully.");
    HttpResponse::Ok().json(serde_json::json!({ "status": "success" }))
}

#[get("/students/{student_name}")]
pub async fn get_individual_student_data(
    info: web::Path<String>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let student_name = info.into_inner();
    let state_table = state.lock().unwrap();

    // Collect all weeks' data for the student
    let mut student_data: Vec<RowData> = state_table
        .rows
        .iter()
        .filter(|row| row.name == student_name)
        .cloned()
        .collect();

    // Optionally, sort by week
    student_data.sort_by_key(|row| row.week);

    HttpResponse::Ok().json(student_data)
}

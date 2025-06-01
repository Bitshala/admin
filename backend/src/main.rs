use actix_cors::Cors;
use actix_web::{
    App, HttpResponse, HttpServer, Responder, Result, get, http::header, middleware::Logger, post,
    web,
};
use rand::seq::SliceRandom;
use rand::thread_rng;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::{os::linux::raw::stat, path::PathBuf, sync::Mutex};
use thiserror::Error;
// // mod classroom;
// use classroom::get_env;

// --- Struct Definitions ---
#[derive(Deserialize, Serialize)]
struct TaLogin {
    gmail: String,
}

#[derive(Serialize, Deserialize, Default)]
pub struct RowData {
    pub name: String,
    pub group_id: String,
    pub ta: Option<String>,
    pub attendance: Option<String>,
    pub fa: Option<f64>,
    pub fb: Option<f64>,
    pub fc: Option<f64>,
    pub fd: Option<f64>,
    pub bonus_attempt: Option<f64>,
    pub bonus_answer_quality: Option<f64>,
    pub bonus_follow_up: Option<f64>,
    pub exercise_submitted: Option<String>,
    pub exercise_test_passing: Option<String>,
    pub exercise_good_documentation: Option<String>,
    pub exercise_good_structure: Option<String>,
    pub total: Option<f64>,
    pub mail: String,
    pub week: i32,
}

pub struct Table {
    rows: Vec<RowData>,
}

// #[derive(Debug, Clone, Copy)]
// enum TA {
//     AnmolSharma = 0,
//     Bala,
//     Delcin,
//     BeulahEvanjalin,
//     Raj,
//     Saurabh,
// }

//data functions
pub fn read_from_db(path: &PathBuf) -> Result<Table, AppError> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare("SELECT * FROM students")?;
    let rows = stmt.query_map([], |row| {
        Ok(RowData {
            name: row.get(0)?,
            group_id: row.get(1)?,
            ta: row.get(2).ok(),
            attendance: row.get(3).ok(),
            fa: row.get(4).ok(),
            fb: row.get(5).ok(),
            fc: row.get(6).ok(),
            fd: row.get(7).ok(),
            bonus_attempt: row.get(8).ok(),
            bonus_answer_quality: row.get(9).ok(),
            bonus_follow_up: row.get(10).ok(),
            exercise_submitted: row.get(11).ok(),
            exercise_test_passing: row.get(12).ok(),
            exercise_good_documentation: row.get(13).ok(),
            exercise_good_structure: row.get(14).ok(),
            total: row.get(15).ok(),
            mail: row.get(16)?,
            week: row.get(17)?,
        })
    })?;

    let rows_vec = rows.filter_map(Result::ok).collect();
    Ok(Table { rows: rows_vec })
}

pub fn write_to_db(path: &PathBuf, table: &Table) -> Result<(), AppError> {
    let mut conn = Connection::open(path)?;
    let tx = conn.transaction()?;

    tx.execute("DELETE FROM students", [])?;

    for row in &table.rows {
        tx.execute(
            "INSERT INTO students (name, group_id, ta, attendance, fa, fb, fc, fd, bonus_attempt, bonus_answer_quality, bonus_follow_up, exercise_submitted, exercise_test_passing, exercise_good_documentation, exercise_good_structure, total, mail, week) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
            params![
                row.name,
                row.group_id,
                row.ta,
                row.attendance,
                row.fa,
                row.fb,
                row.fc,
                row.fd,
                row.bonus_attempt,
                row.bonus_answer_quality,
                row.bonus_follow_up,
                row.exercise_submitted,
                row.exercise_test_passing,
                row.exercise_good_documentation,
                row.exercise_good_structure,
                row.total,
                row.mail,
                row.week
            ],
        )?;
    }

    tx.commit()?;
    Ok(())
}

#[derive(Debug, Clone, Copy)]
enum TA {
    AnmolSharma,
    Bala,
    Tushar,
    Raj,
    Setu,
    Delcin,
    Beulah,
}

impl TA {
    // Returns all variants of the enum
    fn all_variants() -> &'static [TA] {
        &[
            TA::AnmolSharma,
            TA::Bala,
            TA::Tushar,
            TA::Raj,
            TA::Setu,
            TA::Delcin,
            TA::Beulah,
        ]
    }

    pub fn from_email(email: &str) -> Option<Self> {
        match email {
            "anmolsharma0234@gmail.com" => Some(TA::AnmolSharma),
            "balajic86@gmail.com" => Some(TA::Bala),
            "tusharvyas316@gmail.com" => Some(TA::Tushar),
            "raj@bitshala.org" => Some(TA::Raj),
            "setu@bitshala.org" => Some(TA::Setu),
            "delcinraj@gmail.com" => Some(TA::Delcin),
            "beulahebenezer777@gmail.com" => Some(TA::Beulah),
            _ => None,
        }
    }
}

// --- Handlers ---
#[post("/login")]
/// Only allow TAs to login with specific emails.
async fn login(item: web::Json<TaLogin>) -> impl Responder {
    if let Some(ta) = TA::from_email(&item.gmail) {
        HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "message": format!("Access granted for TA: {:?}", ta)
        }))
    } else {
        HttpResponse::Unauthorized().json(serde_json::json!({
            "status": "error",
            "message": format!("Access denied for email: {}", item.gmail)
        }))
    }
}

#[get("/students/count")]
async fn get_total_student_count(state: web::Data<Mutex<Table>>) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "count": state.lock().unwrap().rows.len() }))
}

#[get("/attendance/weekly_counts/{week}")]
async fn get_weekly_attendance_count_for_week(
    week: web::Path<i32>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let count = state.lock().unwrap()
        .rows
        .iter()
        .filter(|row| row.week == week.clone() && row.attendance == Some("yes".to_string()))
        .count();

    HttpResponse::Ok().json(serde_json::json!({
        "week": week.into_inner(),
        "attended": count
    }))
}

#[get("/weekly_data/{week}")]
async fn get_weekly_data_or_common(week: web::Path<i32>, state: web::Data<Mutex<Table>>) -> impl Responder {
    let week = week.into_inner();
    let table = state.lock().unwrap();

    if week == 0 && !table.rows.is_empty() {
        return HttpResponse::Ok().json(&table.rows);
    } else if week >= 2 {
        // Get previous week's rows, sorted by attendance
        let mut prev_week_rows: Vec<&RowData> = table
            .rows
            .iter()
            .filter(|row| row.week == week - 1)
            .collect();

        prev_week_rows.sort_by_key(|row| match row.attendance.as_deref() {
            Some("yes") => 0,
            Some("no") => 1,
            _ => 2,
        });
        // Assign groups and TAs in round-robin
        let group_ta_map = [
            ("Group 1", "Anmol Sharma"),
            ("Group 2", "Bala"),
            ("Group 3", "delcin"),
            ("Group 4", "Beulah Evanjalin"),
            ("Group 5", "Raj"),
        ];

        let mut group_counter = 0;
        let mut result_rows: Vec<RowData> = Vec::new();

        let mut rng = thread_rng();
        let mut tas = TA::all_variants().to_vec();
        let 
        tas.shuffle(&mut rng);

        for (idx, row) in prev_week_rows.iter().enumerate() {
            let (reassigned_group, assigned_ta) = match row.attendance.as_deref() {
                Some("yes") => {
                    let idx = group_counter % group_ta_map.len();
                    group_counter += 1;
                    let (group, ta) = group_ta_map[idx];
                    (group.to_string(), ta.to_string())
                }
                _ => ("Group 6 (Absent)".to_string(), "Saurabh".to_string()),
            };

           


            result_rows.push(RowData {
                name: row.name.clone(),
                group_id: reassigned_group,
                ta: Some(assigned_ta),
                attendance: row.attendance.clone(),
                fa: row.fa,
                fb: row.fb,
                fc: row.fc,
                fd: row.fd,
                bonus_attempt: row.bonus_attempt,
                bonus_answer_quality: row.bonus_answer_quality,
                bonus_follow_up: row.bonus_follow_up,
                exercise_submitted: row.exercise_submitted.clone(),
                exercise_test_passing: row.exercise_test_passing.clone(),
                exercise_good_documentation: row.exercise_good_documentation.clone(),
                exercise_good_structure: row.exercise_good_structure.clone(),
                total: row.total,
                mail: row.mail.clone(),
                week: row.week,
            });
        }

        HttpResponse::Ok().json(result_rows)
    } else {
        HttpResponse::BadRequest().json(serde_json::json!({
            "status": "error",
            "message": "Invalid week number"
        }))
    }
}

#[post("/weekly_data/{week}")]
async fn add_weekly_data(
    week: web::Path<i32>,
    student_data: web::Json<Vec<RowData>>,
) -> Result<HttpResponse, actix_web::Error> {
    let week_number = week.into_inner();
    let db_path = PathBuf::from("classroom.db");

    // Read the current table from the DB
    let mut table = read_from_db(&db_path)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // For each incoming entry, update or insert
    for entry in student_data.into_inner() {
        // Try to find an existing row for the same week and mail
        if let Some(existing) = table
            .rows
            .iter_mut()
            .find(|row| row.week == week_number && row.mail == entry.mail)
        {
            // Update the existing row
            *existing = entry;
        } else {
            // Insert new row
            let mut new_entry = entry;
            new_entry.week = week_number;
            table.rows.push(new_entry);
        }
    }

    // Write the updated table back to the DB
    write_to_db(&db_path, &table)
        .map_err(|e| actix_web::error::ErrorInternalServerError(format!("Write failed: {}", e)))?;

    Ok(HttpResponse::Ok().body("Weekly data inserted/updated successfully"))
}

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Sqlite DB error: {0}")]
    SQLITE(#[from] rusqlite::Error),
}

impl From<AppError> for std::io::Error {
    fn from(err: AppError) -> std::io::Error {
        match err {
            AppError::SQLITE(e) => {
                std::io::Error::new(std::io::ErrorKind::Other, format!("SQLite error: {}", e))
            }
        }
    }
}

#[actix_web::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let table = read_from_db(&PathBuf::from("classroom.db"))?;

    let state = web::Data::new(Mutex::new(table));

    // Process shit depending upon query.
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:5173")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![
                header::AUTHORIZATION,
                header::ACCEPT,
                header::CONTENT_TYPE,
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(state.clone())
            .wrap(cors)
            .wrap(Logger::default())
            .service(login)
            .service(get_weekly_data_or_common)
            .service(add_weekly_data)
            .service(get_total_student_count)
            .service(get_weekly_attendance_count_for_week)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await?;

    // Save Everything to the database at the end
    // write_to_db(&PathBuf::from("classroom.db"), &table)?;

    Ok(())
}

use actix_cors::Cors;
use actix_web::{
    App, HttpResponse, HttpServer, Responder, Result, get, http::header, middleware::Logger, post,
    web,
};
use octocrab::params::repos::release_assets::State;
use rand::{seq::SliceRandom, Rng};
use rand::thread_rng;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Mutex};
use thiserror::Error;
// // mod classroom;
// use classroom::get_env;

// --- Struct Definitions ---
#[derive(Deserialize, Serialize)]
struct TaLogin {
    gmail: String,
}

// TODO: Remove optional values.
// Change fa, fb, fc to its actual names.
#[derive(Serialize, Deserialize, Default, Debug, Clone)]
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

// 
pub struct Table {
    rows: Vec<RowData>,
}

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
            "INSERT INTO students (name, group_id, ta, attendance, fa, fb, fc, fd, bonus_attempt, bonus_answer_quality, bonus_follow_up, exercise_submitted, exercise_test_passing, exercise_good_documentation, exercise_good_structure, total, mail, week) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
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
    let week: i32 = week.into_inner();
    let db_path = PathBuf::from("classroom.db"); 

    let mut taTable = read_from_db(&db_path)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string())).unwrap();

    if week == 0 && !taTable.rows.is_empty() {
        return HttpResponse::Ok().json(&taTable.rows);
    } else if week >= 1 {
        // Sort students by total score in descending order
        let mut sorted_rows: Vec<&RowData> = taTable.rows.iter().filter(|row| row.week == week - 1).collect();
        sorted_rows.sort_by(|a, b| b.total.partial_cmp(&a.total).unwrap_or(std::cmp::Ordering::Equal));

        // Shuffle TAs for this week
        let mut rng = thread_rng();
        let mut tas = TA::all_variants().to_vec();
        tas.shuffle(&mut rng);

        // Assign students to groups and TAs
        let mut result_rows: Vec<RowData> = Vec::new();
        for (idx, row) in sorted_rows.iter().enumerate() {
            let (group_id, assigned_ta) = if row.attendance.as_deref() == Some("yes") {
                (
                    format!("Group {}", (idx / 5) + 1),
                    tas[(idx / 5) % tas.len()],
                )
            } else {
                ("Group 6".to_string(), TA::Setu)
            };

            result_rows.push(RowData {
                name: row.name.clone(),
                group_id,
                ta: Some(format!("{:?}", assigned_ta)),
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
                week,
            });
        }

        // Update the state table with the new data
        // taTable.rows = result_rows.clone();

        // Write to DB
        write_to_db(&PathBuf::from("classroom.db"), &taTable).unwrap();

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
    state: web::Data<Mutex<Table>>
) -> Result<HttpResponse, actix_web::Error> {
    let week_number = week.into_inner();
    let db_path = PathBuf::from("classroom.db");    

    let mut table = read_from_db(&db_path)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // For each incoming entry, update or insert
    for incoming_row in student_data.iter() {
        if let Some(existing_row) = table.rows.iter_mut().find(|row| row.name == incoming_row.name && row.week == week_number) {
            // Update all fields except name, mail, and week
            existing_row.group_id = incoming_row.group_id.clone();
            existing_row.ta = incoming_row.ta.clone();
            existing_row.attendance = incoming_row.attendance.clone();
            existing_row.fa = incoming_row.fa;
            existing_row.fb = incoming_row.fb;
            existing_row.fc = incoming_row.fc;
            existing_row.fd = incoming_row.fd;
            existing_row.bonus_attempt = incoming_row.bonus_attempt;
            existing_row.bonus_answer_quality = incoming_row.bonus_answer_quality;
            existing_row.bonus_follow_up = incoming_row.bonus_follow_up;
            existing_row.exercise_submitted = incoming_row.exercise_submitted.clone();
            existing_row.exercise_test_passing = incoming_row.exercise_test_passing.clone();
            existing_row.exercise_good_documentation = incoming_row.exercise_good_documentation.clone();
            existing_row.exercise_good_structure = incoming_row.exercise_good_structure.clone();
            existing_row.total = incoming_row.total;
        } else {
            table.rows.push(incoming_row.clone());
        }
    }

    
    // Write to DB
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

#[test]
fn test() {
    let mut rng = thread_rng();
    let names = vec![
        "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack",
        "Karen", "Leo", "Mona", "Nina", "Oscar", "Paul", "Quinn", "Rita", "Steve", "Tina",
    ];
    let emails = vec![
        "alice@example.com", "bob@example.com", "charlie@example.com", "david@example.com",
        "eve@example.com", "frank@example.com", "grace@example.com", "hank@example.com",
        "ivy@example.com", "jack@example.com", "karen@example.com", "leo@example.com",
        "mona@example.com", "nina@example.com", "oscar@example.com", "paul@example.com",
        "quinn@example.com", "rita@example.com", "steve@example.com", "tina@example.com",
    ];

    let mut rows = Vec::new();
    for i in 0..20 {
        rows.push(RowData {
            name: names[i].to_string(),
            group_id: format!("Group {}", (i / 5) + 1),
            ta: None,
            attendance: Some(if i % 2 == 0 { "no".to_string() } else { "no".to_string() }),
            fa: Some(rng.gen_range(0.0..10.0)),
            fb: Some(rng.gen_range(0.0..10.0)),
            fc: Some(rng.gen_range(0.0..10.0)),
            fd: Some(rng.gen_range(0.0..10.0)),
            bonus_attempt: Some(rng.gen_range(0.0..5.0)),
            bonus_answer_quality: Some(rng.gen_range(0.0..5.0)),
            bonus_follow_up: Some(rng.gen_range(0.0..5.0)),
            exercise_submitted: Some(if i % 3 == 0 { "yes".to_string() } else { "no".to_string() }),
            exercise_test_passing: Some(if i % 4 == 0 { "yes".to_string() } else { "no".to_string() }),
            exercise_good_documentation: Some(if i % 5 == 0 { "yes".to_string() } else { "no".to_string() }),
            exercise_good_structure: Some(if i % 6 == 0 { "yes".to_string() } else { "no".to_string() }),
            total: Some(rng.gen_range(0.0..100.0)),
            mail: emails[i].to_string(),
            week: rng.gen_range(1..5),
        });
    }

    let mut sorted_rows = rows;
    sorted_rows.sort_by(|a, b| b.total.partial_cmp(&a.total).unwrap_or(std::cmp::Ordering::Equal));
    for row in &sorted_rows {
        println!("Name: {}, Attn: {:?}, Total Score: {:?}", row.name, row.attendance, row.total);
    }

    // Shuffle TAs for this week
    let mut rng = thread_rng();
    let mut tas = TA::all_variants().to_vec();
    tas.shuffle(&mut rng);
    
    for (idx, row) in sorted_rows.iter().enumerate() {
        let (group_id, assigned_ta) = if row.attendance.as_deref() == Some("yes") {
            (
                format!("Group {}", (idx / 5) + 1),
                tas[(idx / 5) % tas.len()],
            )
        } else {
            ("Group 6".to_string(), TA::Setu)
        };

        println!("{} - {} - {:?}", row.name, group_id, assigned_ta);
    }
}
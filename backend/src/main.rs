use actix_cors::Cors;
use actix_web::{
    App, HttpResponse, HttpServer, Responder, Result, get, http::header, middleware::Logger, post,
    web,
};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Mutex};
use thiserror::Error;
use chrono::Datelike;

pub mod alpha {
    pub mod dbsave;
}
use crate::alpha::dbsave::{DbSave, SaveDatabaseWeekly};


#[derive(Debug, Error)]
pub enum AppError {
    #[error("Sqlite DB error: {0}")]
    SQLITE(#[from] rusqlite::Error),
}

impl From<AppError> for std::io::Error {
    fn from(err: AppError) -> std::io::Error {
        match err {
            AppError::SQLITE(e) => std::io::Error::other(format!("SQLite error: {}", e)),
        }
    }
}

impl From<AppError> for actix_web::Error {
    fn from(err: AppError) -> actix_web::Error {
        match err {
            AppError::SQLITE(e) => {
                actix_web::error::ErrorInternalServerError(format!("Actix Web Error: {}", e))
            }
        }
    }
}

// --- Struct Definitions ---
#[derive(Deserialize, Serialize)]
struct TaLogin {
    gmail: String,
}

// TODO: Remove optional values.
// Change fa, fb, fc to its actual names.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct RowData {
    pub name: String,
    pub group_id: String,
    pub ta: Option<String>,
    pub attendance: Option<String>,
    pub fa: Option<u64>,
    pub fb: Option<u64>,
    pub fc: Option<u64>,
    pub fd: Option<u64>,
    pub bonus_attempt: Option<u64>,
    pub bonus_answer_quality: Option<u64>,
    pub bonus_follow_up: Option<u64>,
    pub exercise_submitted: Option<String>,
    pub exercise_test_passing: Option<String>,
    pub exercise_good_documentation: Option<String>,
    pub exercise_good_structure: Option<String>,
    pub total: Option<u64>,
    pub mail: String,
    pub week: i32,
}

impl Default for RowData {
    fn default() -> Self {
        RowData {
            name: String::new(),
            group_id: String::new(),
            ta: None,
            attendance: Some("no".to_string()),
            fa: Some(0),
            fb: Some(0),
            fc: Some(0),
            fd: Some(0),
            bonus_attempt: Some(0),
            bonus_answer_quality: Some(0),
            bonus_follow_up: Some(0),
            exercise_submitted: Some("no".to_string()),
            exercise_test_passing: Some("no".to_string()),
            exercise_good_documentation: Some("no".to_string()),
            exercise_good_structure: Some("no".to_string()),
            total: Some(0),
            mail: String::new(),
            week: 0,
        }
    }
}

// The whole state table
pub struct Table {
    rows: Vec<RowData>,
}

impl Table {
    pub fn insert_or_update(&mut self, row: &RowData) -> Result<(), AppError> {
        let existing_row = self
            .rows
            .iter_mut()
            .find(|r| r.name == row.name && r.week == row.week);
        if let Some(existing_row) = existing_row {
            if *existing_row != *row {
                println!("Data has changed for {} in week {}", row.name, row.week);
            }
            *existing_row = row.clone();
        } else {
            println!("Inserting new row for {} in week {}", row.name, row.week);
            self.rows.push(row.clone());
        }
        Ok(())
    }
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
    println!("Writing to DB at path: {:?}", path);
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
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
    println!("TA login attempt: {:?}", item.gmail);
    if let Some(ta) = TA::from_email(&item.gmail) {
        println!("TA login success.");
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
    println!("Fetching total student count");
    let count = state
        .lock()
        .unwrap()
        .rows
        .iter()
        .filter(|row| row.week == 0)
        .count();
    HttpResponse::Ok().json(serde_json::json!({ "count": count }))
}

#[get("/attendance/weekly_counts/{week}")]
async fn get_weekly_attendance_count_for_week(
    week: web::Path<i32>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    println!("Fetching attendance count for week: {}", week);
    let count = state
        .lock()
        .unwrap()
        .rows
        .iter()
        .filter(|row| row.week == *week && row.attendance == Some("yes".to_string()))
        .count();

    HttpResponse::Ok().json(serde_json::json!({
        "week": week.into_inner(),
        "attended": count
    }))
}

fn update(row: &mut RowData) {
    row.attendance = Some("no".to_string());
    row.fa = Some(0);
    row.fb = Some(0);
    row.fc = Some(0);
    row.fd = Some(0);
    row.bonus_attempt = Some(0);
    row.bonus_answer_quality = Some(0);
    row.bonus_follow_up = Some(0);
    row.exercise_submitted = Some("no".to_string());
    row.exercise_test_passing = Some("no".to_string());
    row.exercise_good_documentation = Some("no".to_string());
    row.exercise_good_structure = Some("no".to_string());
    row.total = Some(0);
}

#[get("/weekly_data/{week}")]
async fn get_weekly_data_or_common(
    week: web::Path<i32>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    use rand::seq::SliceRandom;
    use std::path::PathBuf;

    let week = week.into_inner();
    println!("Getting and updating weekly data for week: {}", week);

    let mut state_table = state.lock().unwrap();

    if week == 0 && !state_table.rows.is_empty() {
        let week_0_rows: Vec<RowData> = state_table
            .rows
            .iter()
            .filter(|row| row.week == 0)
            .cloned()
            .collect();

        return HttpResponse::Ok().json(week_0_rows);
    } else if week >= 1 {
        let current_week_rows: Vec<RowData> = state_table
            .rows
            .iter()
            .filter(|row| row.week == week)
            .cloned()
            .collect();

        if !current_week_rows.is_empty() {
            println!("Week {} data already exists. Returning cached data.", week);
            return HttpResponse::Ok().json(current_week_rows);
        }

        let mut tas: Vec<TA> = TA::all_variants()
            .iter()
            .cloned()
            .filter(|ta| *ta != TA::Setu)
            .collect();

        let mut prev_week_rows: Vec<RowData> = state_table
            .rows
            .iter()
            .filter(|row| row.week == week - 1 && row.attendance.as_deref() == Some("yes"))
            .cloned()
            .collect();

        let setu_group: Vec<RowData> = state_table
            .rows
            .iter()
            .filter(|row| row.week == week - 1 && row.attendance.as_deref() == Some("no"))
            .cloned()
            .map(|mut row| {
                row.week = week;
                row.ta = Some("Setu".to_string());
                row.group_id = tas.len().to_string();
                row
            })
            .collect();

        prev_week_rows.sort_by(|a, b| {
            b.total
                .partial_cmp(&a.total)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.name.cmp(&b.name))
        });

        let mut rng = rand::thread_rng();
        tas.shuffle(&mut rng);

        let tas_count = tas.len();
        let total_active_students = prev_week_rows.len();

        let mut result_rows: Vec<RowData> = Vec::new();

        let bucket_size = total_active_students / tas_count;

        let mut group_id: isize = -1;

        for (index, mut row) in prev_week_rows.into_iter().enumerate() {
            if index % bucket_size == 0 {
                group_id += 1;
            }

            let assigned_ta = &tas[group_id as usize];

            row.group_id = format!("G{}", group_id);
            row.ta = Some(format!("{:?}", assigned_ta));
            row.week = week;

            update(&mut row);

            state_table.insert_or_update(&row).unwrap();
            result_rows.push(row);
        }

        result_rows.extend(setu_group);

        if let Err(err) = write_to_db(&PathBuf::from("classroom.db"), &state_table) {
            eprintln!("Failed to write to DB: {:?}", err);
        }

        return HttpResponse::Ok().json(result_rows);
    }

    HttpResponse::BadRequest().json(serde_json::json!({
        "status": "error",
        "message": "Invalid week number"
    }))
}

#[post("/weekly_data/{week}")]
async fn add_weekly_data(
    _week: web::Path<i32>,
    student_data: web::Json<Vec<RowData>>,
    state: web::Data<Mutex<Table>>,
) -> Result<HttpResponse, actix_web::Error> {
    let db_path = PathBuf::from("classroom.db");

    // let mut table = read_from_db(&db_path)
    //     .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let mut state_table = state.lock().unwrap();

    // For each incoming entry, update or insert
    for incoming_row in student_data.iter() {
        state_table.insert_or_update(incoming_row)?;
    }

    // Write to DB
    write_to_db(&db_path, &state_table)?;

    Ok(HttpResponse::Ok().body("Weekly data inserted/updated successfully"))
}

#[actix_web::main]
async fn main() -> Result<(), std::io::Error> {
    //env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    if chrono::Local::now().date_naive().weekday() == chrono::Weekday::Wed || chrono::Local::now().date_naive().weekday() == chrono::Weekday::Sat {
        let db = DbSave { db_name: "classroom.db" };
        let result = SaveDatabaseWeekly::save(&db);
        println!("{:?}", result);
    }

    let table = read_from_db(&PathBuf::from("classroom.db"))?;

    let state = web::Data::new(Mutex::new(table));

    // Process shit depending upon query.
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://127.0.0.1:8081")
            .allowed_origin("http://172.81.178.3:5173")
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
    .bind(("0.0.0.0", 8081))?
    .run()
    .await?;

    // Save Everything to the database at the end

    Ok(())
}

#[test]
fn test() {
    use rand::seq::SliceRandom;
    use rand::{Rng, thread_rng};

    let mut rng = thread_rng();
    let names = vec![
        "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack",
        "Karen", "Leo", "Mona", "Nina", "Oscar", "Paul", "Quinn", "Rita", "Steve", "Tina",
    ];
    let emails = vec![
        "alice@example.com",
        "bob@example.com",
        "charlie@example.com",
        "david@example.com",
        "eve@example.com",
        "frank@example.com",
        "grace@example.com",
        "hank@example.com",
        "ivy@example.com",
        "jack@example.com",
        "karen@example.com",
        "leo@example.com",
        "mona@example.com",
        "nina@example.com",
        "oscar@example.com",
        "paul@example.com",
        "quinn@example.com",
        "rita@example.com",
        "steve@example.com",
        "tina@example.com",
    ];

    let mut rows = Vec::new();
    for i in 0..20 {
        rows.push(RowData {
            name: names[i].to_string(),
            group_id: format!("Group {}", (i / 5) + 1),
            ta: None,
            attendance: Some(if i % 2 == 0 {
                "no".to_string()
            } else {
                "no".to_string()
            }),
            fa: Some(rng.gen_range(0..10)),
            fb: Some(rng.gen_range(0..10)),
            fc: Some(rng.gen_range(0..10)),
            fd: Some(rng.gen_range(0..10)),
            bonus_attempt: Some(rng.gen_range(0..5)),
            bonus_answer_quality: Some(rng.gen_range(0..5)),
            bonus_follow_up: Some(rng.gen_range(0..5)),
            exercise_submitted: Some(if i % 3 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            exercise_test_passing: Some(if i % 4 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            exercise_good_documentation: Some(if i % 5 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            exercise_good_structure: Some(if i % 6 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            total: Some(rng.gen_range(0..100)),
            mail: emails[i].to_string(),
            week: rng.gen_range(1..5),
        });
    }

    let mut sorted_rows = rows;
    sorted_rows.sort_by(|a, b| {
        b.total
            .partial_cmp(&a.total)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    for row in &sorted_rows {
        println!(
            "Name: {}, Attn: {:?}, Total Score: {:?}",
            row.name, row.attendance, row.total
        );
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

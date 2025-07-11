use crate::utils::types::{RowData, Table};
use actix_web::{HttpResponse, Responder, get, web};
use log::info;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Serialize)]
struct StudentScoreResponse {
    name: String,
    email: String,
    total_score: u64,
    exercise_total_score: u8,
}

#[get("/students/count")]
pub async fn get_total_student_count(state: web::Data<Mutex<Table>>) -> impl Responder {
    info!("Fetching total student count");
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
pub async fn get_weekly_attendance_count_for_week(
    week: web::Path<i32>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    info!("Fetching attendance count for week: {}", week);
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

#[get("/students/total_scores")]
pub async fn get_students_by_total_score(state: web::Data<Mutex<Table>>) -> impl Responder {
    info!("Fetching students ordered by total score (desc)");
    let state_table = state.lock().unwrap();

    let mut student_data: HashMap<String, (RowData, u64, u8)> = HashMap::new();

    for row in &state_table.rows {
        let total_score = row.total.unwrap_or(0);

        student_data
            .entry(row.name.clone())
            .and_modify(|(existing_row, accumulated_total, exercise_total)| {
                *accumulated_total += total_score;
                *exercise_total += if row.exercise_test_passing == Some("yes".to_string()) {
                    1
                } else {
                    0
                };
                if row.week > existing_row.week {
                    *existing_row = row.clone();
                }
            })
            .or_insert((
                row.clone(),
                total_score,
                if row.exercise_test_passing == Some("yes".to_string()) {
                    1
                } else {
                    0
                },
            ));
    }

    let mut response: Vec<(RowData, u64, u8)> = student_data.into_values().collect();
    response.sort_by(|a, b| b.1.cmp(&a.1)); // Sort by total score descending

    let final_response: Vec<StudentScoreResponse> = response
        .into_iter()
        .map(|(row, total_sum, exercise_total)| StudentScoreResponse {
            name: row.name,
            email: row.mail,
            total_score: total_sum,
            exercise_total_score: exercise_total,
        })
        .collect();

    HttpResponse::Ok().json(final_response)
}

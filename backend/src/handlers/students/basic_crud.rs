use crate::database::operations::{read_all_responses, write_to_db};
use crate::utils::types::{RowData, Table};
use actix_web::{HttpResponse, Responder, delete, get, post, put, web};
use log::info;
use std::path::PathBuf;
use std::sync::Mutex;

#[get("/students/{cohort_name}")]
pub async fn get_students(
    path: web::Path<String>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let _cohort_name = path.into_inner();
    
    // Use the global switched cohort state instead of reading from file
    let table = state.lock().unwrap();
    info!("Successfully fetched {} students from switched cohort", table.rows.len());
    HttpResponse::Ok().json(&table.rows)
}

#[post("/students/{cohort_name}")]
pub async fn add_student(
    path: web::Path<String>,
    student_data: web::Json<RowData>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let cohort_name = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    // Update both global state and database file
    {
        let mut table = state.lock().unwrap();
        table.rows.push(student_data.clone());
        
        match write_to_db(&db_path, &table) {
            Ok(_) => {
                info!("Successfully added new student");
                HttpResponse::Ok().json(serde_json::json!({
                    "message": "Student added successfully"
                }))
            }
            Err(e) => {
                // Rollback from global state if DB write failed
                table.rows.pop();
                info!("Error adding student: {:?}", e);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to add student"
                }))
            }
        }
    }
}

#[put("/students/{cohort_name}/{name}")]
pub async fn update_student(
    path: web::Path<(String, String)>,
    student_data: web::Json<RowData>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let (cohort_name, student_name) = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));
    let new_student_data = student_data.into_inner();

    // Update both global state and database file
    {
        let mut table = state.lock().unwrap();
        if let Some(student) = table.rows.iter_mut().find(|s| s.name == student_name) {
            let old_student = student.clone();
            *student = new_student_data;

            // Clone table for writing to avoid borrow issues
            let table_clone = table.clone();
            drop(table); // Release the lock before DB write
            
            match write_to_db(&db_path, &table_clone) {
                Ok(_) => {
                    info!("Successfully updated student: {}", student_name);
                    HttpResponse::Ok().json(serde_json::json!({
                        "message": "Student updated successfully"
                    }))
                }
                Err(e) => {
                    // Rollback the change if DB write failed
                    let mut table = state.lock().unwrap();
                    if let Some(student) = table.rows.iter_mut().find(|s| s.name == student_name) {
                        *student = old_student;
                    }
                    info!("Error updating student: {:?}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": "Failed to update student"
                    }))
                }
            }
        } else {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Student not found"
            }))
        }
    }
}

#[delete("/students/{cohort_name}/{name}")]
pub async fn remove_student(
    path: web::Path<(String, String)>,
    state: web::Data<Mutex<Table>>,
) -> impl Responder {
    let (cohort_name, student_name) = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    // Update both global state and database file
    {
        let mut table = state.lock().unwrap();
        let initial_len = table.rows.len();
        let removed_students: Vec<_> = table.rows.iter()
            .filter(|s| s.name == student_name)
            .cloned()
            .collect();
        
        table.rows.retain(|s| s.name != student_name);

        if table.rows.len() < initial_len {
            match write_to_db(&db_path, &table) {
                Ok(_) => {
                    info!("Successfully removed student: {}", student_name);
                    HttpResponse::Ok().json(serde_json::json!({
                        "message": "Student removed successfully"
                    }))
                }
                Err(e) => {
                    // Rollback by adding removed students back
                    table.rows.extend(removed_students);
                    info!("Error removing student: {:?}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": "Failed to remove student"
                    }))
                }
            }
        } else {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Student not found"
            }))
        }
    }
}

#[get("/feedback/{cohort_name}")]
pub async fn get_cohort_feedback(cohort_name: web::Path<String>) -> impl Responder {
    let cohort_name = cohort_name.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    match read_all_responses(&db_path, &cohort_name) {
        Ok(responses) => {
            info!("Successfully fetched feedback for cohort: {}", cohort_name);
            HttpResponse::Ok().json(responses)
        }
        Err(e) => {
            info!("Error fetching feedback: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch feedback"
            }))
        }
    }
}

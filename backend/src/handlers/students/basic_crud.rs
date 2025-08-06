use crate::database::operations::{read_all_responses, read_from_db, write_to_db};
use crate::utils::types::RowData;
use actix_web::{HttpResponse, Responder, delete, get, post, put, web};
use log::info;
use std::path::PathBuf;

#[get("/students/{cohort_name}")]
pub async fn get_students(path: web::Path<String>) -> impl Responder {
    let cohort_name = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    match read_from_db(&db_path) {
        Ok(table) => {
            info!("Successfully fetched {} students", table.rows.len());
            HttpResponse::Ok().json(&table.rows)
        }
        Err(e) => {
            info!("Error fetching students: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch students"
            }))
        }
    }
}

#[post("/students/{cohort_name}")]
pub async fn add_student(
    path: web::Path<String>,
    student_data: web::Json<RowData>,
) -> impl Responder {
    let cohort_name = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    match read_from_db(&db_path) {
        Ok(mut table) => {
            table.rows.push(student_data.into_inner());

            match write_to_db(&db_path, &table) {
                Ok(_) => {
                    info!("Successfully added new student");
                    HttpResponse::Ok().json(serde_json::json!({
                        "message": "Student added successfully"
                    }))
                }
                Err(e) => {
                    info!("Error adding student: {:?}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": "Failed to add student"
                    }))
                }
            }
        }
        Err(e) => {
            info!("Error reading database: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to read database"
            }))
        }
    }
}

#[put("/students/{cohort_name}/{name}")]
pub async fn update_student(
    path: web::Path<(String, String)>,
    student_data: web::Json<RowData>,
) -> impl Responder {
    let (cohort_name, student_name) = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    match read_from_db(&db_path) {
        Ok(mut table) => {
            if let Some(student) = table.rows.iter_mut().find(|s| s.name == student_name) {
                *student = student_data.into_inner();

                match write_to_db(&db_path, &table) {
                    Ok(_) => {
                        info!("Successfully updated student: {}", student_name);
                        HttpResponse::Ok().json(serde_json::json!({
                            "message": "Student updated successfully"
                        }))
                    }
                    Err(e) => {
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
        Err(e) => {
            info!("Error reading database: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to read database"
            }))
        }
    }
}

#[delete("/students/{cohort_name}/{name}")]
pub async fn remove_student(path: web::Path<(String, String)>) -> impl Responder {
    let (cohort_name, student_name) = path.into_inner();
    let db_path = PathBuf::from(format!("{}", cohort_name));

    match read_from_db(&db_path) {
        Ok(mut table) => {
            let initial_len = table.rows.len();
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
        Err(e) => {
            info!("Error reading database: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to read database"
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

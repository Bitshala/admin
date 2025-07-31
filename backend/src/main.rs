use actix_cors::Cors;
use actix_web::{App, HttpServer, http::header, middleware::Logger, web};
use log::info;
use std::path::PathBuf;
use std::sync::Mutex;
// Import our modules
mod database;
mod handlers;
mod utils;

// Import functions
use database::operations::read_from_db;
use utils::backup::start_backup_thread;
use utils::csv_dump::csv_dump;

// Import all handlers
use handlers::auth::login; // Remove discord_callback
use handlers::students::{
    add_student,
    add_weekly_data,
    delete_data,
    get_cohort_feedback,
    get_individual_student_data,
    get_student_background_data,
    //register
    get_student_github_username,
    // Individual
    get_student_repo_link,
    // Basic CRUD
    get_students,
    get_students_by_total_score,
    // Reports
    get_total_student_count,
    get_weekly_attendance_count_for_week,
    // Weekly data
    get_weekly_data_or_common,
    register_user,
    remove_student,
    update_student,
};
use handlers::universal::switch_cohort_api;
use utils::discord_auth::discord_oauth;

#[actix_web::main]
async fn main() -> Result<(), std::io::Error> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize logging
    log4rs::init_file("log4rs.yaml", Default::default()).unwrap();
    info!("Starting Bitshala Admin Server...");

    if let Err(e) = csv_dump().await {
        eprintln!("Error during CSV dump: {:?}", e);
    }

    // Start backup thread
    start_backup_thread();

    // Initialize database state as empty - will be populated via switch_cohort_api
    let empty_table = crate::utils::types::Table { rows: Vec::new() };
    let state = web::Data::new(Mutex::new(empty_table));

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("localhost:4321")
            .allow_any_origin()
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
            // Auth routes
            .service(login)
            .service(discord_oauth)
            // Universal routes
            .service(switch_cohort_api)
            // Student CRUD routes
            .service(get_students)
            .service(add_student)
            .service(update_student)
            .service(remove_student)
            // Weekly data routes
            .service(get_weekly_data_or_common)
            .service(add_weekly_data)
            .service(delete_data)
            // Report routes
            .service(get_total_student_count)
            .service(get_weekly_attendance_count_for_week)
            .service(get_students_by_total_score)
            // Individual student routes
            .service(get_student_repo_link)
            .service(get_student_background_data)
            .service(get_individual_student_data)
            .service(get_student_github_username)
            .service(get_cohort_feedback)
            //register
            .service(register_user)
    })
    .bind("127.0.0.1:8081")?
    .run()
    .await
}

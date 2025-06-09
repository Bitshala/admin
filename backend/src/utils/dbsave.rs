use std::fs;
use std::path::Path;
use thiserror::Error;
use chrono::Local;

// Define a custom error type
#[derive(Debug, Error)]
pub enum DbError {
    #[error("Database error: {0}")]
    DatabaseError(String),
}

// Trait for saving database weekly
pub trait SaveDatabaseWeekly {
    fn save(&self) -> Result<(), DbError>;
}

// Struct representing the database save operation
pub struct DbSave<'a> {
    pub db_name: &'a str,
}

impl<'a> SaveDatabaseWeekly for DbSave<'a> {
    fn save(&self) -> Result<(), DbError> {
        let db_path = Path::new("./").join(self.db_name);

        if db_path.exists() {
            let backup_dir = Path::new("./backup");
            fs::create_dir_all(Path::new("./backup")).unwrap();

            let now = Local::now();
            let day_of_week = now.format("%A"); // e.g., Monday
            let date_time = now.format("%Y-%m-%d_%H-%M-%S"); // e.g., 2024-06-07_15-30-00
            let backup_file = backup_dir.join(format!(
                "{}_{}_{}.db",
                self.db_name,
                day_of_week,
                date_time
            ));
            fs::copy(&db_path, &backup_file).unwrap();
        } else {
            return Err(DbError::DatabaseError(format!(
                "Database file '{}' not found in project root.",
                self.db_name
            )));
        }

        Ok(())
    }
}

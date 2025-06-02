use thiserror::Error;
use chrono::Datelike;
use std::path::Path;
use std::fs;

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
        let get_current_day = chrono::Local::now().date_naive().weekday();


        let db_path = Path::new("./").join(self.db_name);
    
        if db_path.exists() {
            // Create the backup directory if it doesn't exist
            let backup_dir = Path::new("./backup");
            if let Err(e) = fs::create_dir_all(&backup_dir) {
            return Err(DbError::DatabaseError(format!(
                "Failed to create backup directory: {}",
                e
            )));
            }

            let weekday = get_current_day.to_string();
            let backup_file = backup_dir.join(format!("{}_{}", self.db_name, weekday));

            // Copy the database file to the backup directory
            if let Err(e) = fs::copy(&db_path, &backup_file) {
            return Err(DbError::DatabaseError(format!(
                "Failed to copy database file: {}",
                e
            )));
            }
        } else {
            return Err(DbError::DatabaseError(format!(
            "Database file '{}' not found in project root.",
            self.db_name
            )));
        }
        
        
        Ok(())
    }
}

fn main() {
    let db = DbSave { db_name: "my_db" }?;
}
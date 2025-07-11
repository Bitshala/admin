use actix_web::ResponseError;
use serde::{Deserialize, Serialize};

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("CSV error: {0}")]
    Csv(#[from] csv::Error),
}

// Implement ResponseError for actix-web compatibility
impl ResponseError for AppError {}

// Implement From<AppError> for std::io::Error
impl From<AppError> for std::io::Error {
    fn from(err: AppError) -> std::io::Error {
        match err {
            AppError::Database(e) => std::io::Error::new(std::io::ErrorKind::Other, e),
            AppError::Io(e) => e,
            AppError::Csv(e) => std::io::Error::new(std::io::ErrorKind::Other, e),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaLogin {
    pub gmail: String,
}

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

#[derive(Debug, Serialize, Deserialize)]
pub struct Table {
    pub rows: Vec<RowData>,
}

// Move the business logic to a separate implementation
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

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub discriminator: String,
    pub avatar: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Member {
    pub user: Option<User>,
    pub nick: Option<String>,
    pub roles: Vec<String>,
    pub joined_at: String,
}

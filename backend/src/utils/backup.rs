use chrono::{Datelike, Local};
use log::error;
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("Database error: {0}")]
    DatabaseError(String),
}

fn cleanup_old_backups(db_name: &str, days_ago: i64) {
    let target_month = (Local::now() - chrono::Duration::days(days_ago))
        .format("%Y-%m")
        .to_string();
    glob::glob(&format!("backup/{}*{}*.db", db_name, target_month))
        .unwrap()
        .for_each(|file| {
            fs::remove_file(file.unwrap()).ok();
        });
}

fn backup(db_name: &str) -> Result<(), DbError> {
    let db_path = Path::new("./").join(db_name);

    if db_path.exists() {
        let backup_dir = Path::new("./backup");
        fs::create_dir_all(Path::new("./backup")).unwrap();

        let now = Local::now();
        let day_of_week = now.format("%A");
        let date_time = now.format("%Y-%m-%d");
        let backup_file = backup_dir.join(format!("{}_{}_{}.db", db_name, day_of_week, date_time));
        fs::copy(&db_path, &backup_file).unwrap();

        cleanup_old_backups(db_name, 35);
    } else {
        return Err(DbError::DatabaseError(format!(
            "Database file '{}' not found in project root.",
            db_name
        )));
    }

    Ok(())
}

pub fn start_backup_thread() {
    std::thread::spawn(|| {
        loop {
            let now = chrono::Local::now();
            let weekday = now.date_naive().weekday();
            if weekday == chrono::Weekday::Mon || weekday == chrono::Weekday::Sat {
                let db_name = "classroom.db";
                let result: std::result::Result<(), DbError> = backup(&db_name);
                if let Err(e) = result {
                    error!("Failed to backup database: {}", e);
                }
                std::thread::sleep(std::time::Duration::from_secs(60 * 60 * 24));
            } else {
                std::thread::sleep(std::time::Duration::from_secs(60 * 60));
            }
        }
    });
}

use crate::utils::types::{AppError, CohortParticipant, FeedbackResponse, RowData, Table};
use chrono::Utc;
use log::info;
use rusqlite::{Connection, Result, params};
use serde_json;
use std::path::PathBuf;

pub fn read_from_db(path: &PathBuf) -> Result<Table, AppError> {
    info!("Reading from DB at path: {:?}", path);
    let conn = Connection::open(path)?;

    let mut stmt = conn.prepare("SELECT name, group_id, ta, attendance, CAST(fa as INTEGER) as fa, CAST(fb as INTEGER) as fb, CAST(fc as INTEGER) as fc, CAST(fd as INTEGER) as fd, CAST(bonus_attempt as INTEGER) as bonus_attempt, CAST(bonus_answer_quality as INTEGER) as bonus_answer_quality, CAST(bonus_follow_up as INTEGER) as bonus_follow_up, exercise_submitted, exercise_test_passing, exercise_good_documentation, exercise_good_structure, CAST(total as INTEGER) as total, mail, week FROM students")?;

    let rows = stmt.query_map([], |row| {
        Ok(RowData {
            name: row.get(0)?,
            group_id: row.get(1)?,
            ta: row.get(2)?,
            attendance: row.get(3)?,
            fa: row.get(4)?,
            fb: row.get(5)?,
            fc: row.get(6)?,
            fd: row.get(7)?,
            bonus_attempt: row.get(8)?,
            bonus_answer_quality: row.get(9)?,
            bonus_follow_up: row.get(10)?,
            exercise_submitted: row.get(11)?,
            exercise_test_passing: row.get(12)?,
            exercise_good_documentation: row.get(13)?,
            exercise_good_structure: row.get(14)?,
            total: row.get(15)?,
            mail: row.get(16)?,
            week: row.get(17)?,
        })
    })?;

    let rows_vec: Vec<RowData> = rows.collect::<Result<Vec<_>, _>>()?;
    info!(
        "Successfully read {} rows from the database.",
        rows_vec.len()
    );
    Ok(Table { rows: rows_vec })
}

pub fn write_to_db(path: &PathBuf, table: &Table) -> Result<(), AppError> {
    info!("Writing to DB at path: {:?}", path);
    let mut conn = Connection::open(path)?;
    let tx = conn.transaction()?;

    // tx.execute("DELETE FROM students", [])?;

    for row in &table.rows {
        // First, try to update existing record
        let updated_rows = tx.execute(
            "UPDATE students SET group_id = ?2, ta = ?3, attendance = ?4, fa = ?5, fb = ?6, fc = ?7, fd = ?8, bonus_attempt = ?9, bonus_answer_quality = ?10, bonus_follow_up = ?11, exercise_submitted = ?12, exercise_test_passing = ?13, exercise_good_documentation = ?14, exercise_good_structure = ?15, total = ?16, mail = ?17 WHERE name = ?1 AND week = ?18",
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

        if updated_rows == 0 {
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
    }

    info!(
        "Successfully wrote {} rows to the database.",
        table.rows.len()
    );
    tx.commit()?;
    Ok(())
}

pub fn register_cohort_participant(
    path: &PathBuf,
    participant: CohortParticipant,
) -> Result<(), AppError> {
    info!("Writing to DB at path: {:?}", path);
    let mut conn = Connection::open(path)?;
    let tx = conn.transaction()?;

    // Create table if it doesn't exist
    tx.execute(
        "CREATE TABLE IF NOT EXISTS participants (
            name TEXT NOT NULL ,
            enrolled BOOLEAN NOT NULL,
            role TEXT NOT NULL,
            email TEXT NOT NULL Primary Key,
            describe_yourself TEXT,
            background TEXT,
            github TEXT,
            skills TEXT,
            year TEXT,
            books TEXT,
            why TEXT,
            time TEXT,
            location TEXT,
            cohort_name TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    let now = Utc::now().naive_utc();
    let now_str = now.to_string();

    tx.execute(
        "INSERT INTO participants (
            name, enrolled, role, email, describe_yourself, background, 
            github, skills, year, books, why, time, location, cohort_name, 
            created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            participant.name,
            participant.enrolled,
            participant.role,
            participant.email,
            participant.describe_yourself,
            participant.background,
            participant.github,
            serde_json::to_string(&participant.skills).unwrap_or_default(),
            participant.year,
            serde_json::to_string(&participant.books).unwrap_or_default(),
            participant.why,
            participant.time,
            participant.location,
            participant.cohort_name,
            now_str,
            now_str
        ],
    )?;

    info!("Successfully wrote rows to the database.");
    tx.commit()?;
    Ok(())
}

pub fn read_all_responses(db_path: &PathBuf, _cohort_name: &str) -> Result<Vec<FeedbackResponse>> {
    let conn = Connection::open(db_path)?;

    let mut stmt = conn.prepare("SELECT * FROM responses")?;
    let response_iter = stmt.query_map(params![], |row| FeedbackResponse::from_row(row))?;

    let mut responses = Vec::new();
    for response in response_iter {
        responses.push(response?);
    }

    Ok(responses)
}

pub fn match_discord_username(
    path: &PathBuf,
    discord: &str,
) -> Result<CohortParticipant, AppError> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare("SELECT * FROM participants WHERE \"Email\" = ?1")?;

    let participant = stmt
        .query_row(params![discord], |row| CohortParticipant::from_row(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::Database(rusqlite::Error::QueryReturnedNoRows)
            }
            _ => AppError::Database(e),
        })?;

    Ok(participant)
}

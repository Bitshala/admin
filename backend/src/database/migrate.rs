//! Usage:
//! ```bash
//! # To run migration for a specific cohort:
//! cargo run --bin migrate BPD
//! cargo run --bin migrate PB
//! cargo run --bin migrate LBTCL
//! cargo run --bin migrate MB
//! ```
//!
//! This binary will:
//! - Drop `participants`, `students` tables if present.
//! - Populate the `students` table using data from `participants`  tables,

use rusqlite::{Connection, params};
use std::env;
use std::error::Error;

// A structure used to get participant information from the table
#[allow(dead_code)]
struct ParticipantInfo {
    name: String,
    email: String,
    github: String,
}

#[derive(Debug)]
#[allow(dead_code)]
enum Cohort {
    BPD,
    PB,
    LBTCL,
    MB,
}

impl Cohort {
    fn from_str(cohort_name: &str) -> Result<Self, String> {
        match cohort_name.to_uppercase().as_str() {
            "BPD" => Ok(Cohort::BPD),
            "PB" => Ok(Cohort::PB),
            "LBTCL" => Ok(Cohort::LBTCL),
            "MB" => Ok(Cohort::MB),
            _ => Err(format!(
                "Unknown cohort: {}. Valid cohorts are: BPD, PB, LBTCL, MB",
                cohort_name
            )),
        }
    }

    fn db_name(&self) -> String {
        match self {
            Cohort::BPD => "bpd_cohort.db".to_string(),
            Cohort::PB => "pb_cohort.db".to_string(),
            Cohort::LBTCL => "lbtcl_cohort.db".to_string(),
            Cohort::MB => "mb_cohort.db".to_string(),
        }
    }
    fn name(&self) -> &str {
        match self {
            Cohort::BPD => "BPD",
            Cohort::PB => "PB",
            Cohort::LBTCL => "LBTCL",
            Cohort::MB => "MB",
        }
    }
}

#[allow(dead_code)]
fn main() -> Result<(), Box<dyn Error>> {
    // Parse command line arguments
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 {
        eprintln!("Usage: {} <COHORT_NAME>", args[0]);
        eprintln!("Valid cohorts: BPD, PB, LBTCL, MB");
        eprintln!("Example: cargo run --bin migrate BPD");
        std::process::exit(1);
    }

    let cohort = match Cohort::from_str(&args[1]) {
        Ok(cohort) => cohort,
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    };

    println!("Running migration for cohort: {}", cohort.name());
    println!("Database: {}", cohort.db_name());

    // Open or create the SQLite database with cohort-specific name
    let conn = Connection::open(&cohort.db_name())?;

    // Drop existing tables to ensure a fresh load
    conn.execute_batch(
        r#"
        DROP TABLE IF EXISTS students;
    "#,
    )?;
    println!("Dropped existing tables (if any).");

    // TODO: Change fa, fb, fc to their actual values.
    // Create tables
    conn.execute_batch(
        r#"
        CREATE TABLE students (
            name                        TEXT NOT NULL,
            group_id                    TEXT,
            ta                          TEXT,
            attendance                  TEXT,
            fa                          REAL,
            fb                          REAL,
            fc                          REAL,
            fd                          REAL,
            bonus_attempt               REAL,
            bonus_answer_quality        REAL,
            bonus_follow_up             REAL,
            exercise_submitted          TEXT,
            exercise_test_passing       TEXT,
            exercise_good_documentation TEXT,
            exercise_good_structure     TEXT,
            total                       REAL,
            mail                        TEXT, 
            GitHub                      TEXT,
            week                        INTEGER
        );

    "#,
    )?;
    println!("Created table: students");

    println!("Populating students table...");

    let mut stmt_fetch_participants =
        conn.prepare("SELECT \"Name\", \"Email\", \"Github\" FROM participants")?;
    let participants_iter = stmt_fetch_participants
        .query_map([], |row| {
            Ok(ParticipantInfo {
                name: row.get(0)?,
                email: row.get(1)?,
                github: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut insert_student_stmt = conn.prepare(
        r#"
        INSERT INTO students (
            name, group_id, ta, attendance,
            fa, fb, fc, fd,
            bonus_attempt, bonus_answer_quality, bonus_follow_up,
            exercise_submitted, exercise_test_passing, exercise_good_documentation, exercise_good_structure,
            total, mail, github, week
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18 , ?19)
        "#,
    )?;

    let mut student_records_created = 0;

    for participant in participants_iter {
        // Insert into students table
        match insert_student_stmt.execute(params![
            participant.name, // name
            "NA",             // group_id
            "NA",             // ta
            "no",             // attendance (default false -> "no")
            0.0,              // fa
            0.0,              // fb
            0.0,              // fc
            0.0,              // fd
            "no",             // bonus_attendance (default false -> "no")
            "no",             // bonus_answer_quality (default false -> "no")
            "no",             // bonus_follow_up (default false -> "no")
            "no",             // exercise_submitted (default false -> "no")
            "no",             // exercise_test_passing (default false -> "no")
            "no",             // exercise_good_documentation (default false -> "no")
            "no",             // exercise_good_structure (default false -> "no")
            0.0,
            participant.email,
            participant.github,
            0
        ]) {
            Ok(count) if count > 0 => student_records_created += 1,
            Ok(_) => { /* Potentially a conflict, and ON CONFLICT DO NOTHING was triggered */ }
            Err(e) => eprintln!("Failed to insert student {}: {}", participant.name, e),
        }
    }

    println!(
        "Populated students table with {} records.",
        student_records_created
    );
    println!(
        "Migration complete for cohort {} (database: {}).",
        cohort.name(),
        cohort.db_name()
    );
    Ok(())
}

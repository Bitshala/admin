//! Separate CLI tool for creating SQLite tables, importing CSV data, seeding TAs,
//! and populating the students table with initial data.
//!
//! Requirements (Cargo.toml in project root):
//!
//! ```toml
//! [dependencies]
//! rusqlite = { version = "0.29", features = ["bundled"] } # Adjust version as needed
//! csv = "1.1"
//! rand = "0.8"
//! ```
//!
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
//! - Drop `participants`, `students`, and `ta` tables if present.
//! - Create `participants`, `students`, and `ta` tables.
//! - Seed the `ta` table with a fixed list of names.
//! - Migrate all rows from `{cohort}.csv` into `participants`.
//! - Populate the `students` table using data from `participants` and `ta` tables,
//!   assigning random groups and TAs, and setting default scores and statuses.

use csv::Reader;
use rusqlite::{Connection, params};
use std::env;
use std::error::Error;

// A structure used to get participant information from the table
struct ParticipantInfo {
    name: String,
    email: String,
    github: String,
}

#[derive(Debug)]
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

    fn csv_file(&self) -> String {
        match self {
            Cohort::BPD => "src/csv_files/BPD.csv".to_string(),
            Cohort::PB => "src/csv_files/PB.csv".to_string(),
            Cohort::LBTCL => "src/csv_files/LBTCL.csv".to_string(),
            Cohort::MB => "src/csv_files/MB.csv".to_string(),
        }
    }

    fn db_name(&self) -> String {
        match self {
            Cohort::BPD => "classroom_bpd.db".to_string(),
            Cohort::PB => "classroom_pb.db".to_string(),
            Cohort::LBTCL => "classroom_lbtcl.db".to_string(),
            Cohort::MB => "classroom_mb.db".to_string(),
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
    println!("CSV file: {}", cohort.csv_file());

    // Open or create the SQLite database with cohort-specific name
    let conn = Connection::open(&cohort.db_name())?;

    // Drop existing tables to ensure a fresh load
    conn.execute_batch(
        r#"
        DROP TABLE IF EXISTS participants;
        DROP TABLE IF EXISTS students;
    "#,
    )?;
    println!("Dropped existing tables (if any).");

    // TODO: Change fa, fb, fc to their actual values.
    // Create tables
    conn.execute_batch(
        r#"
        CREATE TABLE participants(
            "ID"               TEXT PRIMARY KEY,
            "Name"             TEXT,
            "Token"            TEXT,
            "Enrolled"         INTEGER,
            "Role"             TEXT,
            "Email"            TEXT,
            "Describe Yourself" TEXT,
            "Background"       TEXT,
            "GitHub"           TEXT,
            "Skills"           TEXT,
            "Year"             TEXT,
            "Books"            TEXT,
            "Why"              TEXT,
            "Time"             TEXT,
            "Location"         TEXT,
            "Version"          INTEGER,
            "Cohort Name"      TEXT,
            "Created At"       TEXT,
            "Updated At"       TEXT
        );
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
    println!("Created tables: participants, students");

    // Read from cohort-specific CSV file
    let csv_path = cohort.csv_file();
    println!("Reading CSV from: {}", csv_path);

    let mut reader = Reader::from_path(&csv_path)?;
    let mut insert_participant_stmt = conn.prepare(
        r#"
        INSERT OR REPLACE INTO participants (
            "ID", "Name", "Token", "Enrolled", "Role", "Email",
            "Describe Yourself", "Background", "GitHub", "Skills", "Year",
            "Books", "Why", "Time", "Location", "Version", "Cohort Name",
            "Created At", "Updated At"
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
    "#,
    )?;

    let mut participant_records_imported = 0;
    for result in reader.records() {
        let record = result?;
        let fields: Vec<&str> = record.iter().collect();
        if fields.len() != 19 {
            eprintln!(
                "Skipping row in {}: expected 19 fields, got {}. Row data: {:?}",
                csv_path,
                fields.len(),
                fields
            );
            continue;
        }
        insert_participant_stmt.execute(params![
            fields[0],
            fields[1],
            fields[2],                             // ID, Name, Token
            fields[3].parse::<i64>().unwrap_or(0), // Enrolled
            fields[4],
            fields[5],
            fields[6],
            fields[7], // Role, Email, Describe Yourself, Background
            fields[8],
            fields[9],
            fields[10],
            fields[11], // GitHub, Skills, Year, Books
            fields[12],
            fields[13],
            fields[14],                             // Why, Time, Location
            fields[15].parse::<i64>().unwrap_or(0), // Version
            fields[16],
            fields[17],
            fields[18], // Cohort Name, Created At, Updated At
        ])?;
        participant_records_imported += 1;
    }
    println!(
        "Imported {} records from {} into participants table.",
        participant_records_imported, csv_path
    );

    println!("Populating students table...");

    // Fetch participant names and Email addresses from the participants table
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

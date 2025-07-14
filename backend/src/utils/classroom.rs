use octocrab::Octocrab;
use serde::{Deserialize, Serialize};
use std::env;
use thiserror::Error;

// Represents a GitHub Classroom
#[derive(Debug, Deserialize)]
#[allow(dead_code)] // Add this line only
pub struct Classroom {
    id: u64,
    name: String,
    archived: bool,
    url: String, // URL to the classroom on classroom.github.com
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct Assignment {
    pub assignment_name: String,
    pub assignment_url: String,
    pub github_username: String,
    pub points_available: String,
    pub points_awarded: String,
    pub roster_identifier: String,
    pub starter_code_url: String,
    pub student_repository_name: String,
    pub student_repository_url: String,
    pub submission_timestamp: Option<String>, // Can be null if not submitted
}

// --- Custom Error type for better error handling ---
#[derive(Debug, Error)]
pub enum ClassroomError {
    #[error("GitHub API error: {0}")]
    Octocrab(#[from] octocrab::Error),
    #[error("Environment variable GITHUB_TOKEN not set")]
    MissingToken(#[from] env::VarError),
    #[error("Failed to parse API response: {0}")]
    ParseError(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum WEEK {
    One,
    Two,
    Three,
    Four,
    Five,
}

impl WEEK {
    pub fn from_number(week_number: i32) -> Option<Self> {
        match week_number {
            1 => Some(WEEK::One),
            2 => Some(WEEK::Two),
            3 => Some(WEEK::Three),
            4 => Some(WEEK::Four),
            5 => Some(WEEK::Five),
            _ => None,
        }
    }

    pub fn to_assign_id(&self) -> u32 {
        match self {
            WEEK::One => 812582,
            WEEK::Two => 814648,
            WEEK::Three => 817211,
            WEEK::Four => 819049,
            WEEK::Five => 821244,
        }
    }
}

// pub async fn get_classroom_info(
// ) -> Result<Vec<Value>, ClassroomError> {
//     let token = env::var("GITHUB_TOKEN")?;
//     println!("GitHub token: {}", token);
//     let octocrab = Octocrab::builder().personal_token(token).build()?;

//     let classroom = octocrab.get("/classrooms/234007/assignments", None::<&()>).await?;

//     Ok(classroom)
// }

pub async fn get_submitted_assignments(
    week_number: i32,
) -> Result<Vec<Assignment>, ClassroomError> {
    let token = env::var("GITHUB_TOKEN")?;
    println!("GitHub token: {}", token);
    let octocrab = Octocrab::builder().personal_token(token).build()?;

    let week = if let Some(week) = WEEK::from_number(week_number) {
        week
    } else {
        return Ok(vec![]);
    };

    let assignment_id = week.to_assign_id();
    let endpoint = format!("/assignments/{assignment_id}/grades");
    let assignments: Vec<Assignment> = octocrab.get(endpoint, None::<&()>).await?;
    Ok(assignments)
}

impl Assignment {
    // Check if assignment was submitted
    pub fn is_submitted(&self) -> bool {
        self.submission_timestamp != Some("".to_string())
    }

    // Check if assignment was submitted
    pub fn get_week_pattern(&self) -> Option<u32> {
        let name = self.assignment_name.to_lowercase();
        if name.contains("week 1") || name.contains("week1") {
            Some(1)
        } else if name.contains("week 2") || name.contains("week2") {
            Some(2)
        } else if name.contains("week 3") || name.contains("week3") {
            Some(3)
        } else if name.contains("week 4") || name.contains("week4") {
            Some(4)
        } else if name.contains("week 5") || name.contains("week5") {
            Some(5)
        } else {
            None
        }
    }
}

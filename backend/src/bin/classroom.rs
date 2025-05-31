use std::{env};
use serde::Deserialize;
use octocrab::Octocrab;
use thiserror::Error;

// Represents a GitHub Classroom
#[derive(Debug, Deserialize)]
struct Classroom {
    id: u64,
    name: String,
    archived: bool,
    url: String, // URL to the classroom on classroom.github.com
}

// --- Custom Error type for better error handling ---
#[derive(Debug, Error)]
enum ClassroomError {
    #[error("GitHub API error: {0}")]
    Octocrab(#[from] octocrab::Error),
    #[error("Environment variable GITHUB_PAT not set")]
    MissingToken(#[from] env::VarError),
    #[error("Failed to parse API response: {0}")]
    ParseError(#[from] serde_json::Error),
}


#[tokio::main]
async fn main() -> Result<(), ClassroomError>{
    let key = env::var("GITHUB_TOKEN")?;

    println!("github token : {}", key);

    let octocrab = Octocrab::builder().personal_token(key).build()?;

    // Correctly deserialize the response into Vec<Classroom>
    let classrooms_response: Result<Vec<Classroom>, _> = octocrab.get("/classrooms", None::<&()>).await;

    match classrooms_response {
        Ok(classrooms) => {
            if classrooms.is_empty() {
                println!("No classrooms found or you may not have access to any.");
            } else {
                println!("\nFound the following classrooms:");
                for classroom in classrooms {
                    println!("------------------------------------");
                    println!("Classroom ID: {}", classroom.id);
                    println!("Name:         {}", classroom.name);
                    println!("Archived:     {}", classroom.archived);
                    println!("URL:          {}", classroom.url);
                }
                println!("------------------------------------");
            }
        }
        Err(e) => {
            eprintln!("Error fetching classrooms: {}", e);

            if let octocrab::Error::GitHub { source, .. } = &e {
                eprintln!("GitHub API Error Details: {:?}", source.message);
            }
            return Err(ClassroomError::Octocrab(e));
        }
    }

    Ok(())
}
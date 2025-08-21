use actix_web::ResponseError;
use rusqlite::Row;
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CohortParticipant {
    pub name: String,
    pub enrolled: bool,
    pub role: String,
    pub email: String,
    #[serde(alias = "describeYourself")]
    pub describe_yourself: String,
    pub background: String,
    pub github: String,
    pub skills: Vec<String>,
    pub year: String,
    pub books: Vec<String>,
    pub why: String,
    pub time: String,
    pub location: String,
    #[serde(alias = "cohortName")]
    pub cohort_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedbackResponse {
    pub timestamp: String,
    pub discord_name: String,
    pub name_on_certificate: String,
    pub academic_background: String,
    pub skills: String,
    pub session_instructions: String,
    pub study_material: String,
    pub group_discussions: String,
    pub lounge_discussions: String,
    pub deputy: String,
    pub teaching_assistants: String,
    pub bitshala_clubs: String,
    pub bitdev_meetups: String,
    pub bitspace: String,
    pub fellowships: String,
    pub expectations: String,
    pub improvement_ideas: String,
    pub bitcoin_opportunities: String,
    pub fellowship_projects: String,
    pub ideal_project: String,
    pub testimonial: String,
}

impl FeedbackResponse {
    pub fn from_row(row: &Row) -> Result<Self, rusqlite::Error> {
        Ok(FeedbackResponse {
            timestamp: row.get::<_, String>("Timestamp").unwrap_or_default(),
            discord_name: row.get::<_, String>("Discord_Name").unwrap_or_default(),
            name_on_certificate: row.get::<_, String>("Name_on_certificate").unwrap_or_default(),
            academic_background: row.get::<_, String>("Academic_background").unwrap_or_default(),
            skills: row.get::<_, String>("Skills").unwrap_or_default(),
            session_instructions: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Session_Instructions_]").unwrap_or_default(),
            study_material: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Study_Material_(book_&_questions)_]").unwrap_or_default(),
            group_discussions: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Group_Discussions]").unwrap_or_default(),
            lounge_discussions: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Lounge_Discussions]").unwrap_or_default(),
            deputy: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Deputy]").unwrap_or_default(),
            teaching_assistants: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Teaching_Assistants]").unwrap_or_default(),
            bitshala_clubs: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Bitshala_clubs]").unwrap_or_default(),
            bitdev_meetups: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Bitdev_Meetups]").unwrap_or_default(),
            bitspace: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Bitspace]").unwrap_or_default(),
            fellowships: row.get::<_, String>("Which_component_of_cohort_did_you_find_of_help_(or_not_so_much)?_[Fellowships_]").unwrap_or_default(),
            expectations: row.get::<_, String>("What_were_your_expectations_from_the_cohort?").unwrap_or_default(),
            improvement_ideas: row.get::<_, String>("What_could_we_do_help_you_have_a_better_Cohort_experience._Please_give_us_your_ideas,_we_need_'em.").unwrap_or_default(),
            bitcoin_opportunities: row.get::<_, String>("What_kind_of_opportunities_do_you_wish_to_pursue_in_Bitcoin?_").unwrap_or_default(),
            fellowship_projects: row.get::<_, String>("Any_project_amongst_our_fellowships_(https://bitshala.org/fellowship/)_excite_you?_").unwrap_or_default(),
            ideal_project: row.get::<_, String>("(Optional)_What_would_be_your_ideal_bitcoin_project_and_your_role_in_it?_You_may_or_may_not_chose_an_existing_bitcoin/bitshala_project,_or_even_choose_your_own_project.\nP.S._-_We_have_a_few_internships_at_Bitshala_and_fellowships_at_Bitshala_incubated_projects!").unwrap_or_default(),
            testimonial: row.get::<_, String>("(Optional)_We'd_really_appreciate_it_if_you_can_share_a_testimonial._It_might_go_at_Bitshala_website.").unwrap_or_default(),
        })
    }
}

impl CohortParticipant {
    pub fn from_row(row: &Row) -> Result<Self, rusqlite::Error> {
        Ok(CohortParticipant {
            name: row.get("Name")?,
            enrolled: row.get::<_, i32>("Enrolled")? != 0,
            role: row.get("Role")?,
            email: row.get("Email")?,
            describe_yourself: row.get("Describe Yourself")?,
            background: row.get("Background")?,
            github: row.get("GitHub")?,
            skills: serde_json::from_str(&row.get::<_, String>("Skills").unwrap_or_default())
                .unwrap_or_default(),
            year: row.get("Year")?,
            books: serde_json::from_str(&row.get::<_, String>("Books").unwrap_or_default())
                .unwrap_or_default(),
            why: row.get("Why")?,
            time: row.get("Time")?,
            location: row.get("Location")?,
            cohort_name: row.get("Cohort Name")?,
        })
    }
}

use serde::{Deserialize, Serialize};

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
pub mod basic_crud;
pub mod individual;
pub mod reports;
pub mod weekly_data;

// Re-export all functions for easy importing
pub use basic_crud::*;
pub use individual::*;
pub use reports::*;
pub use weekly_data::*;

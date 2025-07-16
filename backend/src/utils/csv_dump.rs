use reqwest;
use rusqlite::Connection;
use std::error::Error;
use std::io::Cursor;

pub async fn csv_dump() -> Result<(), Box<dyn Error>> {
    // Replace with your Google Sheet's CSV export link
    let url = "https://docs.google.com/spreadsheets/d/1xdIc4hHYHLauYe0E4DgDAx7OtIE1S5htGAemUiM3L7w/export?format=csv";

    // Download CSV data
    let response = reqwest::get(url).await?.bytes().await?;
    let cursor = Cursor::new(response);

    // Parse CSV
    let mut rdr = csv::Reader::from_reader(cursor);
    let headers = rdr.headers()?.clone();

    // Create SQLite DB
    let conn = Connection::open("form_responses.db")?;

    // Build CREATE TABLE dynamically
    let column_defs = headers
        .iter()
        .map(|h| format!("\"{}\" TEXT", h.replace(' ', "_")))
        .collect::<Vec<_>>()
        .join(", ");
    conn.execute(
        &format!("CREATE TABLE IF NOT EXISTS responses ({})", column_defs),
        [],
    )?;

    // Insert rows
    for result in rdr.records() {
        let record = result?;
        let placeholders = vec!["?"; record.len()].join(", ");
        let sql = format!(
            "INSERT INTO responses ({}) VALUES ({})",
            headers
                .iter()
                .map(|h| format!("\"{}\"", h.replace(' ', "_")))
                .collect::<Vec<_>>()
                .join(", "),
            placeholders
        );
        let values: Vec<String> = record.iter().map(|v| v.to_string()).collect();
        let values: Vec<&dyn rusqlite::ToSql> =
            values.iter().map(|v| v as &dyn rusqlite::ToSql).collect();
        conn.execute(&sql, values.as_slice())?;
    }

    println!("Data inserted successfully.");
    Ok(())
}

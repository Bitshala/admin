pub fn db_backup() {
    use std::fs;
    use std::path::Path;

    let db_path = Path::new("./").join("classroom.db");

    if db_path.exists() {
        let backup_dir = Path::new("./backup");
        fs::create_dir_all(backup_dir).unwrap();

        let backup_file = backup_dir.join("classroom_backup.db");
        fs::copy(&db_path, &backup_file).unwrap();
        println!("Database backup created successfully.");
    } else {
        println!("Database file 'classroom.db' not found in project root.");
    }
}
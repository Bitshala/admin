use backend::handlers::auth::TA;
use backend::utils::types::RowData;
use rand::seq::SliceRandom;
use rand::{Rng, thread_rng};

#[test]
fn test_student_data_generation_and_sorting() {
    let mut rng = thread_rng();
    let names = vec![
        "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack",
        "Karen", "Leo", "Mona", "Nina", "Oscar", "Paul", "Quinn", "Rita", "Steve", "Tina",
    ];
    let emails = vec![
        "alice@example.com",
        "bob@example.com",
        "charlie@example.com",
        "david@example.com",
        "eve@example.com",
        "frank@example.com",
        "grace@example.com",
        "hank@example.com",
        "ivy@example.com",
        "jack@example.com",
        "karen@example.com",
        "leo@example.com",
        "mona@example.com",
        "nina@example.com",
        "oscar@example.com",
        "paul@example.com",
        "quinn@example.com",
        "rita@example.com",
        "steve@example.com",
        "tina@example.com",
    ];

    let mut rows = Vec::new();
    for i in 0..20 {
        rows.push(RowData {
            name: names[i].to_string(),
            group_id: format!("Group {}", (i / 5) + 1),
            ta: None,
            attendance: Some(if i % 2 == 0 {
                "no".to_string()
            } else {
                "yes".to_string()
            }),
            fa: Some(rng.gen_range(0..10)),
            fb: Some(rng.gen_range(0..10)),
            fc: Some(rng.gen_range(0..10)),
            fd: Some(rng.gen_range(0..10)),
            bonus_attempt: Some(rng.gen_range(0..5)),
            bonus_answer_quality: Some(rng.gen_range(0..5)),
            bonus_follow_up: Some(rng.gen_range(0..5)),
            exercise_submitted: Some(if i % 3 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            exercise_test_passing: Some(if i % 4 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            exercise_good_documentation: Some(if i % 5 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            exercise_good_structure: Some(if i % 6 == 0 {
                "yes".to_string()
            } else {
                "no".to_string()
            }),
            total: Some(rng.gen_range(0..100)),
            mail: emails[i].to_string(),
            week: rng.gen_range(1..5),
        });
    }

    let mut sorted_rows = rows;
    sorted_rows.sort_by(|a, b| {
        b.total
            .partial_cmp(&a.total)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    for row in &sorted_rows {
        println!(
            "Name: {}, Attn: {:?}, Total Score: {:?}",
            row.name, row.attendance, row.total
        );
    }

    // Shuffle TAs for this week
    let mut rng = thread_rng();
    let mut tas = TA::all_variants().to_vec();
    tas.shuffle(&mut rng);

    for (idx, row) in sorted_rows.iter().enumerate() {
        let (group_id, assigned_ta) = if row.attendance.as_deref() == Some("yes") {
            (
                format!("Group {}", (idx / 5) + 1),
                tas[(idx / 5) % tas.len()],
            )
        } else {
            ("Group 6".to_string(), TA::Setu)
        };

        println!("{} - {} - {:?}", row.name, group_id, assigned_ta);
    }

    // Proper test assertions
    assert_eq!(sorted_rows.len(), 20);
    assert!(sorted_rows.windows(2).all(|w| w[0].total >= w[1].total));
    assert_eq!(tas.len(), 6);
}

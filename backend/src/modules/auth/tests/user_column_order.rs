use auth::domain::models::user::{CreateUser, UpdateUser};
use auth::domain::repositories::user::UserRepository;
use auth::infrastructure::repositories::user::UserSqlxRepository;
use sqlx::postgres::PgPoolOptions;

// Run with TEST_DATABASE_URL pointing to a disposable PostgreSQL database:
// cargo test -p auth --test user_column_order -- --ignored
#[actix_web::test]
#[ignore = "requires TEST_DATABASE_URL"]
async fn user_queries_handle_fresh_and_legacy_column_orders() {
    let database_url = std::env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL");
    for legacy in [false, true] {
        // One connection keeps the temporary users table local to this test.
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&database_url)
            .await
            .unwrap();
        let tail = if legacy {
            "notifications_seen_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true,
             hr_code VARCHAR(50) UNIQUE"
        } else {
            "is_active BOOLEAN NOT NULL DEFAULT true, hr_code VARCHAR(50) UNIQUE,
             notifications_seen_at TIMESTAMPTZ"
        };
        sqlx::query(&format!(
            "CREATE TEMP TABLE users (
                id UUID PRIMARY KEY, email VARCHAR(255), pin_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100),
                phone VARCHAR(20) NOT NULL UNIQUE,
                membership_tier VARCHAR(50) NOT NULL,
                membership_code VARCHAR(50) NOT NULL UNIQUE,
                tokens INT NOT NULL DEFAULT 0, total_bookings INT NOT NULL DEFAULT 0,
                total_spent NUMERIC(12,2) NOT NULL DEFAULT 0, profile_image_file_id TEXT,
                joined_at TIMESTAMPTZ NOT NULL, last_active TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
                date_of_birth DATE, referral_code VARCHAR(20) UNIQUE,
                lifetime_points_earned BIGINT NOT NULL DEFAULT 0,
                role VARCHAR(20) NOT NULL DEFAULT 'customer', {tail}
            )"
        ))
        .execute(&pool)
        .await
        .unwrap();
        let repository = UserSqlxRepository::new(pool.clone());
        let user = repository
            .create(&CreateUser {
                email: None,
                pin_hash: "test-pin-hash".into(),
                first_name: "Column".into(),
                last_name: None,
                phone: "9000000001".into(),
                membership_tier: "Silver".into(),
                membership_code: "COLUMN-ORDER".into(),
                referral_code: "ORDER".into(),
                hr_code: None,
                date_of_birth: None,
            })
            .await
            .unwrap();
        assert!(user.is_active);
        assert!(user.hr_code.is_none());
        assert!(user.notifications_seen_at.is_none());
        let logged_in = repository.get_by_phone(&user.phone).await.unwrap().unwrap();
        assert_eq!(logged_in.id, user.id);
        assert_eq!(logged_in.pin_hash, "test-pin-hash");
        assert!(logged_in.is_active);
        assert!(logged_in.notifications_seen_at.is_none());
        assert_eq!(repository.get(user.id).await.unwrap().unwrap().id, user.id);
        assert_eq!(
            repository
                .get_by_referral_code("ORDER")
                .await
                .unwrap()
                .unwrap()
                .id,
            user.id
        );
        assert_eq!(repository.list().await.unwrap().items.len(), 1);
        let updated = repository
            .update(&UpdateUser {
                id: user.id,
                is_active: Some(false),
                notifications_seen_at: Some(chrono::Utc::now()),
                ..Default::default()
            })
            .await
            .unwrap();
        assert!(!updated.is_active);
        assert!(updated.notifications_seen_at.is_some());
        assert!(
            !repository
                .get_by_phone(&user.phone)
                .await
                .unwrap()
                .unwrap()
                .is_active
        );
        pool.close().await;
    }
}

use async_trait::async_trait;
use sqlx::{PgPool, query, query_as};
use uuid::Uuid;

use crate::domain::models::refresh_token::{CreateRefreshToken, RefreshToken, Rotation};
use chrono::{DateTime, Duration, Utc};
use crate::domain::repositories::refresh_token::RefreshTokenRepository;
use base::result_paging::RepositoryResult;

pub struct RefreshTokenSqlxRepository {
    pub pool: PgPool,
}

impl RefreshTokenSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl RefreshTokenRepository for RefreshTokenSqlxRepository {
    async fn create(
        &self,
        new_token: &CreateRefreshToken,
    ) -> RepositoryResult<RefreshToken> {
        Ok(query_as!(
            RefreshToken,
            r#"
            INSERT INTO refresh_tokens
                (id, user_id, token_hash, family_id, issued_at, expires_at,
                 is_revoked, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, FALSE, $5)
            RETURNING *
            "#,
            Uuid::new_v4(),
            new_token.user_id,
            new_token.token_hash,
            new_token.family_id,
            new_token.issued_at,
            new_token.expires_at
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn get_from_hash(
        &self,
        token_hash: String,
    ) -> RepositoryResult<Option<RefreshToken>> {
        Ok(query_as!(
            RefreshToken,
            r#"SELECT * FROM refresh_tokens WHERE token_hash = $1"#,
            token_hash
        )
        .fetch_optional(&self.pool)
        .await?)
    }

    async fn revoke_token(&self, id: Uuid) -> RepositoryResult<()> {
        query!(
            r#"UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1"#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn revoke_family_id(&self, family_id: Uuid) -> RepositoryResult<()> {
        query!(
            r#"UPDATE refresh_tokens SET is_revoked = TRUE WHERE family_id = $1"#,
            family_id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn rotate(
        &self,
        old_hash: &str,
        new_hash: &str,
        now: DateTime<Utc>,
        new_expires_at: DateTime<Utc>,
        grace_seconds: i64,
    ) -> RepositoryResult<Rotation> {
        let mut tx = self.pool.begin().await?;

        // FOR UPDATE: a second request with the same token waits here until the first one
        // has committed, then sees the token as already used.
        let found: Option<RefreshToken> = sqlx::query_as::<_, RefreshToken>(
            "SELECT * FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE",
        )
        .bind(old_hash)
        .fetch_optional(&mut *tx)
        .await?;
        let Some(token) = found else {
            return Ok(Rotation::NotFound);
        };

        if token.expires_at < now {
            sqlx::query("UPDATE refresh_tokens SET is_revoked = TRUE WHERE family_id = $1")
                .bind(token.family_id)
                .execute(&mut *tx)
                .await?;
            tx.commit().await?;
            return Ok(Rotation::Expired);
        }

        if token.is_revoked {
            // Already swapped. If the sign-in got its replacement a moment ago this is just a
            // second request racing the first one; otherwise someone is replaying an old token.
            let cutoff = now - Duration::seconds(grace_seconds);
            let just_rotated: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM refresh_tokens WHERE family_id = $1 AND is_revoked = FALSE AND issued_at > $2)",
            )
            .bind(token.family_id)
            .bind(cutoff)
            .fetch_one(&mut *tx)
            .await?;
            if just_rotated {
                return Ok(Rotation::Duplicate { user_id: token.user_id, family_id: token.family_id });
            }
            sqlx::query("UPDATE refresh_tokens SET is_revoked = TRUE WHERE family_id = $1")
                .bind(token.family_id)
                .execute(&mut *tx)
                .await?;
            tx.commit().await?;
            return Ok(Rotation::Reused);
        }

        sqlx::query("UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1")
            .bind(token.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            r#"INSERT INTO refresh_tokens
                   (id, user_id, token_hash, family_id, issued_at, expires_at, is_revoked, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, FALSE, $5)"#,
        )
        .bind(Uuid::new_v4())
        .bind(token.user_id)
        .bind(new_hash)
        .bind(token.family_id)
        .bind(now)
        .bind(new_expires_at)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(Rotation::Rotated { user_id: token.user_id, family_id: token.family_id })
    }

    async fn family_is_active(&self, family_id: Uuid) -> RepositoryResult<bool> {
        Ok(sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM refresh_tokens WHERE family_id = $1 AND is_revoked = FALSE AND expires_at > NOW())",
        )
        .bind(family_id)
        .fetch_one(&self.pool)
        .await?)
    }
}

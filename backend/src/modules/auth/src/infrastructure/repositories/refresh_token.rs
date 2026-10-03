use async_trait::async_trait;
use sqlx::{PgPool, query, query_as};
use uuid::Uuid;

use crate::domain::models::refresh_token::{CreateRefreshToken, RefreshToken};
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
}

use async_trait::async_trait;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::api::utils::pin::{hash_pin, verify_pin};
use crate::domain::errors::user_errors::UserError;
use crate::domain::membership_code::{generate_membership_code, generate_referral_code};
use crate::domain::models::user::{CreateUser, UpdateUser, User};
use crate::domain::repositories::user::UserRepository;
use crate::domain::services::user::UserService;
use crate::infrastructure::repositories::user::UserSqlxRepository;
use base::error::RepositoryError;
use base::result_paging::ResultPaging;
use referral::domain::services::referral::ReferralService;
use rewards::domain::models::reward_transaction::RewardReason;
use rewards::domain::services::rewards::RewardsService;

const MAX_MEMBERSHIP_CODE_ATTEMPTS: u8 = 10;

#[derive(Clone)]
pub struct UserServiceImpl {
    pub repository: Arc<dyn UserRepository>,
    pub rewards_service: Arc<dyn RewardsService>,
    pub referral_service: Arc<dyn ReferralService>,
}

impl UserServiceImpl {
    pub fn new(
        pool: PgPool,
        rewards_service: Arc<dyn RewardsService>,
        referral_service: Arc<dyn ReferralService>,
    ) -> Self {
        Self {
            repository: Arc::new(UserSqlxRepository::new(pool)),
            rewards_service,
            referral_service,
        }
    }
}

#[async_trait]
impl UserService for UserServiceImpl {
    async fn register(
        &self,
        mut new_user: CreateUser,
        referred_by_code: Option<String>,
    ) -> Result<User, UserError> {
        if self
            .repository
            .get_by_phone(&new_user.phone)
            .await
            .map_err(UserError::InternalServerError)?
            .is_some()
        {
            return Err(UserError::UserAlreadyExists);
        }

        // The code can be another member's referral code or a staff member's code.
        let referrer = match referred_by_code {
            Some(code) => {
                let found = self
                    .repository
                    .get_by_referral_code(&code)
                    .await
                    .map_err(UserError::InternalServerError)?
                    .ok_or(UserError::InvalidReferralCode)?;
                // A deactivated staff member's code is no longer valid.
                if base::role::STAFF.contains(&found.role.as_str()) && !found.is_active {
                    return Err(UserError::InvalidReferralCode);
                }
                Some(found)
            }
            None => None,
        };

        for attempt in 1..=MAX_MEMBERSHIP_CODE_ATTEMPTS {
            new_user.membership_code = generate_membership_code(
                &new_user.first_name,
                new_user.date_of_birth,
                &new_user.membership_tier,
            );
            new_user.referral_code = generate_referral_code();

            match self.repository.create(&new_user).await {
                Ok(mut user) => {
                    let welcome_points = self.rewards_service.welcome_bonus().await;
                    if welcome_points > 0 {
                        self.rewards_service
                            .award(
                                user.id,
                                welcome_points,
                                RewardReason::WelcomeBonus,
                                None,
                                None,
                                None,
                                None,
                            )
                            .await
                            .map_err(|err| {
                                UserError::InternalServerError(RepositoryError::new(
                                    err.to_string(),
                                ))
                            })?;
                        user.tokens = welcome_points;
                    }

                    if let Some(referrer) = &referrer {
                        if base::role::STAFF.contains(&referrer.role.as_str()) {
                            // A staff code: the new member is associated with that staff member.
                            self.repository
                                .set_associated_staff(user.id, Some(referrer.id), "staff_code")
                                .await
                                .map_err(UserError::InternalServerError)?;
                        } else {
                            self.referral_service
                                .record_referral(referrer.id, user.id)
                                .await
                                .map_err(|err| {
                                    UserError::InternalServerError(RepositoryError::new(
                                        err.to_string(),
                                    ))
                                })?;
                            // Referred members join the staff member of the member who referred them.
                            if let Some(staff_id) = self
                                .repository
                                .get_associated_staff(referrer.id)
                                .await
                                .map_err(UserError::InternalServerError)?
                            {
                                self.repository
                                    .set_associated_staff(user.id, Some(staff_id), "referral")
                                    .await
                                    .map_err(UserError::InternalServerError)?;
                            }
                        }
                    }

                    return Ok(user);
                }
                // ponytail: string-matching the constraint name is the
                // simplest way to retry only on a membership_code/
                // referral_code clash without threading sqlx::Error through
                // RepositoryError.
                Err(err)
                    if attempt < MAX_MEMBERSHIP_CODE_ATTEMPTS
                        && (err.message.contains("membership_code")
                            || err.message.contains("referral_code")) =>
                {
                    continue;
                }
                Err(err) if err.message.contains("hr_code") => {
                    return Err(UserError::DuplicateHrCode);
                }
                Err(err) => return Err(UserError::InternalServerError(err)),
            }
        }

        unreachable!("loop always returns on its final attempt")
    }

    async fn authenticate(
        &self,
        phone: &str,
        pin: &str,
    ) -> Result<User, UserError> {
        let user = self
            .repository
            .get_by_phone(phone)
            .await
            .map_err(UserError::InternalServerError)?
            .ok_or(UserError::InvalidCredentials)?;

        if !user.is_active {
            return Err(UserError::UserNotAuthorised);
        }

        if !verify_pin(pin, &user.pin_hash) {
            return Err(UserError::InvalidCredentials);
        }

        Ok(user)
    }

    async fn update(&self, update_user: UpdateUser) -> Result<User, UserError> {
        self.repository
            .update(&update_user)
            .await
            .map_err(UserError::InternalServerError)
    }

    async fn change_pin(
        &self,
        user_id: Uuid,
        current_pin: &str,
        new_pin: &str,
    ) -> Result<User, UserError> {
        let user = self.get(user_id).await?;
        if !verify_pin(current_pin, &user.pin_hash) {
            return Err(UserError::InvalidCredentials);
        }

        self.repository
            .update(&UpdateUser {
                id: user_id,
                pin_hash: Some(hash_pin(new_pin)),
                ..Default::default()
            })
            .await
            .map_err(UserError::InternalServerError)
    }

    async fn list(&self) -> Result<ResultPaging<User>, UserError> {
        self.repository.list().await.map_err(UserError::InternalServerError)
    }

    async fn get(&self, user_id: Uuid) -> Result<User, UserError> {
        match self.repository.get(user_id).await {
            Ok(Some(user)) => Ok(user),
            Ok(None) => Err(UserError::UserDoesNotExist),
            Err(err) => Err(UserError::InternalServerError(err)),
        }
    }

    async fn associate_staff(
        &self,
        user_id: Uuid,
        staff_id: Option<Uuid>,
        source: &str,
    ) -> Result<(), UserError> {
        self.repository
            .set_associated_staff(user_id, staff_id, source)
            .await
            .map_err(UserError::InternalServerError)
    }
}

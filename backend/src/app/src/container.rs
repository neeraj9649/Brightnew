use std::sync::Arc;

use analytics::{
    domain::service::AnalyticsService,
    infrastructure::service::AnalyticsServiceImpl,
};
use auth::{
    domain::services::{refresh_token::RefreshTokenService, user::UserService},
    infrastructure::services::{
        refresh_token::RefreshTokenServiceImpl, user::UserServiceImpl,
    },
};
use bookings::{
    domain::services::booking::BookingService,
    infrastructure::services::booking::BookingServiceImpl,
};
use crm::{
    domain::services::{
        document::BookingDocumentService, expense::BookingExpenseService,
        note::BookingNoteService, quotation::QuotationService, task::TaskService,
    },
    infrastructure::services::{
        document::BookingDocumentServiceImpl,
        expense::BookingExpenseServiceImpl, note::BookingNoteServiceImpl,
        quotation::QuotationServiceImpl, task::TaskServiceImpl,
    },
};
use referral::{
    domain::services::referral::ReferralService,
    infrastructure::services::referral::ReferralServiceImpl,
};
use rewards::{
    domain::services::rewards::RewardsService,
    infrastructure::services::rewards::RewardsServiceImpl,
};

pub struct Container {
    pub sqlx_pool: sqlx::PgPool,
    pub user_service: Arc<dyn UserService>,
    pub refresh_token_service: Arc<dyn RefreshTokenService>,
    pub booking_service: Arc<dyn BookingService>,
    pub rewards_service: Arc<dyn RewardsService>,
    pub referral_service: Arc<dyn ReferralService>,
    pub note_service: Arc<dyn BookingNoteService>,
    pub quotation_service: Arc<dyn QuotationService>,
    pub task_service: Arc<dyn TaskService>,
    pub expense_service: Arc<dyn BookingExpenseService>,
    pub document_service: Arc<dyn BookingDocumentService>,
    pub analytics_service: Arc<dyn AnalyticsService>,
}

impl Container {
    pub async fn new() -> Self {
        let sqlx_pool = base::sqlx_init::db_conn().await;

        let rewards_service: Arc<dyn RewardsService> =
            Arc::new(RewardsServiceImpl::new(sqlx_pool.clone()));

        let referral_service: Arc<dyn ReferralService> = Arc::new(
            ReferralServiceImpl::new(sqlx_pool.clone(), rewards_service.clone()),
        );

        let user_service_impl = Arc::new(UserServiceImpl::new(
            sqlx_pool.clone(),
            rewards_service.clone(),
            referral_service.clone(),
        ));
        let user_service: Arc<dyn UserService> = user_service_impl.clone();

        let refresh_token_service: Arc<dyn RefreshTokenService> =
            Arc::new(RefreshTokenServiceImpl::new(
                sqlx_pool.clone(),
                user_service_impl.repository.clone(),
            ));

        let booking_service: Arc<dyn BookingService> =
            Arc::new(BookingServiceImpl::new(
                sqlx_pool.clone(),
                rewards_service.clone(),
            ));

        let note_service: Arc<dyn BookingNoteService> =
            Arc::new(BookingNoteServiceImpl::new(sqlx_pool.clone()));
        let quotation_service: Arc<dyn QuotationService> =
            Arc::new(QuotationServiceImpl::new(sqlx_pool.clone()));
        let task_service: Arc<dyn TaskService> =
            Arc::new(TaskServiceImpl::new(sqlx_pool.clone()));
        let expense_service: Arc<dyn BookingExpenseService> =
            Arc::new(BookingExpenseServiceImpl::new(sqlx_pool.clone()));
        let document_service: Arc<dyn BookingDocumentService> =
            Arc::new(BookingDocumentServiceImpl::new(sqlx_pool.clone()));

        let analytics_service: Arc<dyn AnalyticsService> =
            Arc::new(AnalyticsServiceImpl::new(sqlx_pool.clone()));

        Container {
            sqlx_pool,
            user_service,
            refresh_token_service,
            booking_service,
            rewards_service,
            referral_service,
            note_service,
            quotation_service,
            task_service,
            expense_service,
            document_service,
            analytics_service,
        }
    }
}

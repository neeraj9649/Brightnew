use crate::api::dto::reward::RewardTransactionDTO;
use crate::domain::models::reward_transaction::RewardTransaction;

impl From<RewardTransaction> for RewardTransactionDTO {
    fn from(value: RewardTransaction) -> Self {
        Self {
            id: value.id,
            points: value.points,
            reason: value.reason,
            source_type: value.source_type,
            source_id: value.source_id,
            description: value.description,
            created_at: value.created_at,
        }
    }
}

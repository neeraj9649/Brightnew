use crate::api::dto::expense::BookingExpenseDTO;
use crate::domain::models::expense::BookingExpense;

impl From<BookingExpense> for BookingExpenseDTO {
    fn from(value: BookingExpense) -> Self {
        Self {
            id: value.id,
            booking_id: value.booking_id,
            category: value.category,
            amount: value.amount.to_string().parse().unwrap_or(0.0),
            vendor: value.vendor,
            description: value.description,
            start_date: value.start_date,
            end_date: value.end_date,
            file_id: value.file_id,
            created_by: value.created_by,
            created_at: value.created_at,
        }
    }
}

use crate::error::RepositoryError;
use serde::{Deserialize, Serialize};

pub type RepositoryResult<T> = Result<T, RepositoryError>;

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultPaging<T> {
    pub total: i64,
    pub items: Vec<T>,
}

impl<T> ResultPaging<T> {
    pub fn map<E>(self, f: impl Fn(T) -> E) -> ResultPaging<E> {
        ResultPaging {
            total: self.total,
            items: self.items.into_iter().map(f).collect(),
        }
    }
}

pub const DEFAULT_OFFSET: Option<i64> = Some(0);
pub const DEFAULT_LIMIT: Option<i64> = Some(25);

pub trait QueryParams: Send + Sync {
    fn limit(&self) -> i64;
    fn offset(&self) -> i64;
}

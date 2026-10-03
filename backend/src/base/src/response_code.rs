#[derive(Debug)]
pub enum ApiResponseCode {
    Ok,
    Created,
    NoContent,
    BadRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict,
    InternalServerError,
}

impl ApiResponseCode {
    pub fn status_code(&self) -> u16 {
        match self {
            Self::Ok => 200,
            Self::Created => 201,
            Self::NoContent => 204,
            Self::BadRequest => 400,
            Self::Unauthorized => 401,
            Self::Forbidden => 403,
            Self::NotFound => 404,
            Self::Conflict => 409,
            Self::InternalServerError => 500,
        }
    }
}

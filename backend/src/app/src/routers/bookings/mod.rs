use actix_web::web::ServiceConfig;

use booking::booking_config;

mod booking;

pub fn bookings_routes(cfg: &mut ServiceConfig) {
    booking_config(cfg);
}

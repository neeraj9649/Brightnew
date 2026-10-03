use rand::Rng;

use crate::domain::models::booking::CreateBooking;

impl CreateBooking {
    /// Display code mirrors BrightP's old client-side format, e.g. `TR48213442`.
    pub fn generate_display_code(booking_type: &str) -> String {
        let prefix = match booking_type {
            "flight" => "FL",
            "hotel" => "HT",
            "tour" => "TR",
            "visa" => "VS",
            "airport_transfer" => "AT",
            "cruise" => "CR",
            "insurance" => "IN",
            "activity" => "AC",
            "car_rental" => "CA",
            "custom" => "CU",
            _ => "BK",
        };
        let suffix: u32 = rand::thread_rng().gen_range(10_000_000..99_999_999);
        format!("{}{}", prefix, suffix)
    }
}

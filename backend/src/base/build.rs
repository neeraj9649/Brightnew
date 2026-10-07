// `sqlx::migrate!` embeds the migration files at compile time but cargo does
// not watch the directory, so a new migration could be silently left out of an
// incremental build. Re-run this crate's build whenever the folder changes.
fn main() {
    println!("cargo:rerun-if-changed=../../migrations");
}

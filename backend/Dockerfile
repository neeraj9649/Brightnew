# syntax=docker/dockerfile:1
# Bright Wings API. SQLx query macros compile from the checked-in .sqlx
# metadata (offline mode via .cargo/config.toml), so no database is needed to build.
FROM rust:1-bookworm AS build
WORKDIR /app
COPY . .
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates libssl3 curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 10001 --home /app brightwings
WORKDIR /app
COPY --from=build /app/target/release/bp /app/bp
USER brightwings
ENV ADDRESS=0.0.0.0 PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["/app/bp"]

# Observability Setup: Loki + Discord (Development and Production)

This project now emits structured logs in both development and production.

## 1) Environment variables

Add these variables to your environment secrets:

```env
# Logging behavior
LOG_LEVEL=info
LOG_PRETTY=true

# Discord alerts (two channels)
DISCORD_WEBHOOK_DEVELOPMENT=https://discord.com/api/webhooks/xxx/dev
DISCORD_WEBHOOK_PRODUCTION=https://discord.com/api/webhooks/xxx/prod

# Optional fallback if env-specific webhook is not set
DISCORD_WEBHOOK_URL=

# Alert controls
DISCORD_ALERT_MIN_STATUS=500
DISCORD_ALERT_COOLDOWN_MS=60000
```

Notes:

- `DISCORD_WEBHOOK_DEVELOPMENT` should point to your development Discord channel.
- `DISCORD_WEBHOOK_PRODUCTION` should point to your production Discord channel.
- Alerts include an explicit environment indicator in the message title:
  - `[DEVELOPMENT] API error`
  - `[PRODUCTION] API error`

## 2) Loki shipping (Promtail)

Use the example config at:

- `ops/observability/promtail-config.example.yaml`

Set these environment variables for Promtail:

```env
LOKI_PUSH_URL=https://<your-grafana-loki-endpoint>/loki/api/v1/push
LOKI_USERNAME=<grafana-username-or-instance-id>
LOKI_PASSWORD=<grafana-api-token>
```

The pipeline parses JSON logs and promotes these labels:

- `environment`
- `service`
- `level`

## 3) Grafana alert rules + Discord routing

Use the example alert rule file:

- `ops/observability/grafana-alert-rules.example.yaml`

Recommended contact points in Grafana:

- `discord-production` (production channel webhook)
- `discord-development` (development channel webhook)

Recommended notification policies:

- Route alerts with `environment=production` to `discord-production`
- Route alerts with `environment=development` to `discord-development`

## 4) What is already implemented in code

- Structured logs in both development and production.
- Every log record includes `environment` and `service` fields.
- Server 5xx errors trigger Discord alerts with environment-specific webhooks.
- Duplicate alerts are throttled with `DISCORD_ALERT_COOLDOWN_MS`.

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

## Production API failure diagnostics

Every handled API 5xx writes an `api-server-error` structured error record to the normal
application log before attempting Discord delivery. It includes request ID, URL path without
query parameters, HTTP method/status, framework/public codes and the original infrastructure
code (including PostgreSQL SQLSTATE wrapped by a Drizzle error). Safe database identifiers
such as table, column, constraint and routine are included when provided by the driver.
Raw SQL, bind parameters, customer values, original messages and stacks are excluded from
production failure records. Development retains its verbose `[LOCAL_500]` diagnostic.

Previously the detailed local logger returned immediately in production, so an unavailable
Discord webhook could leave only `discord-alert-failed` in Docker logs. HTTP 404 on that
warning is the webhook's status, not the original application's HTTP status. It does not
change the API response. Current structured failure logging works without a webhook and is
not affected by the alert cooldown. Deploy/restart the backend to enable it.

QA: reproduce a reconciliation Find Transaction failure and match its public response request
ID to `api-server-error` in fresh Docker logs. Verify wrapped SQLSTATE `53100`/`42P01` is visible
without the booking search, SQL, contacts or bind parameters. Test with no webhook and failed
alert delivery; the original 500 must still be logged. Verify 4xx errors are not logged as
server failures and the existing public error envelope remains unchanged. Automated coverage:
`tests/server/server-error-log.spec.ts` and `tests/server/error-handler.contract.spec.ts`.

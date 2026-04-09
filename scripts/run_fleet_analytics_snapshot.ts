import 'dotenv/config';

type SnapshotResponse = {
  generatedAt: string;
  windowDays: number;
  horizonDays: number;
  compliance: {
    incidentsInWindow: number;
    openIncidents: number;
    criticalIncidents: number;
  };
  fraud: {
    tripsAnalyzed: number;
    flaggedTrips: number;
    highRiskTrips: number;
  };
  economics: {
    routeCount: number;
    branchCount: number;
    customerCount: number;
  };
  reliability: {
    totalFailures: number;
    totalDowntimeMinutes: number;
  };
};

function readNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

async function discoverFleetJobUserId() {
  const dbUrl =
    process.env.MIGRATE_DATABASE_URL || process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) return null;

  const { default: postgres } = await import('postgres');
  const sql = postgres(dbUrl, { max: 1 });
  try {
    const rows = await sql<
      Array<{
        id: string;
      }>
    >`
      select u.id
      from users u
      inner join role_permissions rp
        on rp.role_id = u.role_id
       and rp.company_id = u.company_id
      inner join company_modules cm
        on cm.company_id = u.company_id
       and cm.module_code = 'fleet_transport'
       and cm.is_enabled = true
      where rp.permission = 'CanReadFleetTransport'
      order by u.created_at asc
      limit 1
    `;
    return rows[0]?.id ?? null;
  } finally {
    await sql.end();
  }
}

async function run() {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
  let bearer = process.env.FLEET_JOB_BEARER_TOKEN ?? process.env.API_BEARER_TOKEN ?? '';
  if (!bearer.trim()) {
    let jobUserId: string | undefined = process.env.FLEET_JOB_USER_ID?.trim();
    if (!jobUserId) {
      const discovered = await discoverFleetJobUserId();
      jobUserId = discovered ?? undefined;
    }
    if (jobUserId) {
      const { signAccessToken } = await import('../src/server/utils/jwt');
      bearer = await signAccessToken({ sub: jobUserId });
    }
  }
  if (!bearer.trim()) {
    throw new Error(
      'Provide FLEET_JOB_BEARER_TOKEN (or API_BEARER_TOKEN), set FLEET_JOB_USER_ID, or ensure DB has a user with CanReadFleetTransport and fleet_transport module enabled.',
    );
  }

  const payload = {
    windowDays: readNumber('FLEET_ANALYTICS_WINDOW_DAYS', 180),
    horizonDays: readNumber('FLEET_ANALYTICS_HORIZON_DAYS', 60),
    expectedOveruseThresholdPct: readNumber('FLEET_ANALYTICS_OVERUSE_THRESHOLD_PCT', 20),
    defaultExpectedKmPerLiter: readNumber('FLEET_ANALYTICS_DEFAULT_KM_PER_LITER', 6),
  };

  const endpoint = `${apiBaseUrl.replace(/\/+$/, '')}/v1/fleet-transport/analytics/snapshots/run-daily`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${bearer}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const disableLocalFallback =
      (process.env.FLEET_SNAPSHOT_DISABLE_LOCAL_FALLBACK ?? '').trim().toLowerCase() === 'true';
    const msg = error instanceof Error ? error.message : String(error);
    const isConnectionIssue = /connectionrefused|unable to connect|econnrefused|fetch failed/i.test(
      msg,
    );
    if (!disableLocalFallback && isConnectionIssue) {
      const { app } = await import('../src/server/app');
      const req = new Request(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bearer}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      res = await app.handle(req);
    } else {
      throw error;
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Snapshot job failed: HTTP ${res.status} ${res.statusText} - ${text}`);
  }

  const data = (await res.json()) as SnapshotResponse;
  console.log(
    JSON.stringify(
      {
        ok: true,
        generatedAt: data.generatedAt,
        windowDays: data.windowDays,
        horizonDays: data.horizonDays,
        compliance: data.compliance,
        fraud: data.fraud,
        economics: data.economics,
        reliability: data.reliability,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error('[fleet-analytics-snapshot-job] failed:', error);
  process.exit(1);
});

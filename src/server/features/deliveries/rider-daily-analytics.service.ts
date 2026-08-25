import { BadRequest } from '@/server/utils/http-error';
import { getRiderDailyAnalyticsRepo } from './rider-daily-analytics.repository';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function currentDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getRiderDailyAnalyticsSvc(input: {
  riderUserId: string;
  date?: string | null;
}) {
  const date = input.date?.trim() || currentDateKey();
  if (!DATE_KEY_PATTERN.test(date)) throw BadRequest('Date must use YYYY-MM-DD format');

  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) throw BadRequest('Invalid analytics date');
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const analytics = await getRiderDailyAnalyticsRepo({
    riderUserId: input.riderUserId,
    start,
    end,
  });
  return { date, ...analytics };
}

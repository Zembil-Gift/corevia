export type PeriodRange = {
  periodStart: string;
  periodEnd: string;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

export const toISODateUTC = (date: Date) => date.toISOString().slice(0, 10);

export const getTodayUTCISODate = () => toISODateUTC(new Date());

export const getCurrentUTCMonth = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`;
};

const parseMonth = (month: string) => {
  // Expected format: YYYY-MM (like <input type="month" />)
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) return null;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
};

export const periodFromMonth = (
  month: string,
  options: { capToToday?: boolean } = {},
): PeriodRange => {
  const parsed = parseMonth(month);
  if (!parsed) return { periodStart: "", periodEnd: "" };

  const { year, monthIndex } = parsed;

  // Use UTC to avoid timezone off-by-one issues.
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));

  let periodStart = toISODateUTC(start);
  let periodEnd = toISODateUTC(end);

  const capToToday = options.capToToday ?? true;
  if (capToToday) {
    const today = getTodayUTCISODate();
    if (periodEnd > today) periodEnd = today;
  }

  // Extra safety: never return an inverted range.
  if (periodStart && periodEnd && periodEnd < periodStart) {
    periodEnd = periodStart;
  }

  return { periodStart, periodEnd };
};

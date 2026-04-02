import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createId } from '@paralleldrive/cuid2';
import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, companies, departments, employees, jobTitles, users } from '@/db/schemas';
import { EmploymentStatus, EmploymentType } from '@/db/schemas/enums';

type StaffSeedRow = {
  staffId: string;
  name: string;
  branch: string;
  jobTitle: string;
  reportingOfficerTitle: string;
};

const DEFAULT_COMPANY_CODE = process.env.SEED_COMPANY_CODE ?? 'VIPEX';
const DEFAULT_HIRE_DATE = new Date(
  process.env.SEED_EMPLOYEE_HIRE_DATE ?? '2026-01-01T00:00:00.000Z',
);
const STAFF_DATA_PATH = process.env.HR_STAFF_SEED_FILE ?? 'scripts/data/hr_staff_seed.json';

const DEPARTMENTS = [
  'Operations',
  'Transport',
  'Finance',
  'Security',
  'Customer Service',
  'Stores & Inventory',
  'IT',
  'Audit',
  'HR / Administration',
  'Strategy / Leadership',
] as const;

const JOB_TITLE_TO_DEPARTMENT: Record<string, (typeof DEPARTMENTS)[number]> = {
  'PARCEL OFFICER': 'Operations',
  SUPERVISORS: 'Operations',
  'FIELD OFFICER': 'Operations',
  'FIELD LEADERS': 'Operations',
  'FIELD LEADER': 'Operations',
  'FRONT DESK': 'Operations',
  'BRANCH MANAGER': 'Operations',
  'FRONT DESK SUPERVISORS': 'Operations',
  'ASS. BRANCH MANAGERS': 'Operations',
  'ASS BRANCH MANAGER': 'Operations',
  'DELIVERY SUPERVISOR': 'Operations',
  'DELIVERY MANAGER': 'Operations',
  'PARCEL OFFICER-DELIVERY': 'Operations',
  'BRANCH MANAGERS': 'Operations',
  'DELIVERY SUPERVISORS': 'Operations',

  'INTERNAL DRIVER': 'Transport',
  'TRANSPORT OFFICERS': 'Transport',
  'INTERCITY DRIVER': 'Transport',
  'ACTING TRANSPORT OFFICER': 'Transport',
  'TRANSPORT MANAGER': 'Transport',
  'TRANSPORT OFFICER': 'Transport',
  'ESTATE & TRANSPORT MANAGER': 'Transport',
  'DISPATCH RIDER': 'Transport',
  MATE: 'Transport',
  DRIVERS: 'Transport',

  CASHIER: 'Finance',
  'ACCOUNT OFFICERS': 'Finance',
  'ACCOUNT OFFICER': 'Finance',
  'FINANCIAL CONTROLLER': 'Finance',
  'HEAD OF ACCOUNTS & STORES': 'Finance',

  SECURITY: 'Security',
  'SECURITY SUPERVISOR': 'Security',
  'HEAD OF SECURITY': 'Security',

  'CUSTOMER SERVICE SUPERVISOR': 'Customer Service',
  'CUSTOMER SERVICE REP': 'Customer Service',

  'BRANCH STORES REP': 'Stores & Inventory',
  'STORES MANAGER': 'Stores & Inventory',
  'HEAD OF STORES DEPARTMENT': 'Stores & Inventory',
  'STORES OFFICER': 'Stores & Inventory',

  'IT ADMIN': 'IT',
  'IT OFFICER': 'IT',
  'IT ADMINISTRATOR': 'IT',
  'HEAD OF IT': 'IT',

  'INTERNAL AUDITOR': 'Audit',
  'AUDIT MANAGER': 'Audit',

  'ADMINISTRATIVE OFFICER': 'HR / Administration',

  'OPERATIONS STRATEGIST': 'Strategy / Leadership',
  'OPERATION STRATEGIST': 'Strategy / Leadership',
  'MANAGING DIRECTOR': 'Strategy / Leadership',
};

function normalizeName(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

function normalizeTitle(input: string) {
  return normalizeName(input).replace(/\./g, '').toUpperCase();
}

function splitName(displayName: string) {
  const clean = normalizeName(displayName);
  const parts = clean.split(' ').filter(Boolean);
  if (!parts.length) return { firstName: 'Unknown', middleName: null, lastName: 'Unknown' };
  if (parts.length === 1) {
    const only = parts[0] ?? 'Unknown';
    return { firstName: only, middleName: null, lastName: only };
  }
  const firstName = parts[0] ?? 'Unknown';
  const lastName = parts[parts.length - 1] ?? firstName;
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : null;
  return { firstName, middleName, lastName };
}

function buildSyntheticTelephone(index: number) {
  return `020${String(index + 1).padStart(7, '0')}`;
}

function toSeriesCode(prefix: 'DEP' | 'JT', value: number) {
  return `${prefix}${String(value).padStart(3, '0')}`;
}

function readStaffData(): StaffSeedRow[] {
  const raw = readFileSync(STAFF_DATA_PATH, 'utf8');
  const rows = JSON.parse(raw) as StaffSeedRow[];
  return rows
    .map((row) => ({
      staffId: normalizeName(row.staffId),
      name: normalizeName(row.name),
      branch: normalizeName(row.branch).toUpperCase(),
      jobTitle: normalizeTitle(row.jobTitle),
      reportingOfficerTitle: normalizeTitle(row.reportingOfficerTitle),
    }))
    .sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.staffId.localeCompare(b.staffId);
    });
}

async function resolveCompanyId() {
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(sql`lower(${companies.code}) = lower(${DEFAULT_COMPANY_CODE})`)
    .limit(1);
  if (company) return company.id;

  const [fallback] = await db
    .select({ id: companies.id })
    .from(companies)
    .orderBy(asc(companies.createdAt))
    .limit(1);
  if (!fallback) throw new Error('No company found. Run base seed first.');
  return fallback.id;
}

async function resolveActorUserId(companyId: string) {
  if (process.env.SEED_ACTOR_USER_ID) return process.env.SEED_ACTOR_USER_ID;
  if (process.env.SEED_ACTOR_EMAIL) {
    const [byEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          sql`lower(${users.email}) = lower(${process.env.SEED_ACTOR_EMAIL})`,
        ),
      )
      .limit(1);
    if (byEmail) return byEmail.id;
  }

  const [fallback] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId))
    .orderBy(asc(users.createdAt))
    .limit(1);
  if (!fallback) throw new Error('No users found for target company. Run base seed first.');
  return fallback.id;
}

async function main() {
  const rows = readStaffData();
  if (!rows.length) throw new Error('No rows found in HR staff seed file.');

  const companyId = await resolveCompanyId();
  const actorUserId = await resolveActorUserId(companyId);

  const distinctTitlesFromData = new Set<string>();
  for (const row of rows) {
    distinctTitlesFromData.add(row.jobTitle);
    distinctTitlesFromData.add(row.reportingOfficerTitle);
  }
  distinctTitlesFromData.add('HEAD OF IT');
  distinctTitlesFromData.add('MANAGING DIRECTOR');

  const unknownTitles = [...distinctTitlesFromData].filter(
    (title) => !JOB_TITLE_TO_DEPARTMENT[title],
  );
  if (unknownTitles.length) {
    throw new Error(`Unmapped job titles found: ${unknownTitles.join(', ')}`);
  }

  const departmentIdsByName = new Map<string, string>();
  const sortedDepartments = [...DEPARTMENTS].sort((a, b) => a.localeCompare(b));
  for (const [departmentIndex, departmentName] of sortedDepartments.entries()) {
    const departmentCode = toSeriesCode('DEP', departmentIndex + 1);
    const [existing] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.companyId, companyId), ilike(departments.name, departmentName)))
      .limit(1);

    if (existing) {
      await db
        .update(departments)
        .set({ code: departmentCode, isActive: true, updatedAt: new Date() })
        .where(eq(departments.id, existing.id));
      departmentIdsByName.set(departmentName, existing.id);
      continue;
    }

    const id = createId();
    await db.insert(departments).values({
      id,
      companyId,
      name: departmentName,
      code: departmentCode,
      isActive: true,
      createdBy: actorUserId,
    });
    departmentIdsByName.set(departmentName, id);
  }

  const titleIdsByName = new Map<string, string>();
  const allTitles = [...distinctTitlesFromData].sort((a, b) => a.localeCompare(b));
  for (const [titleIndex, title] of allTitles.entries()) {
    const jobTitleCode = toSeriesCode('JT', titleIndex + 1);
    const departmentName = JOB_TITLE_TO_DEPARTMENT[title];
    if (!departmentName) throw new Error(`Missing department mapping for title '${title}'`);
    const departmentId = departmentIdsByName.get(departmentName);
    if (!departmentId)
      throw new Error(`Missing department '${departmentName}' for title '${title}'`);

    const [existing] = await db
      .select({ id: jobTitles.id })
      .from(jobTitles)
      .where(and(eq(jobTitles.companyId, companyId), ilike(jobTitles.name, title)))
      .limit(1);

    if (existing) {
      await db
        .update(jobTitles)
        .set({ departmentId, code: jobTitleCode, isActive: true, updatedAt: new Date() })
        .where(eq(jobTitles.id, existing.id));
      titleIdsByName.set(title, existing.id);
      continue;
    }

    const id = createId();
    await db.insert(jobTitles).values({
      id,
      companyId,
      departmentId,
      code: jobTitleCode,
      name: title,
      isActive: true,
      createdBy: actorUserId,
    });
    titleIdsByName.set(title, id);
  }

  const companyBranches = await db
    .select({ id: branches.id, name: branches.name })
    .from(branches)
    .where(and(eq(branches.companyId, companyId), eq(branches.isDeleted, false)));

  const branchByExactName = new Map(
    companyBranches.map((branch) => [normalizeName(branch.name).toUpperCase(), branch.id]),
  );
  const unresolvedBranches = new Set<string>();

  const existingEmployees = await db
    .select({ id: employees.id, employeeNumber: employees.employeeNumber })
    .from(employees)
    .where(eq(employees.companyId, companyId));
  const employeeIdByNumber = new Map(existingEmployees.map((row) => [row.employeeNumber, row.id]));

  let inserts = 0;
  let updates = 0;
  for (const [index, row] of rows.entries()) {
    const branchToken = row.branch.toUpperCase();

    let branchId = branchByExactName.get(branchToken) ?? null;
    if (!branchId) {
      const fuzzy = companyBranches.find((branch) =>
        normalizeName(branch.name).toUpperCase().includes(branchToken),
      );
      branchId = fuzzy?.id ?? null;
    }
    if (!branchId) unresolvedBranches.add(branchToken);

    const jobTitleId = titleIdsByName.get(row.jobTitle) ?? null;
    const reportingOfficerTitleId = titleIdsByName.get(row.reportingOfficerTitle) ?? null;
    const mappedDepartmentName = row.jobTitle ? JOB_TITLE_TO_DEPARTMENT[row.jobTitle] : undefined;
    const departmentId = mappedDepartmentName
      ? (departmentIdsByName.get(mappedDepartmentName) ?? null)
      : null;

    const { firstName, middleName, lastName } = splitName(row.name);
    const displayName = normalizeName(row.name);
    const telephone = buildSyntheticTelephone(index);

    const existingId = employeeIdByNumber.get(row.staffId);
    if (existingId) {
      await db
        .update(employees)
        .set({
          firstName,
          middleName,
          lastName,
          displayName,
          telephone,
          branchId,
          departmentId,
          jobTitleId,
          reportingOfficerTitleId,
          officerEmployeeId: null,
          employmentStatus: EmploymentStatus.ACTIVE,
          employmentType: EmploymentType.FULL_TIME,
          hireDate: DEFAULT_HIRE_DATE,
          isDeleted: false,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, existingId));
      updates += 1;
      continue;
    }

    const employeeInsert: typeof employees.$inferInsert = {
      companyId,
      employeeNumber: row.staffId,
      firstName,
      middleName,
      lastName,
      displayName,
      email: null,
      telephone,
      branchId,
      departmentId,
      jobTitleId,
      reportingOfficerTitleId,
      officerEmployeeId: null,
      managerEmployeeId: null,
      employmentStatus: EmploymentStatus.ACTIVE,
      employmentType: EmploymentType.FULL_TIME,
      hireDate: DEFAULT_HIRE_DATE,
      hasUserAccount: false,
      isDeleted: false,
      createdBy: actorUserId,
    };
    await db.insert(employees).values(employeeInsert);
    inserts += 1;
  }

  if (unresolvedBranches.size > 0) {
    console.warn(
      `Warning: unresolved branch names (${unresolvedBranches.size}): ${[...unresolvedBranches].join(', ')}`,
    );
  }

  console.log('HR staff seed complete.');
  console.log({
    companyId,
    actorUserId,
    departments: departmentIdsByName.size,
    jobTitles: titleIdsByName.size,
    insertedEmployees: inserts,
    updatedEmployees: updates,
    sourceRows: rows.length,
  });
}

main().catch((error) => {
  console.error('HR staff seed failed:', error);
  process.exit(1);
});

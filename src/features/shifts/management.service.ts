import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../../../../../db/client';
import { cashierSessions, shiftTypes, companies, branches, users } from '../../../../../db/schemas';

export interface ShiftStartInput {
  sessionId: string;
  openingBalancePsw: string; // in pesewas
  notes?: string;
  actualStartTime?: Date;
}

export interface ShiftEndInput {
  sessionId: string;
  closingBalancePsw: string; // in pesewas
  handoverToCashierId?: string;
  handoverNotes?: string;
  actualEndTime?: Date;
  varianceReason?: string;
}

/**
 * Start a cashier session with shift support
 */
export async function startShift(input: ShiftStartInput): Promise<{
  sessionId: string;
  message: string;
}> {
  // Get cashier session
  const [session] = await db
    .select()
    .from(cashierSessions)
    .where(eq(cashierSessions.id, input.sessionId))
    .limit(1);

  if (!session) {
    throw new Error('Session not found');
  }

  // Update session with start time and opening balance
  await db
    .update(cashierSessions)
    .set({
      actualStartTime: input.actualStartTime ? new Date(input.actualStartTime) : new Date(),
      openingBalancePsw: parseFloat(input.openingBalancePsw || '0') * 100,
      status: 'ACTIVE',
    })
    .where(eq(cashierSessions.id, input.sessionId));

  return {
    sessionId: input.sessionId,
    message: 'Shift started successfully',
  };
}

/**
 * End a cashier session with comprehensive reporting
 */
export async function endShift(input: ShiftEndInput): Promise<{
  sessionId: string;
  shiftReport: any;
  message: string;
}> {
  // Get cashier session
  const [session] = await db
    .select({
      id: cashierSessions.id,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualStartTime: cashierSessions.actualStartTime,
      shiftTypeId: cashierSessions.shiftTypeId,
    })
    .from(cashierSessions)
    .where(eq(cashierSessions.id, input.sessionId))
    .limit(1);

  if (!session) {
    throw new Error('Session not found');
  }

  const closingBalancePsw = parseFloat(input.closingBalancePsw) * 100;
  const variancePsw = closingBalancePsw - session.openingBalancePsw;

  // Update session with end time and financial details
  await db
    .update(cashierSessions)
    .set({
      actualEndTime: input.actualEndTime ? new Date(input.actualEndTime) : new Date(),
      closingBalancePsw,
      variancePsw,
      status: 'COMPLETED',
      handoverToCashierId: input.handoverToCashierId,
      handoverTime: new Date(),
      handoverNotes: input.handoverNotes,
      updatedAt: new Date(),
    })
    .where(eq(cashierSessions.id, input.sessionId));

  // Generate comprehensive shift report
  const shiftReport = await generateShiftReport(session);

  return {
    sessionId: input.sessionId,
    shiftReport,
    message: `Shift completed. Variance: ${variancePsw > 0 ? 'GHS ' + (variancePsw / 100).toFixed(2) + ' surplus' : 'GHS ' + (Math.abs(variancePsw) / 100).toFixed(2) + ' shortage'}`,
  };
}

/**
 * Generate comprehensive shift report
 */
async function generateShiftReport(session: any): Promise<any> {
  // Get shift type details
  const [shiftType] = await db
    .select({
      name: shiftTypes.name,
      allowCrossDay: shiftTypes.allowCrossDay,
      standardDurationHours: shiftTypes.standardDurationHours,
    })
    .from(shiftTypes)
    .where(eq(shiftTypes.id, session.shiftTypeId))
    .limit(1);

  const shiftDuration = calculateShiftDuration(session);
  const complianceScore = calculateComplianceScore(session);

  return {
    sessionId: session.id,
    shiftType: shiftType?.name || 'Unknown',
    isCrossDayShift: shiftType?.allowCrossDay || false,
    scheduledStart: session.scheduledStartTime,
    actualStart: session.actualStartTime,
    scheduledEnd: session.scheduledEndTime,
    actualEnd: session.actualEndTime,
    duration: shiftDuration,

    // Financial metrics
    openingBalance: session.openingBalancePsw
      ? (Number(session.openingBalancePsw) / 100).toFixed(2)
      : '0.00',
    closingBalance: session.closingBalancePsw
      ? (Number(session.closingBalancePsw) / 100).toFixed(2)
      : '0.00',
    variance: session.variancePsw ? (Number(session.variancePsw) / 100).toFixed(2) : '0.00',
    varianceReason:
      session.variancePsw > 0
        ? 'Surplus cash'
        : session.variancePsw < 0
          ? 'Cash shortage'
          : 'Balanced',

    // Compliance metrics
    complianceScore,
    requiresInvestigation: Math.abs(Number(session.variancePsw || 0)) > 50000, // GHS 500.00 variance threshold

    // Performance metrics
    efficiencyScore: calculateShiftEfficiencyScore(session),
  };
}

function calculateShiftDuration(session: any): string {
  if (!session.actualStartTime || !session.actualEndTime) {
    return 'Not completed';
  }

  const duration = session.actualEndTime.getTime() - session.actualStartTime.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor(((duration % (1000 * 60 * 60)) / 1000) * 60);

  return `${hours}h ${minutes}m`;
}

function calculateComplianceScore(session: any): number {
  let score = 100; // Start with perfect score

  // Deduct for variance (max 30 points)
  if (session.variancePsw) {
    const variancePercent =
      (Math.abs(Number(session.variancePsw)) / Number(session.openingBalancePsw || 1)) * 100;
    score -= Math.min(30, variancePercent * 5); // Max 30 points for variance
  }

  // Deduct for late start
  if (session.actualStartTime && session.scheduledStartTime) {
    const lateStart = session.actualStartTime.getTime() - session.scheduledStartTime.getTime();
    const lateMinutes = lateStart / (1000 * 60);
    if (lateMinutes > 5) {
      // More than 5 minutes late
      score -= Math.min(20, (lateStart - 5 * 60 * 1000) / (1000 * 60)); // Max 20 points for late start
    }
  }

  return Math.max(0, score);
}

function calculateShiftEfficiencyScore(session: any): number {
  let score = 50; // Start with base score

  // Bonus for on-time completion
  if (session.actualEndTime && session.scheduledEndTime) {
    const onTime = session.actualEndTime.getTime() <= session.scheduledEndTime.getTime();
    if (onTime) {
      score += 30; // 30 points for on-time completion
    }
  }

  // Bonus for low variance
  if (session.variancePsw && session.openingBalancePsw) {
    const variancePercent =
      (Math.abs(Number(session.variancePsw)) / Number(session.openingBalancePsw || 1)) * 100;
    if (variancePercent < 2) {
      // Less than 2% variance
      score += 20; // 20 points for accurate cash handling
    }
  }

  return Math.min(100, score);
}

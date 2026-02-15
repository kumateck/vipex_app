export type ShiftStartInput = {
  sessionId: string;
  openingBalancePsw: string;
  notes?: string;
  actualStartTime?: Date;
};

export type ShiftEndInput = {
  sessionId: string;
  closingBalancePsw: string;
  handoverToCashierId?: string;
  handoverNotes?: string;
  actualEndTime?: Date;
  varianceReason?: string;
};

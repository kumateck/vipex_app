type StoredTimestamp = Date | string;
export type WorkflowParcel = {
  id: string;
  booking_code: string;
  destination_id: string;
  pickup_location_id: string | null;
  status: number;
  received_at: StoredTimestamp | null;
  confirmed_at: StoredTimestamp | null;
  deleted_at: StoredTimestamp | null;
  call_center_assigned_to_user_id: string | null;
  call_center_called_at: StoredTimestamp | null;
  updated_at: StoredTimestamp;
};
export type ReceivingLocation = { id: string; name: string };
export type StatusEvidence = {
  id: string;
  created_at: StoredTimestamp;
  previous_status: string | null;
  next_status: string | null;
};
export type DeliveryEvidence = {
  id: string;
  mode: number;
  status: string;
  delivered_at: StoredTimestamp | null;
  confirmed_at: StoredTimestamp | null;
  rider_completed_at: StoredTimestamp | null;
};
export type WorkflowEvidence = {
  locations: ReceivingLocation[];
  latestStatusChange: StatusEvidence | null;
  deliveries: DeliveryEvidence[];
};

CREATE TABLE IF NOT EXISTS inventory_approval_policies (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  entity_type smallint NOT NULL DEFAULT 0,
  min_amount bigint NOT NULL DEFAULT 0,
  max_amount bigint,
  location_type smallint,
  level1_approver_role_id varchar(25),
  level2_approver_role_id varchar(25),
  sla_hours smallint NOT NULL DEFAULT 24,
  escalation_role_id varchar(25),
  active boolean NOT NULL DEFAULT true,
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_approval_policies_company_idx
  ON inventory_approval_policies (company_id);
CREATE INDEX IF NOT EXISTS inventory_approval_policies_entity_idx
  ON inventory_approval_policies (entity_type);
CREATE INDEX IF NOT EXISTS inventory_approval_policies_active_idx
  ON inventory_approval_policies (active);

CREATE TABLE IF NOT EXISTS inventory_approval_requests (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  entity_type smallint NOT NULL DEFAULT 0,
  entity_id varchar(25) NOT NULL,
  policy_id varchar(25) REFERENCES inventory_approval_policies(id),
  status smallint NOT NULL DEFAULT 0,
  level_no smallint NOT NULL DEFAULT 1,
  amount bigint NOT NULL DEFAULT 0,
  submitted_by varchar(25) NOT NULL,
  submitted_at timestamp NOT NULL DEFAULT now(),
  decided_by varchar(25),
  decided_at timestamp,
  decision_reason text,
  escalation_at timestamp,
  due_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_approval_requests_company_idx
  ON inventory_approval_requests (company_id);
CREATE INDEX IF NOT EXISTS inventory_approval_requests_entity_idx
  ON inventory_approval_requests (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS inventory_approval_requests_status_idx
  ON inventory_approval_requests (status);
CREATE INDEX IF NOT EXISTS inventory_approval_requests_due_idx
  ON inventory_approval_requests (due_at);

CREATE TABLE IF NOT EXISTS inventory_valuation_snapshots (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  product_id varchar(25) NOT NULL REFERENCES products(id),
  location_id varchar(25) NOT NULL REFERENCES inventory_locations(id),
  method smallint NOT NULL DEFAULT 0,
  quantity bigint NOT NULL DEFAULT 0,
  average_unit_cost bigint NOT NULL DEFAULT 0,
  total_value bigint NOT NULL DEFAULT 0,
  snapshot_at timestamp NOT NULL DEFAULT now(),
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_valuation_snapshots_company_idx
  ON inventory_valuation_snapshots (company_id);
CREATE INDEX IF NOT EXISTS inventory_valuation_snapshots_product_location_idx
  ON inventory_valuation_snapshots (product_id, location_id);
CREATE INDEX IF NOT EXISTS inventory_valuation_snapshots_at_idx
  ON inventory_valuation_snapshots (snapshot_at);

CREATE TABLE IF NOT EXISTS inventory_financial_postings (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  movement_id varchar(25) NOT NULL REFERENCES stock_movements(id),
  account_code_dr varchar(30) NOT NULL,
  account_code_cr varchar(30) NOT NULL,
  amount bigint NOT NULL DEFAULT 0,
  posting_date timestamp NOT NULL DEFAULT now(),
  posted_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_financial_postings_movement_uq
  ON inventory_financial_postings (movement_id);
CREATE INDEX IF NOT EXISTS inventory_financial_postings_company_idx
  ON inventory_financial_postings (company_id);
CREATE INDEX IF NOT EXISTS inventory_financial_postings_date_idx
  ON inventory_financial_postings (posting_date);

CREATE TABLE IF NOT EXISTS inventory_replenishment_proposals (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  proposal_no varchar(60) NOT NULL,
  scope_location_id varchar(25) REFERENCES inventory_locations(id),
  lead_time_days smallint NOT NULL DEFAULT 7,
  coverage_days smallint NOT NULL DEFAULT 14,
  status smallint NOT NULL DEFAULT 0,
  notes text,
  generated_by varchar(25) NOT NULL,
  generated_at timestamp NOT NULL DEFAULT now(),
  approved_by varchar(25),
  approved_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_replenishment_proposals_company_no_uq
  ON inventory_replenishment_proposals (company_id, proposal_no);
CREATE INDEX IF NOT EXISTS inventory_replenishment_proposals_company_idx
  ON inventory_replenishment_proposals (company_id);
CREATE INDEX IF NOT EXISTS inventory_replenishment_proposals_status_idx
  ON inventory_replenishment_proposals (status);

CREATE TABLE IF NOT EXISTS inventory_replenishment_proposal_lines (
  id varchar(25) PRIMARY KEY,
  proposal_id varchar(25) NOT NULL REFERENCES inventory_replenishment_proposals(id),
  product_id varchar(25) NOT NULL REFERENCES products(id),
  location_id varchar(25) NOT NULL REFERENCES inventory_locations(id),
  current_quantity bigint NOT NULL DEFAULT 0,
  min_stock_level bigint NOT NULL DEFAULT 0,
  suggested_quantity bigint NOT NULL DEFAULT 0,
  source_location_id varchar(25) REFERENCES inventory_locations(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_replenishment_proposal_lines_proposal_idx
  ON inventory_replenishment_proposal_lines (proposal_id);
CREATE INDEX IF NOT EXISTS inventory_replenishment_proposal_lines_product_idx
  ON inventory_replenishment_proposal_lines (product_id);

CREATE TABLE IF NOT EXISTS inventory_tasks (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  task_type smallint NOT NULL DEFAULT 0,
  status smallint NOT NULL DEFAULT 0,
  product_id varchar(25) REFERENCES products(id),
  from_location_id varchar(25) REFERENCES inventory_locations(id),
  to_location_id varchar(25) REFERENCES inventory_locations(id),
  planned_quantity bigint NOT NULL DEFAULT 0,
  processed_quantity bigint NOT NULL DEFAULT 0,
  assigned_to varchar(25),
  notes text,
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  started_at timestamp,
  completed_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_tasks_company_idx
  ON inventory_tasks (company_id);
CREATE INDEX IF NOT EXISTS inventory_tasks_type_idx
  ON inventory_tasks (task_type);
CREATE INDEX IF NOT EXISTS inventory_tasks_status_idx
  ON inventory_tasks (status);
CREATE INDEX IF NOT EXISTS inventory_tasks_assigned_idx
  ON inventory_tasks (assigned_to);

CREATE TABLE IF NOT EXISTS inventory_task_scans (
  id varchar(25) PRIMARY KEY,
  task_id varchar(25) NOT NULL REFERENCES inventory_tasks(id),
  scan_code varchar(120) NOT NULL,
  quantity bigint NOT NULL DEFAULT 0,
  scanned_by varchar(25) NOT NULL,
  scanned_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_task_scans_task_idx
  ON inventory_task_scans (task_id);
CREATE INDEX IF NOT EXISTS inventory_task_scans_at_idx
  ON inventory_task_scans (scanned_at);

CREATE TABLE IF NOT EXISTS inventory_event_journal (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  event_type smallint NOT NULL DEFAULT 0,
  entity_type varchar(60) NOT NULL,
  entity_id varchar(25) NOT NULL,
  payload_json text NOT NULL,
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_event_journal_company_idx
  ON inventory_event_journal (company_id);
CREATE INDEX IF NOT EXISTS inventory_event_journal_entity_idx
  ON inventory_event_journal (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS inventory_event_journal_type_idx
  ON inventory_event_journal (event_type);
CREATE INDEX IF NOT EXISTS inventory_event_journal_at_idx
  ON inventory_event_journal (created_at);

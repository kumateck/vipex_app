ALTER TABLE procurement_goods_receipt_items
  ADD COLUMN IF NOT EXISTS lot_id varchar(25),
  ADD COLUMN IF NOT EXISTS batch_number varchar(100),
  ADD COLUMN IF NOT EXISTS supplier_batch_number varchar(100),
  ADD COLUMN IF NOT EXISTS manufactured_at timestamp,
  ADD COLUMN IF NOT EXISTS expiry_date timestamp;

CREATE INDEX IF NOT EXISTS procurement_goods_receipt_items_lot_idx
  ON procurement_goods_receipt_items (lot_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'procurement_goods_receipt_items_lot_fk'
  ) THEN
    ALTER TABLE procurement_goods_receipt_items
      ADD CONSTRAINT procurement_goods_receipt_items_lot_fk
      FOREIGN KEY (lot_id) REFERENCES stock_lots(id);
  END IF;
END $$;

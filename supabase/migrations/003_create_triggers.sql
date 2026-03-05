-- マカセテ在宅 - Triggers
-- 003: SLA calculation, audit logging, updated_at

-- ===== updated_at trigger =====
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_handovers_updated_at BEFORE UPDATE ON handovers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== SLA auto-calculation trigger =====
CREATE OR REPLACE FUNCTION calc_sla() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_callback_at IS NOT NULL AND NEW.received_at IS NOT NULL THEN
    NEW.sla_met := (
      EXTRACT(EPOCH FROM (NEW.first_callback_at - NEW.received_at)) / 60
    ) <= (
      SELECT COALESCE(sla_target_minutes, 15)
      FROM organizations
      WHERE id = NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requests_sla BEFORE INSERT OR UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION calc_sla();

-- ===== Audit log trigger =====
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Try to get organization_id from the record
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
  ELSE
    v_org_id := NEW.organization_id;
  END IF;

  INSERT INTO audit_logs (organization_id, user_id, action, target_type, target_id, details)
  VALUES (
    v_org_id,
    auth.uid(),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
    END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER trg_requests_audit AFTER INSERT OR UPDATE OR DELETE ON requests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
CREATE TRIGGER trg_assignments_audit AFTER INSERT OR UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
CREATE TRIGGER trg_handovers_audit AFTER INSERT OR UPDATE ON handovers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
CREATE TRIGGER trg_patients_audit AFTER INSERT OR UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

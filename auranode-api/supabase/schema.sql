-- AuraNode Supabase Schema
-- Execute this in the Supabase SQL Editor in one run.

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
    address     TEXT NOT NULL CHECK (char_length(address) >= 5),
    city        TEXT NOT NULL CHECK (char_length(city) >= 2),
    contact_email TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('clinic_admin','clinic_worker','doctor','superadmin')),
    full_name   TEXT NOT NULL,
    pmdc_number TEXT,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. clinic_doctor_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_doctor_assignments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_org_id, doctor_user_id)
);

-- ============================================================
-- 5. patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    phone_hash  TEXT NOT NULL,
    phone_last4 TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, phone_hash)
);

-- ============================================================
-- 6. reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_name    TEXT NOT NULL,
    upload_type     TEXT NOT NULL CHECK (upload_type IN ('xray','lab')),
    file_url        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'uploading'
                        CHECK (status IN (
                            'uploading','processing','awaiting_doctor',
                            'reviewed','delivered','processing_failed'
                        )),
    ai_findings     JSONB,
    ai_summary      TEXT,
    doctor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    doctor_notes    TEXT,
    reviewed_at     TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    signed_url_token TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    meta        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id   UUID REFERENCES reports(id) ON DELETE SET NULL,
    message     TEXT NOT NULL,
    type        TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. Enable Row Level Security on every table
-- ============================================================
ALTER TABLE organizations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_doctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS Policies
-- ============================================================

-- organizations --
CREATE POLICY "org_members_select" ON organizations
    FOR SELECT
    USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- users --
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "users_select_same_org" ON users
    FOR SELECT
    USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('clinic_admin')
    );

-- reports --
CREATE POLICY "reports_org_select" ON reports
    FOR SELECT
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "reports_org_insert" ON reports
    FOR INSERT
    WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "reports_org_update" ON reports
    FOR UPDATE
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- patients --
CREATE POLICY "patients_org_select" ON patients
    FOR SELECT
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "patients_org_insert" ON patients
    FOR INSERT
    WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- notifications --
CREATE POLICY "notifications_own_select" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "notifications_own_update" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- audit_logs --
CREATE POLICY "audit_insert_only" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- 11. Indexes
-- ============================================================
CREATE INDEX idx_reports_org_id          ON reports(org_id);
CREATE INDEX idx_reports_status          ON reports(status);
CREATE INDEX idx_reports_doctor_id       ON reports(doctor_id);
CREATE INDEX idx_notifications_user_id   ON notifications(user_id);
CREATE INDEX idx_audit_logs_entity_id    ON audit_logs(entity_id);

ALTER TABLE emergency_requests
    ADD COLUMN selected_hospital_id BIGINT NULL,
    ADD CONSTRAINT fk_emergency_hospital FOREIGN KEY (selected_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;

CREATE INDEX idx_emergency_hospital ON emergency_requests(selected_hospital_id);

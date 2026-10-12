CREATE TABLE emergency_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    emergency_id BIGINT NOT NULL,
    ambulance_id BIGINT NOT NULL,
    assigned_at DATETIME NOT NULL,
    accepted_at DATETIME NULL,
    assignment_score DOUBLE NOT NULL,
    estimated_response_time DOUBLE NOT NULL,
    distance DOUBLE NOT NULL,
    reason VARCHAR(500),
    status ENUM('PENDING','ACCEPTED','REJECTED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_assignment_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE
) ENGINE=InnoDB;

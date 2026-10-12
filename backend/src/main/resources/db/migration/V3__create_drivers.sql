CREATE TABLE drivers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL,
    ambulance_id BIGINT NULL,
    current_latitude DOUBLE NULL,
    current_longitude DOUBLE NULL,
    status ENUM('AVAILABLE','ASSIGNED','EN_ROUTE','AT_SCENE','TRANSPORTING','OFFLINE') NOT NULL DEFAULT 'OFFLINE',
    CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE ambulances
    ADD CONSTRAINT fk_ambulances_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

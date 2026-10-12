-- V12: Add Emergency Offers, Multi-Unit Responder Types, and Detailed Emergency Fields

-- 1. Expand Emergency Types and Fields on emergency_requests
ALTER TABLE emergency_requests
    MODIFY COLUMN emergency_type ENUM('MEDICAL','AMBULANCE','ACCIDENT','CARDIAC','TRAUMA','POLICE','FIRE','OTHER') NOT NULL,
    MODIFY COLUMN status ENUM('CREATED','SEARCHING_RESOURCE','NO_RESOURCE_AVAILABLE','ASSIGNED','ACCEPTED','EN_ROUTE_TO_PATIENT',
                             'PATIENT_PICKED_UP','EN_ROUTE_TO_HOSPITAL','ARRIVED_AT_HOSPITAL','COMPLETED','CANCELLED')
                             NOT NULL DEFAULT 'CREATED',
    ADD COLUMN citizen_name VARCHAR(150) NULL AFTER requester_id,
    ADD COLUMN contact_number VARCHAR(30) NULL AFTER citizen_name,
    ADD COLUMN readable_address VARCHAR(500) NULL AFTER longitude,
    ADD COLUMN landmark VARCHAR(255) NULL AFTER readable_address,
    ADD COLUMN affected_people_count INT NULL AFTER landmark;

-- 2. Expand User Roles for Police and Fire Responders
ALTER TABLE users
    MODIFY COLUMN role ENUM('CITIZEN','DRIVER','FIRE_DRIVER','POLICE','HOSPITAL','ADMIN') NOT NULL;

-- 3. Add Responder Type to Ambulances / Vehicles table and expand status
ALTER TABLE ambulances
    ADD COLUMN responder_type ENUM('AMBULANCE','POLICE','FIRE_ENGINE') NOT NULL DEFAULT 'AMBULANCE' AFTER vehicle_number,
    MODIFY COLUMN status ENUM('AVAILABLE','REQUEST_PENDING','ASSIGNED','EN_ROUTE','AT_SCENE','TRANSPORTING','COMPLETED','OFFLINE') NOT NULL DEFAULT 'AVAILABLE';

-- 4. Expand Driver Status
ALTER TABLE drivers
    MODIFY COLUMN status ENUM('AVAILABLE','REQUEST_PENDING','ASSIGNED','EN_ROUTE','AT_SCENE','TRANSPORTING','COMPLETED','OFFLINE') NOT NULL DEFAULT 'OFFLINE';

-- 5. Create emergency_offers table for real-time Accept/Decline and Reassignment
CREATE TABLE emergency_offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    emergency_id BIGINT NOT NULL,
    responder_type ENUM('AMBULANCE','POLICE','FIRE_ENGINE') NOT NULL DEFAULT 'AMBULANCE',
    responder_id BIGINT NOT NULL,
    driver_user_id BIGINT NULL,
    status ENUM('PENDING','ACCEPTED','DECLINED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    offered_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    responded_at DATETIME NULL,
    decline_reason VARCHAR(255) NULL,
    score DOUBLE NULL,
    distance DOUBLE NULL,
    estimated_response_time DOUBLE NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_offer_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_requests(id) ON DELETE CASCADE,
    INDEX idx_offers_emergency (emergency_id),
    INDEX idx_offers_responder (responder_type, responder_id),
    INDEX idx_offers_status (status)
) ENGINE=InnoDB;

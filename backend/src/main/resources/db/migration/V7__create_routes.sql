CREATE TABLE routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    emergency_id BIGINT NOT NULL,
    ambulance_id BIGINT NOT NULL,
    source_latitude DOUBLE NOT NULL,
    source_longitude DOUBLE NOT NULL,
    destination_latitude DOUBLE NOT NULL,
    destination_longitude DOUBLE NOT NULL,
    distance DOUBLE NOT NULL,
    estimated_time DOUBLE NOT NULL,
    algorithm ENUM('DIJKSTRA','ASTAR') NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_route_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE route_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id BIGINT NOT NULL,
    sequence_number INT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    CONSTRAINT fk_routepoint_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

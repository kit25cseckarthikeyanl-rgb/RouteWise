package com.routewise.entity;

public class Enums {

    public enum Role {
        CITIZEN, DRIVER, FIRE_DRIVER, POLICE, HOSPITAL, ADMIN
    }

    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }

    public enum EmergencyType {
        MEDICAL, AMBULANCE, ACCIDENT, CARDIAC, TRAUMA, POLICE, FIRE, OTHER
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum EmergencyStatus {
        CREATED,
        SEARCHING_RESOURCE,
        NO_RESOURCE_AVAILABLE,
        ASSIGNED,
        ACCEPTED,
        EN_ROUTE_TO_PATIENT,
        PATIENT_PICKED_UP,
        EN_ROUTE_TO_HOSPITAL,
        ARRIVED_AT_HOSPITAL,
        COMPLETED,
        CANCELLED
    }

    public enum AmbulanceStatus {
        AVAILABLE, REQUEST_PENDING, ASSIGNED, EN_ROUTE, AT_SCENE, TRANSPORTING, COMPLETED, OFFLINE
    }

    public enum ResponderType {
        AMBULANCE, POLICE, FIRE_ENGINE
    }

    public enum OfferStatus {
        PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED
    }

    public enum AssignmentStatus {
        PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED
    }

    public enum HospitalStatusEnum {
        AVAILABLE, BUSY, FULL, OFFLINE
    }

    public enum RouteAlgorithm {
        DIJKSTRA, ASTAR
    }

    public enum NotificationType {
        EMERGENCY_CREATED,
        AMBULANCE_ASSIGNED,
        DRIVER_ACCEPTED,
        ROUTE_CALCULATED,
        HOSPITAL_SELECTED,
        AMBULANCE_APPROACHING,
        EMERGENCY_COMPLETED,
        OFFER_CREATED,
        OFFER_DECLINED,
        OFFER_EXPIRED,
        NO_RESOURCE,
        SYSTEM
    }
}

package com.routewise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * RouteWise - Intelligent Emergency Route and Resource Optimization System.
 *
 * ACADEMIC PROTOTYPE DISCLAIMER:
 * This system is a software engineering prototype built for academic
 * demonstration purposes. It is NOT certified for real-world emergency
 * medical deployment, does NOT contact real emergency services, and uses
 * only fictional/synthetic demo data (GPS, traffic, hospital capacity,
 * emergency records).
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class RoutewiseApplication {
    public static void main(String[] args) {
        SpringApplication.run(RoutewiseApplication.class, args);
    }
}

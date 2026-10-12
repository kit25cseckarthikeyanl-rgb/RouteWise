package com.routewise.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class LocationUpdateMessage {
    private Long ambulanceId;
    private Double latitude;
    private Double longitude;
    private String status;
    private Double etaMinutes;
    private LocalDateTime timestamp;
}

package com.routewise.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class NotificationMessage {
    private String type;
    private String title;
    private String message;
    private Long emergencyId;
}

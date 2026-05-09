package com.example.demo.entity;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
public class ChatMessage {
    private Long fromUserId;
    private String fromUserName;
    private Long toUserId;
    private String toUserName;
    private Long itemId;
    private String content;
    private String timestamp;
    private MessageType type;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        TYPING
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        if (timestamp != null) {
            this.timestamp = timestamp.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } else {
            this.timestamp = null;
        }
    }
    
    public LocalDateTime getTimestampAsLocalDateTime() {
        if (timestamp != null && !timestamp.isEmpty()) {
            return LocalDateTime.parse(timestamp, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
        return null;
    }
}
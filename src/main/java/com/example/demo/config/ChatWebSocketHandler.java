package com.example.demo.config;

import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.mapper.MessageMapper;
import com.example.demo.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserService userService;
    private final MessageMapper messageMapper;

    private static final Map<Long, WebSocketSession> onlineUsers = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(UserService userService, MessageMapper messageMapper) {
        this.userService = userService;
        this.messageMapper = messageMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = getUserIdFromSession(session);
        if (userId != null) {
            onlineUsers.put(userId, session);
            System.out.println("用户连接: " + userId);
            
            ChatMessage welcomeMsg = new ChatMessage();
            welcomeMsg.setType(ChatMessage.MessageType.JOIN);
            welcomeMsg.setContent("欢迎加入聊天");
            welcomeMsg.setTimestamp(LocalDateTime.now());
            sendMessageToUser(userId, welcomeMsg);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            ChatMessage chatMessage = objectMapper.readValue(message.getPayload(), ChatMessage.class);
            Long fromUserId = getUserIdFromSession(session);
            
            if (fromUserId != null) {
                chatMessage.setFromUserId(fromUserId);
                chatMessage.setTimestamp(LocalDateTime.now());
                
                User fromUser = userService.getUserById(fromUserId);
                if (fromUser != null) {
                    chatMessage.setFromUserName(fromUser.getUsername());
                }
                
                if (chatMessage.getToUserId() != null) {
                    User toUser = userService.getUserById(chatMessage.getToUserId());
                    if (toUser != null) {
                        chatMessage.setToUserName(toUser.getUsername());
                    }
                }
                
                saveChatMessage(chatMessage);
                
                if (chatMessage.getToUserId() != null) {
                    sendMessageToUser(chatMessage.getToUserId(), chatMessage);
                }
            }
        } catch (Exception e) {
            System.err.println("处理消息失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = getUserIdFromSession(session);
        if (userId != null) {
            onlineUsers.remove(userId);
            System.out.println("用户断开连接: " + userId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("WebSocket传输错误: " + exception.getMessage());
        if (session.isOpen()) {
            session.close();
        }
    }

    private Long getUserIdFromSession(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            if (query != null && query.contains("=")) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("userId=")) {
                        String userId = param.substring("userId=".length());
                        return Long.parseLong(userId);
                    }
                }
            }
            return null;
        } catch (Exception e) {
            System.err.println("解析用户ID失败: " + e.getMessage());
            return null;
        }
    }

    private void sendMessageToUser(Long userId, ChatMessage message) {
        WebSocketSession session = onlineUsers.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String jsonMessage = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(jsonMessage));
            } catch (IOException e) {
                System.err.println("发送消息失败: " + e.getMessage());
            }
        }
    }

    private void saveChatMessage(ChatMessage chatMessage) {
        try {
            Message message = new Message();
            message.setItemId(chatMessage.getItemId());
            message.setFromUserId(chatMessage.getFromUserId());
            message.setToUserId(chatMessage.getToUserId());
            message.setMessageType(0);
            message.setContent(chatMessage.getContent());
            message.setIsRead(0);
            message.setCreateTime(LocalDateTime.now());
            
            messageMapper.insert(message);
            System.out.println("消息已保存到数据库: " + message.getId());
        } catch (Exception e) {
            System.err.println("保存消息失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static boolean isUserOnline(Long userId) {
        return onlineUsers.containsKey(userId);
    }
}

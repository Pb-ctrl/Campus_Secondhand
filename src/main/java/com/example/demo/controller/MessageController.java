package com.example.demo.controller;

import com.example.demo.dto.Result;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.service.MessageService;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/message")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @GetMapping("/item/{itemId}")
    public Result<List<Map<String, Object>>> getMessagesByItem(@PathVariable Long itemId) {
        try {
            List<Message> messages = messageService.getMessagesByItemId(itemId);
            
            // 为每条留言添加用户名
            List<Map<String, Object>> result = messages.stream().map(message -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", message.getId());
                map.put("itemId", message.getItemId());
                map.put("fromUserId", message.getFromUserId());
                map.put("toUserId", message.getToUserId());
                map.put("messageType", message.getMessageType());
                map.put("content", message.getContent());
                map.put("isRead", message.getIsRead());
                map.put("createTime", message.getCreateTime());
                
                // 获取用户名
                if (message.getFromUserId() != null) {
                    User user = userService.getUserById(message.getFromUserId());
                    map.put("fromUserName", user != null ? user.getUsername() : "未知用户");
                } else {
                    map.put("fromUserName", "系统通知");
                }
                
                return map;
            }).toList();
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/private/{userId}/{otherUserId}")
    public Result<List<Map<String, Object>>> getPrivateMessages(@PathVariable Long userId, @PathVariable Long otherUserId) {
        try {
            List<Message> messages = messageService.getPrivateMessagesBetweenUsers(userId, otherUserId);
            
            List<Map<String, Object>> result = messages.stream().map(message -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", message.getId());
                map.put("fromUserId", message.getFromUserId());
                map.put("toUserId", message.getToUserId());
                map.put("content", message.getContent());
                map.put("isRead", message.getIsRead());
                map.put("createTime", message.getCreateTime());
                
                User fromUser = userService.getUserById(message.getFromUserId());
                map.put("fromUserName", fromUser != null ? fromUser.getUsername() : "未知用户");
                
                return map;
            }).toList();
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/from/{fromUserId}")
    public Result<List<Message>> getMessagesByFromUser(@PathVariable Long fromUserId) {
        try {
            List<Message> messages = messageService.getMessagesByFromUserId(fromUserId);
            return Result.success(messages);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/notifications/{userId}")
    public Result<List<Message>> getNotifications(@PathVariable Long userId) {
        try {
            List<Message> notifications = messageService.getNotificationsByUserId(userId);
            return Result.success(notifications);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/unread/{userId}")
    public Result<Integer> getUnreadCount(@PathVariable Long userId) {
        try {
            int count = messageService.getUnreadCount(userId);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/conversations/{userId}")
    public Result<List<Map<String, Object>>> getConversations(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> conversations = messageService.getConversationsByUserId(userId);
            return Result.success(conversations);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/chat-unread/{userId}")
    public Result<Long> getChatUnreadCount(@PathVariable Long userId) {
        try {
            long count = messageService.getChatUnreadCount(userId);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/send")
    public Result<Void> sendMessage(@RequestBody Message message) {
        try {
            // 系统通知（messageType=1）只需要 toUserId、itemId 和 content
            if (message.getMessageType() != null && message.getMessageType() == 1) {
                if (message.getToUserId() == null || message.getItemId() == null || message.getContent() == null) {
                    return Result.error("必填字段不能为空");
                }
            } else {
                // 普通留言需要 fromUserId、itemId 和 content
                if (message.getFromUserId() == null || message.getItemId() == null || message.getContent() == null) {
                    return Result.error("必填字段不能为空");
                }
            }
            
            boolean success = messageService.sendMessage(message);
            if (success) {
                return Result.success();
            } else {
                return Result.error("发送消息失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{messageId}/{userId}")
    public Result<Void> deleteMessage(@PathVariable Long messageId, @PathVariable Long userId) {
        try {
            boolean success = messageService.deleteMessage(messageId, userId);
            if (success) {
                return Result.success();
            } else {
                return Result.error("删除消息失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
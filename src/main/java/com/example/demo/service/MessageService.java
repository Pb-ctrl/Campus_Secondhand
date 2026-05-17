package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.mapper.MessageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageMapper messageMapper;
    
    @Autowired
    private UserService userService;

    public List<Message> getMessagesByItemId(Long itemId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getItemId, itemId);
        wrapper.orderByDesc(Message::getCreateTime);
        return messageMapper.selectList(wrapper);
    }

    public List<Message> getMessagesByFromUserId(Long fromUserId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getFromUserId, fromUserId);
        wrapper.orderByDesc(Message::getCreateTime);
        return messageMapper.selectList(wrapper);
    }

    public List<Message> getNotificationsByUserId(Long userId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getToUserId, userId);
        wrapper.eq(Message::getMessageType, 1);
        wrapper.orderByDesc(Message::getCreateTime);
        return messageMapper.selectList(wrapper);
    }

    public List<Message> getPrivateMessagesBetweenUsers(Long userId1, Long userId2) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.and(w -> w
            .and(sub -> sub.eq(Message::getFromUserId, userId1).eq(Message::getToUserId, userId2))
            .or(sub -> sub.eq(Message::getFromUserId, userId2).eq(Message::getToUserId, userId1))
        );
        wrapper.eq(Message::getMessageType, 0);
        wrapper.orderByAsc(Message::getCreateTime);
        return messageMapper.selectList(wrapper);
    }

    public List<Map<String, Object>> getConversationsByUserId(Long userId) {
        // 获取该用户的所有私信消息
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getMessageType, 0);
        wrapper.and(w -> w
            .eq(Message::getFromUserId, userId)
            .or()
            .eq(Message::getToUserId, userId)
        );
        wrapper.orderByDesc(Message::getCreateTime);
        
        List<Message> allMessages = messageMapper.selectList(wrapper);
        
        System.out.println("查询到消息数量: " + allMessages.size());
        
        // 按对话分组（与当前用户的对话）
        Map<Long, List<Message>> conversationMap = new HashMap<>();
        
        for (Message msg : allMessages) {
            // 过滤掉 fromUserId 或 toUserId 为 null 的消息
            if (msg.getFromUserId() == null || msg.getToUserId() == null) {
                System.out.println("跳过无效消息 ID: " + msg.getId() + ", fromUserId: " + msg.getFromUserId() + ", toUserId: " + msg.getToUserId());
                continue;
            }
            
            // 确定对方用户 ID
            Long otherUserId = msg.getFromUserId().equals(userId) ? msg.getToUserId() : msg.getFromUserId();
            
            // 如果 otherUserId 为 null，跳过
            if (otherUserId == null) {
                System.out.println("跳过消息，otherUserId 为 null");
                continue;
            }
            
            conversationMap.computeIfAbsent(otherUserId, k -> new ArrayList<>()).add(msg);
        }
        
        System.out.println("分组后的对话数量: " + conversationMap.size());
        
        // 转换为对话列表
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Map.Entry<Long, List<Message>> entry : conversationMap.entrySet()) {
            Long otherUserId = entry.getKey();
            List<Message> messages = entry.getValue();
            
            if (messages.isEmpty()) {
                continue;
            }
            
            Message lastMessage = messages.get(0); // 最新消息
            
            // 获取对方用户信息
            User otherUser = userService.getUserById(otherUserId);
            String otherUserName = otherUser != null ? otherUser.getUsername() : "用户" + otherUserId;
            
            Map<String, Object> conversation = new HashMap<>();
            conversation.put("userId", otherUserId);
            conversation.put("userName", otherUserName);
            conversation.put("lastMessage", lastMessage.getContent());
            conversation.put("lastMessageTime", lastMessage.getCreateTime());
            conversation.put("unreadCount", messages.stream()
                .filter(msg -> msg.getToUserId().equals(userId) && msg.getIsRead() == 0)
                .count());
            
            result.add(conversation);
        }
        
        // 按最后消息时间排序
        result.sort((a, b) -> {
            java.time.LocalDateTime timeA = (java.time.LocalDateTime) a.get("lastMessageTime");
            java.time.LocalDateTime timeB = (java.time.LocalDateTime) b.get("lastMessageTime");
            return timeB.compareTo(timeA);
        });
        
        return result;
    }

    public boolean sendMessage(Message message) {
        // 如果是系统通知，设置 fromUserId 为 null
        if (message.getMessageType() != null && message.getMessageType() == 1) {
            message.setFromUserId(null);
        }
        message.setCreateTime(java.time.LocalDateTime.now());
        return messageMapper.insert(message) > 0;
    }

    public boolean sendSystemNotification(Long toUserId, Long itemId, String content) {
        Message message = new Message();
        message.setItemId(itemId);
        message.setToUserId(toUserId);
        message.setMessageType(1);
        message.setContent(content);
        message.setIsRead(0);
        message.setFromUserId(null);
        message.setCreateTime(java.time.LocalDateTime.now());
        return messageMapper.insert(message) > 0;
    }

    public boolean deleteMessage(Long messageId, Long userId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getId, messageId);
        wrapper.eq(Message::getToUserId, userId);
        return messageMapper.delete(wrapper) > 0;
    }

    public int getUnreadCount(Long userId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getToUserId, userId);
        wrapper.eq(Message::getMessageType, 1);
        wrapper.eq(Message::getIsRead, 0);
        return Math.toIntExact(messageMapper.selectCount(wrapper));
    }
    
    public long getChatUnreadCount(Long userId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getToUserId, userId);
        wrapper.eq(Message::getMessageType, 0);
        wrapper.eq(Message::getIsRead, 0);
        return messageMapper.selectCount(wrapper);
    }
}
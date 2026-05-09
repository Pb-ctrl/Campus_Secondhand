package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Message;
import com.example.demo.mapper.MessageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageMapper messageMapper;

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
}
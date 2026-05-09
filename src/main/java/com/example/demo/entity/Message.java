package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("message")
public class Message {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long itemId;

    private Long fromUserId;

    private Long toUserId;

    private Integer messageType;

    private String content;

    private Integer isRead;

    private LocalDateTime createTime;
}
package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String email;

    private String phone;

    private Integer role;

    private Integer status;

    // 0-待审核, 1-已审核, 2-审核拒绝
    private Integer auditStatus;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
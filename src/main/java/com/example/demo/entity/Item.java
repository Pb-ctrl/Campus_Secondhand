package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("item")
public class Item {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String title;

    private String description;

    private Integer type;

    private BigDecimal price;

    private Integer quantity;

    private String imageUrl;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    // AI 审核相关字段
    private Integer aiScore;           // AI 审核分数
    private String aiRecommendation;   // AI 建议: approve/review/reject
    private String aiWarnings;         // AI 警告信息（JSON数组）
    private String aiSuggestions;      // AI 改进建议（JSON数组）
    private String aiReason;           // AI 审核理由
    private LocalDateTime aiReviewTime; // AI 审核时间
}
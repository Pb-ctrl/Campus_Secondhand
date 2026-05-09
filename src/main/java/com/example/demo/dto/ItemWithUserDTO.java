package com.example.demo.dto;
import com.example.demo.entity.Item;
import lombok.Data;

@Data
public class ItemWithUserDTO {
    private Long id;
    private Long userId;
    private String userName;  // 发布者用户名
    private String title;
    private String description;
    private Integer type;
    private java.math.BigDecimal price;
    private Integer quantity;
    private String imageUrl;
    private Integer status;
    private java.time.LocalDateTime createTime;
    private java.time.LocalDateTime updateTime;
    
    // AI 审核相关字段
    private Integer aiScore;           // AI 审核分数
    private String aiRecommendation;   // AI 建议
    private java.time.LocalDateTime aiReviewTime; // AI 审核时间

    public static ItemWithUserDTO fromItem(Item item) {
        ItemWithUserDTO dto = new ItemWithUserDTO();
        dto.setId(item.getId());
        dto.setUserId(item.getUserId());
        dto.setTitle(item.getTitle());
        dto.setDescription(item.getDescription());
        dto.setType(item.getType());
        dto.setPrice(item.getPrice());
        dto.setQuantity(item.getQuantity());
        dto.setImageUrl(item.getImageUrl());
        dto.setStatus(item.getStatus());
        dto.setCreateTime(item.getCreateTime());
        dto.setUpdateTime(item.getUpdateTime());
        
        // 复制 AI 审核字段
        dto.setAiScore(item.getAiScore());
        dto.setAiRecommendation(item.getAiRecommendation());
        dto.setAiReviewTime(item.getAiReviewTime());
        
        return dto;
    }
}
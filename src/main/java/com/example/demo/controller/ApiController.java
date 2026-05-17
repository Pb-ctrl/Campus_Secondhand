package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.Result;
import com.example.demo.entity.Item;
import com.example.demo.entity.User;
import com.example.demo.service.AIReviewService;
import com.example.demo.service.ItemService;
import com.example.demo.service.UserService;
import com.example.demo.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Controller
public class ApiController {

    @Autowired
    private UserService userService;

    @Autowired
    private ItemService itemService;

    @Autowired
    private AIReviewService aiReviewService;

    @Autowired
    private FileUploadUtil fileUploadUtil;

    @GetMapping("/api/admin/item/list")
    @ResponseBody
    public Result<List<com.example.demo.dto.ItemWithUserDTO>> getAllItems() {
        try {
            List<Item> items = itemService.getAllItems();
            List<com.example.demo.dto.ItemWithUserDTO> result = items.stream().map(item -> {
                com.example.demo.dto.ItemWithUserDTO dto = com.example.demo.dto.ItemWithUserDTO.fromItem(item);
                // 根据 userId 查询用户名
                User user = userService.getUserById(item.getUserId());
                if (user != null) {
                    dto.setUserName(user.getUsername());
                } else {
                    dto.setUserName("未知用户");
                }
                return dto;
            }).collect(java.util.stream.Collectors.toList());
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/admin/item/approve/{id}")
    @ResponseBody
    public Result<Void> approveItem(@PathVariable Long id) {
        try {
            itemService.updateItemStatus(id, 1);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/admin/item/reject/{id}")
    @ResponseBody
    public Result<Void> rejectItem(@PathVariable Long id) {
        try {
            boolean success = itemService.updateItemStatus(id, 2);
            return success ? Result.success() : Result.error("商品下架失败");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @PostMapping("/api/user/register")
    @ResponseBody
    public Result<Void> register(@RequestBody RegisterRequest request) {
        try {
            String username = request.getUsername();
            String password = request.getPassword();
            String email = request.getEmail();
            String phone = request.getPhone();
            
            if (username == null || username.trim().isEmpty()) {
                return Result.error("用户名不能为空");
            }
            
            if (password == null || password.trim().isEmpty()) {
                return Result.error("密码不能为空");
            }
            
            if (username.length() < 3 || username.length() > 20) {
                return Result.error("用户名长度必须在3-20个字符之间");
            }
            
            if (!username.matches("^[a-zA-Z0-9_\u4e00-\u9fa5]+$")) {
                return Result.error("用户名只能包含字母、数字、下划线或中文");
            }
            
            if (password.length() < 6 || password.length() > 20) {
                return Result.error("密码长度必须在6-20个字符之间");
            }
            
            if (!password.matches("^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d]{6,20}$")) {
                return Result.error("密码必须包含字母和数字");
            }
            
            if (email != null && !email.trim().isEmpty()) {
                if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                    return Result.error("邮箱格式不正确");
                }
            }
            
            if (phone != null && !phone.trim().isEmpty()) {
                if (!phone.matches("^1[3-9]\\d{9}$")) {
                    return Result.error("手机号格式不正确");
                }
            }
            
            User user = new User();
            user.setUsername(username.trim());
            user.setPassword(password);
            user.setEmail(email != null ? email.trim() : null);
            user.setPhone(phone != null ? phone.trim() : null);
            user.setRole(request.getRole() != null ? request.getRole() : 0);
            user.setStatus(1);
            
            boolean success = userService.register(user);
            
            if (success) {
                return Result.success();
            } else {
                return Result.error("注册失败，用户名可能已存在");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    @PostMapping("/api/user/login")
    @ResponseBody
    public Result<User> login(@RequestBody LoginRequest request) {
        try {
            if (request.getUsername() == null || request.getPassword() == null) {
                return Result.error("用户名和密码不能为空");
            }
            
            User user = userService.login(request.getUsername(), request.getPassword());
            
            if (user != null) {
                if (user.getStatus() != 1) {
                    return Result.error("账号已被禁用");
                }
                user.setPassword(null);
                return Result.success(user);
            } else {
                return Result.error("用户名或密码错误");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    @PostMapping("/api/admin/login")
    @ResponseBody
    public Result<User> adminLogin(@RequestBody LoginRequest request) {
        try {
            if (request.getUsername() == null || request.getPassword() == null) {
                return Result.error("用户名和密码不能为空");
            }
            
            User user = userService.login(request.getUsername(), request.getPassword());
            
            if (user != null) {
                if (user.getRole() == null || user.getRole() != 1) {
                    return Result.error("权限不足，非管理员账号");
                }
                
                if (user.getStatus() != 1) {
                    return Result.error("账号已被禁用");
                }
                
                user.setPassword(null);
                return Result.success(user);
            } else {
                return Result.error("用户名或密码错误");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    @GetMapping("/api/user/{id}")
    @ResponseBody
    public Result<User> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            if (user != null) {
                user.setPassword(null);
                return Result.success(user);
            } else {
                return Result.error("用户不存在");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/user/update/{userId}")
    @ResponseBody
    public Result<Void> updateUser(@PathVariable Long userId, @RequestBody User user) {
        try {
            User existingUser = userService.getUserById(userId);
            if (existingUser == null) {
                return Result.error("用户不存在");
            }
            
            existingUser.setUsername(user.getUsername());
            existingUser.setEmail(user.getEmail());
            existingUser.setPhone(user.getPhone());
            existingUser.setRole(user.getRole());
            
            boolean success = userService.updateUser(existingUser);
            if (success) {
                return Result.success();
            } else {
                return Result.error("更新用户失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/admin/user/audit/{userId}")
    @ResponseBody
    public Result<Void> auditUser(@PathVariable Long userId, @RequestParam Integer auditStatus) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return Result.error("用户不存在");
            }
            
            if (auditStatus != 1 && auditStatus != 2) {
                return Result.error("审核状态参数错误");
            }
            
            boolean success = userService.updateAuditStatus(userId, auditStatus);
            if (success) {
                return Result.success();
            } else {
                return Result.error("审核操作失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // ========== AI 审核相关接口 ==========

    @GetMapping("/api/admin/ai/review/{id}")
    @ResponseBody
    public Result<Map<String, Object>> aiReviewItem(@PathVariable Long id) {
        try {
            Item item = itemService.getItemById(id);
            if (item == null) {
                return Result.error("商品不存在");
            }
            
            Map<String, Object> reviewResult = aiReviewService.reviewItem(item);
            return Result.success(reviewResult);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/api/admin/ai/batch-review")
    @ResponseBody
    public Result<Map<String, Object>> aiBatchReview(@RequestBody List<Long> itemIds) {
        try {
            List<Item> items = itemIds.stream()
                .map(itemService::getItemById)
                .filter(item -> item != null)
                .toList();
            
            Map<String, Object> reviewResults = aiReviewService.batchReview(items);
            return Result.success(reviewResults);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/api/item/audited")
    @ResponseBody
    public Result<List<Item>> getAuditedItems(@RequestParam(value = "currentUserId", required = false) Long currentUserId) {
        try {
            List<Item> items = itemService.getAuditedItems();
            
            // 如果提供了当前用户ID，需要额外返回该用户的下架商品
            if (currentUserId != null) {
                List<Item> userItems = itemService.getItemsByUserId(currentUserId);
                
                // 将用户的下架商品添加到列表中（如果还没有的话）
                for (Item userItem : userItems) {
                    if (userItem.getStatus() == 2) { // 下架商品
                        boolean exists = items.stream().anyMatch(item -> item.getId().equals(userItem.getId()));
                        if (!exists) {
                            items.add(userItem);
                        }
                    }
                }
            }
            
            return Result.success(items);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    @GetMapping("/api/item/{id}")
    @ResponseBody
    public Result<Item> getItemById(@PathVariable Long id, @RequestParam(value = "currentUserId", required = false) Long currentUserId) {
        try {
            Item item = itemService.getItemById(id);
            if (item != null) {
                // 如果商品已下架，检查是否是商品所有者或管理员
                if (item.getStatus() == 2) {
                    if (currentUserId == null) {
                        return Result.error("商品已下架");
                    }
                    
                    // 检查当前用户是否是商品所有者
                    if (!item.getUserId().equals(currentUserId)) {
                        // 检查是否是管理员（需要查询用户信息）
                        User currentUser = userService.getUserById(currentUserId);
                        if (currentUser == null || currentUser.getRole() != 1) {
                            return Result.error("商品已下架");
                        }
                    }
                }
                return Result.success(item);
            } else {
                return Result.error("商品不存在");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    @GetMapping("/api/item/user/{userId}")
    @ResponseBody
    public Result<List<Item>> getItemsByUserId(@PathVariable Long userId) {
        try {
            List<Item> items = itemService.getItemsByUserId(userId);
            return Result.success(items);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/api/item/add")
    @ResponseBody
    public Result<Void> addItem(@RequestBody Item item) {
        try {
            if (item.getUserId() == null || item.getTitle() == null) {
                return Result.error("必填字段不能为空");
            }
            
            item.setType(item.getType() != null ? item.getType() : 1);
            item.setStatus(0);
            
            boolean success = itemService.addItem(item);
            if (success) {
                return Result.success();
            } else {
                return Result.error("添加商品失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/api/item/addWithImage")
    @ResponseBody
    public Result<Void> addItemWithImage(
            @RequestParam("userId") Long userId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "quantity", required = false) Integer quantity,
            @RequestParam(value = "type", required = false) Integer type,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            if (userId == null || title == null || title.trim().isEmpty()) {
                return Result.error("必填字段不能为空");
            }

            String imageUrl = null;
            if (image != null && !image.isEmpty()) {
                try {
                    imageUrl = fileUploadUtil.uploadFile(image);
                } catch (IOException e) {
                    return Result.error("图片上传失败：" + e.getMessage());
                }
            }

            Item item = new Item();
            item.setUserId(userId);
            item.setTitle(title.trim());
            item.setDescription(description);
            item.setPrice(price != null ? new java.math.BigDecimal(price) : java.math.BigDecimal.ZERO);
            item.setQuantity(quantity != null ? quantity : 1);
            item.setType(type != null ? type : 1);
            item.setImageUrl(imageUrl);
            item.setStatus(0); // 默认待审核

            boolean success = itemService.addItem(item);
            if (success) {
                // 商品添加成功后，立即触发 AI 审核
                System.out.println("✓ 商品ID: " + item.getId() + " 发布成功，开始自动 AI 审核...");
                
                try {
                    // 使用异步方式执行 AI 审核，不阻塞用户请求
                    new Thread(() -> {
                        try {
                            // 获取刚添加的商品（确保有 ID）
                            Item savedItem = itemService.getItemById(item.getId());
                            if (savedItem != null) {
                                System.out.println("正在对商品ID: " + savedItem.getId() + " 进行 AI 审核...");
                                
                                // 调用 AI 审核服务
                                Map<String, Object> reviewResult = aiReviewService.reviewItem(savedItem);
                                
                                int score = (int) reviewResult.getOrDefault("score", 0);
                                Boolean autoApproved = (Boolean) reviewResult.getOrDefault("autoApproved", false);
                                String recommendation = (String) reviewResult.get("recommendation");
                                
                                System.out.println("商品ID: " + savedItem.getId() + " AI 审核完成 - 分数: " + score + ", 建议: " + recommendation + ", 自动通过: " + autoApproved);
                                
                                if (autoApproved) {
                                    System.out.println("✓ 商品ID: " + savedItem.getId() + " 已自动通过审核，状态变更为: 已通过");
                                } else {
                                    System.out.println("○ 商品ID: " + savedItem.getId() + " 需要人工审核，保持待审核状态");
                                }
                            } else {
                                System.err.println("✗ 无法获取刚添加的商品，ID: " + item.getId());
                            }
                        } catch (Exception e) {
                            System.err.println("✗ AI 自动审核失败: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }).start();
                    
                    System.out.println("AI 审核任务已提交到后台执行，商品ID: " + item.getId());
                } catch (Exception e) {
                    // AI 审核失败不影响商品发布，只记录日志
                    System.err.println("提交 AI 审核任务失败: " + e.getMessage());
                }
                
                return Result.success();
            } else {
                return Result.error("添加商品失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/item/update/{itemId}")
    @ResponseBody
    public Result<Void> updateItem(@PathVariable Long itemId, @RequestBody Item item) {
        try {
            Item existingItem = itemService.getItemById(itemId);
            if (existingItem == null) {
                return Result.error("商品不存在");
            }
            
            existingItem.setTitle(item.getTitle());
            existingItem.setDescription(item.getDescription());
            existingItem.setPrice(item.getPrice());
            existingItem.setType(item.getType());
            existingItem.setQuantity(item.getQuantity());
            existingItem.setImageUrl(item.getImageUrl());
            
            boolean success = itemService.updateItem(existingItem);
            if (success) {
                return Result.success();
            } else {
                return Result.error("更新商品失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/item/updateWithImage/{itemId}")
    @ResponseBody
    public Result<Void> updateItemWithImage(
            @PathVariable Long itemId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "quantity", required = false) Integer quantity,
            @RequestParam(value = "type", required = false) Integer type,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            Item existingItem = itemService.getItemById(itemId);
            if (existingItem == null) {
                return Result.error("商品不存在");
            }

            String imageUrl = existingItem.getImageUrl();
            if (image != null && !image.isEmpty()) {
                try {
                    imageUrl = fileUploadUtil.uploadFile(image);
                } catch (IOException e) {
                    return Result.error("图片上传失败：" + e.getMessage());
                }
            }

            existingItem.setTitle(title.trim());
            existingItem.setDescription(description);
            existingItem.setPrice(price != null ? new java.math.BigDecimal(price) : java.math.BigDecimal.ZERO);
            existingItem.setQuantity(quantity != null ? quantity : 1);
            existingItem.setType(type != null ? type : 1);
            existingItem.setImageUrl(imageUrl);

            boolean success = itemService.updateItem(existingItem);
            if (success) {
                return Result.success();
            } else {
                return Result.error("更新商品失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/item/offshelf/{itemId}")
    @ResponseBody
    public Result<Void> offshelfItem(@PathVariable Long itemId) {
        try {
            Item item = itemService.getItemById(itemId);
            if (item == null) {
                return Result.error("商品不存在");
            }
            
            boolean success = itemService.updateItemStatus(itemId, 2);
            if (success) {
                return Result.success();
            } else {
                return Result.error("下架失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/item/restore/{itemId}")
    @ResponseBody
    public Result<Void> restoreItem(@PathVariable Long itemId) {
        try {
            Item item = itemService.getItemById(itemId);
            if (item == null) {
                return Result.error("商品不存在");
            }
            
            if (item.getAiScore() != null && item.getAiScore() < 50) {
                return Result.error("该商品因严重违规被AI自动拒绝，无法重新上架。请修改商品信息后重新发布");
            }
            
            boolean success = itemService.updateItemStatus(itemId, 1);
            if (success) {
                return Result.success();
            } else {
                return Result.error("恢复失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/api/item/delete/{itemId}")
    @ResponseBody
    public Result<Void> deleteItem(@PathVariable Long itemId) {
        try {
            Item item = itemService.getItemById(itemId);
            if (item == null) {
                return Result.error("商品不存在");
            }
            
            boolean success = itemService.deleteItem(itemId);
            if (success) {
                return Result.success();
            } else {
                return Result.error("删除失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/item/status/{itemId}")
    @ResponseBody
    public Result<Void> updateItemStatus(@PathVariable Long itemId, @RequestParam Integer status) {
        try {
            boolean success = itemService.updateItemStatus(itemId, status);
            if (success) {
                return Result.success();
            } else {
                return Result.error("操作失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
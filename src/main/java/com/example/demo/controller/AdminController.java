package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.Result;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/admin")
    public String adminPage() {
        return "admin";
    }

    @PostMapping("/api/admin/checkAuth")
    @ResponseBody
    public Result<User> checkAdminAuth(@RequestBody LoginRequest request) {
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

    @GetMapping("/api/admin/user/list")
    @ResponseBody
    public Result<List<User>> getAllUsers() {
        try {
            // 这里需要在UserService中添加获取所有用户的方法
            List<User> users = userService.getAllUsers();
            // 清除密码信息
            for (User user : users) {
                user.setPassword(null);
            }
            return Result.success(users);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/api/admin/user/status/{userId}")
    @ResponseBody
    public Result<Void> updateUserStatus(@PathVariable Long userId, @RequestParam Integer status) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return Result.error("用户不存在");
            }
            
            user.setStatus(status);
            boolean success = userService.updateUser(user);
            if (success) {
                return Result.success();
            } else {
                return Result.error("更新用户状态失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

}

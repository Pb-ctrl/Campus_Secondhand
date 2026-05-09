package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Transactional
    public boolean register(User user) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, user.getUsername());
        if (userMapper.selectCount(wrapper) > 0) {
            throw new RuntimeException("用户名已存在");
        }

        user.setStatus(1);
        user.setRole(user.getRole() != null ? user.getRole() : 0);
        user.setAuditStatus(1); // 注册用户默认已审核
        user.setCreateTime(java.time.LocalDateTime.now());
        user.setUpdateTime(java.time.LocalDateTime.now());

        return userMapper.insert(user) > 0;
    }
    
    public User login(String username, String password) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        wrapper.eq(User::getPassword, password);
        wrapper.eq(User::getStatus, 1);
        wrapper.eq(User::getAuditStatus, 1); // 只有审核通过的用户才能登录
        return userMapper.selectOne(wrapper);
    }
    
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }

    @Transactional
    public boolean updateUser(User user) {
        user.setUpdateTime(java.time.LocalDateTime.now());
        user.setAuditStatus(0); // 用户编辑后设置为待审核状态
        return userMapper.updateById(user) > 0;
    }

    public boolean updateAuditStatus(Long id, Integer auditStatus) {
        User user = new User();
        user.setId(id);
        user.setAuditStatus(auditStatus);
        user.setUpdateTime(java.time.LocalDateTime.now());
        return userMapper.updateById(user) > 0;
    }

    public List<User> getAllUsers() {
        return userMapper.selectList(new LambdaQueryWrapper<>());
    }
}
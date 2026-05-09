package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Favorite;
import com.example.demo.entity.Item;
import com.example.demo.entity.User;
import com.example.demo.mapper.FavoriteMapper;
import com.example.demo.mapper.ItemMapper;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteService {

    @Autowired
    private FavoriteMapper favoriteMapper;

    @Autowired
    private ItemMapper itemMapper;

    @Autowired
    private UserMapper userMapper;

    public boolean addFavorite(Long userId, Long itemId) {
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId);
        wrapper.eq(Favorite::getItemId, itemId);

        if (favoriteMapper.selectCount(wrapper) > 0) {
            return false;
        }

        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setItemId(itemId);
        favorite.setCreateTime(LocalDateTime.now());

        return favoriteMapper.insert(favorite) > 0;
    }

    public boolean removeFavorite(Long userId, Long itemId) {
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId);
        wrapper.eq(Favorite::getItemId, itemId);

        return favoriteMapper.delete(wrapper) > 0;
    }

    public List<Item> getFavoriteItems(Long userId) {
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId);
        wrapper.orderByDesc(Favorite::getCreateTime);

        List<Favorite> favorites = favoriteMapper.selectList(wrapper);
        List<Long> itemIds = favorites.stream()
                .map(Favorite::getItemId)
                .collect(Collectors.toList());

        if (itemIds.isEmpty()) {
            return List.of();
        }

        List<Item> allItems = itemMapper.selectBatchIds(itemIds);
        
        // 获取当前用户信息，判断是否是管理员
        User currentUser = userMapper.selectById(userId);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null && currentUser.getRole() == 1;
        
        // 过滤商品：只显示在售商品、用户自己的商品、或管理员可见的商品
        List<Item> filteredItems = new ArrayList<>();
        for (Item item : allItems) {
            if (item.getStatus() == 1) {
                // 在售商品，所有人都可见
                filteredItems.add(item);
            } else if (item.getStatus() == 2) {
                // 下架商品，只有所有者或管理员可见
                if (item.getUserId().equals(userId) || isAdmin) {
                    filteredItems.add(item);
                }
            } else {
                // 待审核商品，只有所有者或管理员可见
                if (item.getUserId().equals(userId) || isAdmin) {
                    filteredItems.add(item);
                }
            }
        }
        
        return filteredItems;
    }

    public boolean isFavorited(Long userId, Long itemId) {
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId);
        wrapper.eq(Favorite::getItemId, itemId);

        return favoriteMapper.selectCount(wrapper) > 0;
    }

    public int getFavoriteCount(Long userId) {
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId);

        return Math.toIntExact(favoriteMapper.selectCount(wrapper));
    }
}
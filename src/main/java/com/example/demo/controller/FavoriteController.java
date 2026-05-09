package com.example.demo.controller;

import com.example.demo.dto.Result;
import com.example.demo.entity.Item;
import com.example.demo.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorite")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @PostMapping("/add")
    public Result<Void> addFavorite(@RequestParam Long userId, @RequestParam Long itemId) {
        try {
            if (userId == null || itemId == null) {
                return Result.error("参数不能为空");
            }

            boolean success = favoriteService.addFavorite(userId, itemId);
            if (success) {
                return Result.success();
            } else {
                return Result.error("已经收藏过该商品");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/remove")
    public Result<Void> removeFavorite(@RequestParam Long userId, @RequestParam Long itemId) {
        try {
            if (userId == null || itemId == null) {
                return Result.error("参数不能为空");
            }

            boolean success = favoriteService.removeFavorite(userId, itemId);
            if (success) {
                return Result.success();
            } else {
                return Result.error("取消收藏失败");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/list/{userId}")
    public Result<List<Item>> getFavoriteItems(@PathVariable Long userId) {
        try {
            List<Item> items = favoriteService.getFavoriteItems(userId);
            return Result.success(items);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/check")
    public Result<Boolean> checkFavorite(@RequestParam Long userId, @RequestParam Long itemId) {
        try {
            boolean favorited = favoriteService.isFavorited(userId, itemId);
            return Result.success(favorited);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/count/{userId}")
    public Result<Integer> getFavoriteCount(@PathVariable Long userId) {
        try {
            int count = favoriteService.getFavoriteCount(userId);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
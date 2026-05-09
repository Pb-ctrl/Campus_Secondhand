package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Item;
import com.example.demo.mapper.ItemMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemService {

    @Autowired
    private ItemMapper itemMapper;

    public List<Item> getAuditedItems() {
        LambdaQueryWrapper<Item> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Item::getStatus, 1);
        wrapper.orderByDesc(Item::getCreateTime);
        return itemMapper.selectList(wrapper);
    }

    public Item getItemById(Long id) {
        return itemMapper.selectById(id);
    }

    public List<Item> getItemsByUserId(Long userId) {
        LambdaQueryWrapper<Item> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Item::getUserId, userId);
        wrapper.orderByDesc(Item::getCreateTime);
        return itemMapper.selectList(wrapper);
    }

    public boolean addItem(Item item) {
        item.setStatus(0);
        item.setCreateTime(java.time.LocalDateTime.now());
        return itemMapper.insert(item) > 0;
    }
    
    public boolean updateItem(Item item) {
        item.setUpdateTime(java.time.LocalDateTime.now());
        item.setStatus(0); // 编辑后设置为待审核状态
        return itemMapper.updateById(item) > 0;
    }
    
    // 获取所有商品（用于后台管理）
    public List<Item> getAllItems() {
        LambdaQueryWrapper<Item> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Item::getCreateTime);
        return itemMapper.selectList(wrapper);
    }

    // 更新商品状态（0-待审核 1-已通过 2-已下架）
    public boolean updateItemStatus(Long id, Integer status) {
        Item item = new Item();
        item.setId(id);
        item.setStatus(status);
        item.setUpdateTime(java.time.LocalDateTime.now());
        return itemMapper.updateById(item) > 0;
    }

    // 删除商品
    public boolean deleteItem(Long id) {
        return itemMapper.deleteById(id) > 0;
    }
}
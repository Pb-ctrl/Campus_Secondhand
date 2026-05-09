package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private AdminAuthInterceptor adminAuthInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册管理员权限拦截器
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/admin/**")  // 只拦截后台管理接口
                .excludePathPatterns(
                        "/api/admin/login",        // 排除登录接口
                        "/api/admin/checkAuth"     // 排除权限检查接口
                );
        
        // 注意：/api/item/** 等商品接口不需要管理员验证
        // 如果需要验证，应该单独配置
    }
}
package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CVReviewConfig {

    @Value("${cv.api.provider:aliyun}")
    private String provider;

    @Value("${cv.api.key:}")
    private String apiKey;

    @Value("${cv.api.secret:}")
    private String apiSecret;

    @Value("${cv.api.url:https://viapi.cn-shanghai.aliyuncs.com}")
    private String apiUrl;

    @Value("${cv.api.enabled:false}")
    private boolean enabled;

    public String getProvider() {
        return provider;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public boolean isEnabled() {
        return enabled;
    }
}

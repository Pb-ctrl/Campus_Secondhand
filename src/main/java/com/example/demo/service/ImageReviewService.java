package com.example.demo.service;

import com.example.demo.config.CVReviewConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.ContentType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class ImageReviewService {

    @Autowired
    private CVReviewConfig cvReviewConfig;

    @Autowired
    private ObjectMapper objectMapper;

    private static final int IMAGE_SAFE_SCORE = 90;
    private static final int IMAGE_WARNING_SCORE = 60;

    public Map<String, Object> reviewImage(String imageUrl) {
        Map<String, Object> result = new HashMap<>();

        if (!cvReviewConfig.isEnabled()) {
            System.out.println("⚠️ CV图像审核服务未启用");
            result.put("score", 100);
            result.put("safe", true);
            result.put("message", "图像审核服务未启用，默认通过");
            result.put("enabled", false);
            return result;
        }

        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            result.put("score", 100);
            result.put("safe", true);
            result.put("message", "无图片，默认通过");
            result.put("categories", new ArrayList<>());
            result.put("details", new HashMap<>());
            return result;
        }

        try {
            System.out.println("🔍 开始图像审核，URL: " + imageUrl);

            Map<String, Object> reviewResult = callCVAPI(imageUrl);

            int score = (int) reviewResult.getOrDefault("score", 100);
            Boolean safeObj = (Boolean) reviewResult.getOrDefault("safe", true);
            boolean safe = safeObj != null ? safeObj : true;

            result.put("score", score);
            result.put("safe", safe);
            result.put("categories", reviewResult.getOrDefault("categories", new ArrayList<>()));
            result.put("details", reviewResult.getOrDefault("details", new HashMap<>()));
            result.put("message", reviewResult.getOrDefault("message", ""));
            result.put("enabled", true);

            System.out.println("✓ 图像审核完成 - 分数: " + score + ", 安全: " + safe);

            return result;
        } catch (Exception e) {
            System.err.println("✗ 图像审核失败: " + e.getMessage());
            e.printStackTrace();

            result.put("score", 50);
            result.put("safe", false);
            result.put("message", "图像审核服务异常: " + e.getMessage());
            result.put("categories", new ArrayList<>());
            result.put("details", new HashMap<>());
            result.put("enabled", true);

            return result;
        }
    }

    private Map<String, Object> callCVAPI(String imageUrl) throws Exception {
        String provider = cvReviewConfig.getProvider();
        // 在 callAliyunCV 和 callTencentCV 方法开头添加参数校验
        if (cvReviewConfig.getApiKey() == null || cvReviewConfig.getApiKey().trim().isEmpty()) {
            throw new RuntimeException("CV API Key 未配置");
        }

        if (imageUrl == null || !imageUrl.startsWith("http")) {
            throw new RuntimeException("无效的图片URL: " + imageUrl);
        }

        if ("aliyun".equalsIgnoreCase(provider)) {
            return callAliyunCV(imageUrl);
        } else if ("tencent".equalsIgnoreCase(provider)) {
            return callTencentCV(imageUrl);
        } else {
            throw new RuntimeException("不支持的CV服务提供商: " + provider);
        }
    }

    private Map<String, Object> callAliyunCV(String imageUrl) throws Exception {
        Map<String, Object> result = new HashMap<>();

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            String apiUrl = cvReviewConfig.getApiUrl();
            String endpoint = apiUrl.endsWith("/") ? apiUrl + "green/image/scan" : apiUrl + "/green/image/scan";
            HttpPost httpPost = new HttpPost(endpoint);

            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Authorization", "Bearer " + cvReviewConfig.getApiKey());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("scenes", Arrays.asList("porn", "terrorism", "ad", "qrcode", "live"));
            requestBody.put("url", imageUrl);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            httpPost.setEntity(new StringEntity(jsonBody, ContentType.APPLICATION_JSON));

            System.out.println("调用阿里云CV API...");

            return httpClient.execute(httpPost, response -> {
                try {
                    int statusCode = response.getCode();
                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(response.getEntity().getContent(), StandardCharsets.UTF_8)
                    );

                    StringBuilder responseBuilder = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        responseBuilder.append(line);
                    }

                    if (statusCode != 200) {
                        throw new RuntimeException("CV API调用失败，状态码: " + statusCode + ", 响应: " + responseBuilder.toString());
                    }

                    return parseAliyunResponse(responseBuilder.toString());
                } catch (Exception e) {
                    throw new RuntimeException("处理阿里云CV响应失败: " + e.getMessage(), e);
                }
            });
        }
    }

    private Map<String, Object> parseAliyunResponse(String response) throws Exception {
        Map<String, Object> result = new HashMap<>();
        JsonNode rootNode = objectMapper.readTree(response);

        int totalScore = 100;
        List<String> categories = new ArrayList<>();
        Map<String, Object> details = new HashMap<>();

        JsonNode dataNode = rootNode.get("Data");
        if (dataNode != null && dataNode.isArray()) {
            for (JsonNode sceneNode : dataNode) {
                String scene = sceneNode.get("Scene").asText();
                String suggestion = sceneNode.get("Suggestion").asText();
                double rate = sceneNode.has("Rate") ? sceneNode.get("Rate").asDouble() : 0.0;

                Map<String, Object> sceneDetail = new HashMap<>();
                sceneDetail.put("suggestion", suggestion);
                sceneDetail.put("rate", rate);
                details.put(scene, sceneDetail);

                if ("block".equals(suggestion)) {
                    totalScore -= 40;
                    categories.add(scene + "(违规)");
                } else if ("review".equals(suggestion)) {
                    totalScore -= 20;
                    categories.add(scene + "(需审核)");
                }
            }
        }

        totalScore = Math.max(0, totalScore);

        result.put("score", totalScore);
        result.put("safe", totalScore >= IMAGE_WARNING_SCORE);
        result.put("categories", categories);
        result.put("details", details);
        result.put("message", buildMessage(totalScore, categories));

        return result;
    }

    private Map<String, Object> callTencentCV(String imageUrl) throws Exception {
        Map<String, Object> result = new HashMap<>();

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            String apiUrl = cvReviewConfig.getApiUrl();
            String endpoint = apiUrl.endsWith("/") ? apiUrl + "image/moderation" : apiUrl + "/image/moderation";
            HttpPost httpPost = new HttpPost(endpoint);

            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Authorization", "Bearer " + cvReviewConfig.getApiKey());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("ImageUrl", imageUrl);
            requestBody.put("Scenes", Arrays.asList("PORN", "TERRORISM", "POLITICS"));

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            httpPost.setEntity(new StringEntity(jsonBody, ContentType.APPLICATION_JSON));

            System.out.println("调用腾讯云CV API...");

            return httpClient.execute(httpPost, response -> {
                try {
                    int statusCode = response.getCode();
                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(response.getEntity().getContent(), StandardCharsets.UTF_8)
                    );

                    StringBuilder responseBuilder = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        responseBuilder.append(line);
                    }

                    if (statusCode != 200) {
                        throw new RuntimeException("CV API调用失败，状态码: " + statusCode);
                    }

                    return parseTencentResponse(responseBuilder.toString());
                } catch (Exception e) {
                    throw new RuntimeException("处理腾讯云CV响应失败: " + e.getMessage(), e);
                }
            });
        }
    }

    private Map<String, Object> parseTencentResponse(String response) throws Exception {
        Map<String, Object> result = new HashMap<>();
        JsonNode rootNode = objectMapper.readTree(response);

        int totalScore = 100;
        List<String> categories = new ArrayList<>();
        Map<String, Object> details = new HashMap<>();

        JsonNode resultsNode = rootNode.get("Results");
        if (resultsNode != null && resultsNode.isArray()) {
            for (JsonNode itemNode : resultsNode) {
                String scene = itemNode.get("Scene").asText();
                String suggestion = itemNode.get("Suggestion").asText();
                double confidence = itemNode.has("Confidence") ? itemNode.get("Confidence").asDouble() : 0.0;

                Map<String, Object> sceneDetail = new HashMap<>();
                sceneDetail.put("suggestion", suggestion);
                sceneDetail.put("confidence", confidence);
                details.put(scene, sceneDetail);

                if ("Block".equals(suggestion)) {
                    totalScore -= 40;
                    categories.add(scene + "(违规)");
                } else if ("Review".equals(suggestion)) {
                    totalScore -= 20;
                    categories.add(scene + "(需审核)");
                }
            }
        }

        totalScore = Math.max(0, totalScore);

        result.put("score", totalScore);
        result.put("safe", totalScore >= IMAGE_WARNING_SCORE);
        result.put("categories", categories);
        result.put("details", details);
        result.put("message", buildMessage(totalScore, categories));

        return result;
    }

    private String buildMessage(int score, List<String> categories) {
        if (score >= IMAGE_SAFE_SCORE) {
            return "图像内容安全";
        } else if (score >= IMAGE_WARNING_SCORE) {
            return "图像存在风险: " + String.join(", ", categories);
        } else {
            return "图像违规: " + String.join(", ", categories);
        }
    }
}

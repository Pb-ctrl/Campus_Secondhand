
package com.example.demo.service;

import com.example.demo.config.DeepSeekConfig;
import com.example.demo.entity.Item;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AIReviewService {

    @Autowired
    private DeepSeekConfig deepSeekConfig;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ItemService itemService;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final int AUTO_APPROVE_SCORE = 80;

    public Map<String, Object> reviewItem(Item item) {
        Map<String, Object> result = new HashMap<>();

        if (item == null) {
            result.put("score", 0);
            result.put("suggestions", List.of("商品信息为空"));
            result.put("warnings", List.of("商品信息为空"));
            result.put("recommendation", "reject");
            return result;
        }

        // 检查是否已经有 AI 审核结果（缓存）
        if (item.getAiScore() != null && item.getAiReviewTime() != null) {
            System.out.println("✓ 商品ID: " + item.getId() + " 使用缓存的 AI 审核结果");
            
            result.put("score", item.getAiScore());
            result.put("recommendation", item.getAiRecommendation() != null ? item.getAiRecommendation() : "review");
            result.put("reason", item.getAiReason() != null ? item.getAiReason() : "");
            result.put("cached", true);  // 标记为缓存结果
            result.put("aiReviewTime", item.getAiReviewTime());
            
            // 解析 warnings 和 suggestions
            try {
                if (item.getAiWarnings() != null) {
                    List<String> warnings = objectMapper.readValue(
                        item.getAiWarnings(), 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
                    );
                    result.put("warnings", warnings);
                } else {
                    result.put("warnings", new ArrayList<>());
                }
                
                if (item.getAiSuggestions() != null) {
                    List<String> suggestions = objectMapper.readValue(
                        item.getAiSuggestions(), 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
                    );
                    result.put("suggestions", suggestions);
                } else {
                    result.put("suggestions", new ArrayList<>());
                }
            } catch (Exception e) {
                result.put("warnings", new ArrayList<>());
                result.put("suggestions", new ArrayList<>());
            }
            
            // 如果分数 >= 80 且状态还是待审核，说明之前已经自动通过了
            if (item.getAiScore() >= AUTO_APPROVE_SCORE && item.getStatus() == 0) {
                boolean approved = itemService.updateItemStatus(item.getId(), 1);
                if (approved) {
                    result.put("autoApproved", true);
                    result.put("message", "分数 >= 80，已自动通过审核");
                }
            } else {
                result.put("autoApproved", false);
            }
            
            return result;
        }

        // 没有缓存，调用 AI API
        System.out.println("○ 商品ID: " + item.getId() + " 调用 AI API 进行审核");
        
        try {
            String prompt = buildReviewPrompt(item);
            String aiResponse = callDeepSeekAPI(prompt);

            Map<String, Object> reviewResult = parseAIResponse(aiResponse);
            
            // 保存 AI 审核结果到数据库
            saveAIReviewResult(item, reviewResult);
            
            // 如果分数 >= 80，自动通过
            int score = (int) reviewResult.getOrDefault("score", 0);
            System.out.println("商品ID: " + item.getId() + ", AI评分: " + score + ", 自动通过阈值: " + AUTO_APPROVE_SCORE);
            
            if (score >= AUTO_APPROVE_SCORE) {
                System.out.println("✓ 商品ID: " + item.getId() + " 分数 >= 80，尝试自动通过...");
                boolean approved = itemService.updateItemStatus(item.getId(), 1);
                if (approved) {
                    reviewResult.put("autoApproved", true);
                    reviewResult.put("message", "分数 >= 80，已自动通过审核");
                    System.out.println("✓ 商品ID: " + item.getId() + " 自动通过成功");
                } else {
                    reviewResult.put("autoApproved", false);
                    reviewResult.put("message", "自动通过失败，请手动审核");
                    System.err.println("✗ 商品ID: " + item.getId() + " 自动通过失败");
                }
            } else {
                reviewResult.put("autoApproved", false);
                System.out.println("○ 商品ID: " + item.getId() + " 分数 < 80，需要人工审核");
            }
            
            reviewResult.put("cached", false);  // 标记为新审核结果
            
            return reviewResult;
        } catch (Exception e) {
            e.printStackTrace();
            result.put("score", 50);
            result.put("suggestions", List.of("AI 审核服务暂时不可用，请人工审核"));
            result.put("warnings", List.of("AI 审核失败: " + e.getMessage()));
            result.put("recommendation", "review");
            result.put("cached", false);
            return result;
        }
    }

    /**
     * 保存 AI 审核结果到数据库
     */
    private void saveAIReviewResult(Item item, Map<String, Object> reviewResult) {
        try {
            Item updateItem = new Item();
            updateItem.setId(item.getId());
            
            // 保存审核分数
            if (reviewResult.containsKey("score")) {
                updateItem.setAiScore((int) reviewResult.get("score"));
            }
            
            // 保存审核建议
            if (reviewResult.containsKey("recommendation")) {
                updateItem.setAiRecommendation((String) reviewResult.get("recommendation"));
            }
            
            // 保存审核理由
            if (reviewResult.containsKey("reason")) {
                updateItem.setAiReason((String) reviewResult.get("reason"));
            }
            
            // 保存警告信息（转为 JSON 字符串）
            if (reviewResult.containsKey("warnings")) {
                List<String> warnings = (List<String>) reviewResult.get("warnings");
                updateItem.setAiWarnings(objectMapper.writeValueAsString(warnings));
            }
            
            // 保存改进建议（转为 JSON 字符串）
            if (reviewResult.containsKey("suggestions")) {
                List<String> suggestions = (List<String>) reviewResult.get("suggestions");
                updateItem.setAiSuggestions(objectMapper.writeValueAsString(suggestions));
            }
            
            // 保存审核时间
            updateItem.setAiReviewTime(java.time.LocalDateTime.now());
            
            // 更新到数据库
            itemService.updateItem(updateItem);
            
            System.out.println("✓ 商品ID: " + item.getId() + " AI 审核结果已保存到数据库");
        } catch (Exception e) {
            System.err.println("✗ 保存 AI 审核结果失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildReviewPrompt(Item item) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一个专业的二手交易平台审核员，请对以下商品进行审核评估。\n\n");
        prompt.append("【商品信息】\n");
        prompt.append("标题：").append(item.getTitle()).append("\n");
        prompt.append("描述：").append(item.getDescription() != null ? item.getDescription() : "无").append("\n");
        prompt.append("价格：").append(item.getPrice() != null ? item.getPrice() + "元" : "未设置").append("\n");
        prompt.append("分类：").append(getCategoryName(item.getType())).append("\n\n");

        prompt.append("【审核标准】\n");
        prompt.append("1. 内容合规性：是否包含违法、违禁、色情、暴力、诈骗等敏感内容\n");
        prompt.append("2. 标题规范性：标题是否简洁明了（5-50字），是否准确描述商品\n");
        prompt.append("3. 描述完整性：描述是否详细清楚（20-500字），是否包含商品关键信息\n");
        prompt.append("4. 价格合理性：价格是否在合理范围内（0-99999元）\n");
        prompt.append("5. 信息真实性：是否存在明显虚假信息或误导内容\n\n");

        prompt.append("【输出格式】\n");
        prompt.append("请严格按照以下JSON格式返回审核结果：\n");
        prompt.append("{\n");
        prompt.append("  \"score\": 0-100的整数评分,\n");
        prompt.append("  \"recommendation\": \"approve\"或\"review\"或\"reject\",\n");
        prompt.append("  \"warnings\": [\"警告列表，如有\"],\n");
        prompt.append("  \"suggestions\": [\"改进建议列表\"],\n");
        prompt.append("  \"reason\": \"审核理由简述\"\n");
        prompt.append("}\n\n");

        prompt.append("注意：\n");
        prompt.append("- score >= 80 推荐 approve（通过）\n");
        prompt.append("- score 50-79 推荐 review（需要人工复审）\n");
        prompt.append("- score < 50 推荐 reject（拒绝）\n");
        prompt.append("- 只返回JSON，不要其他内容");

        return prompt.toString();
    }

    private String getCategoryName(Integer type) {
        if (type == null) return "未知";
        return switch (type) {
            case 1 -> "普通商品";
            case 2 -> "二手教材";
            case 3 -> "数码外设";
            case 4 -> "寻物启事";
            default -> "其他";
        };
    }

    private String callDeepSeekAPI(String prompt) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", deepSeekConfig.getModel());

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);

            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1000);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(deepSeekConfig.getApiKey());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    deepSeekConfig.getApiUrl(),
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("API 调用失败，状态码: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("调用 DeepSeek API 失败: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> parseAIResponse(String aiResponse) {
        Map<String, Object> result = new HashMap<>();

        try {
            JsonNode rootNode = objectMapper.readTree(aiResponse);
            JsonNode choices = rootNode.get("choices");

            if (choices != null && choices.isArray() && choices.size() > 0) {
                String content = choices.get(0).get("message").get("content").asText();

                // 提取 JSON 内容
                String jsonContent = extractJSON(content);
                JsonNode aiResult = objectMapper.readTree(jsonContent);

                int score = aiResult.has("score") ? aiResult.get("score").asInt() : 50;
                String recommendation = aiResult.has("recommendation") ?
                        aiResult.get("recommendation").asText() : "review";

                List<String> warnings = new ArrayList<>();
                if (aiResult.has("warnings") && aiResult.get("warnings").isArray()) {
                    for (JsonNode warning : aiResult.get("warnings")) {
                        warnings.add(warning.asText());
                    }
                }

                List<String> suggestions = new ArrayList<>();
                if (aiResult.has("suggestions") && aiResult.get("suggestions").isArray()) {
                    for (JsonNode suggestion : aiResult.get("suggestions")) {
                        suggestions.add(suggestion.asText());
                    }
                }

                String reason = aiResult.has("reason") ? aiResult.get("reason").asText() : "";

                result.put("score", score);
                result.put("recommendation", recommendation);
                result.put("warnings", warnings);
                result.put("suggestions", suggestions);
                result.put("reason", reason);
            }
        } catch (Exception e) {
            e.printStackTrace();
            result.put("score", 50);
            result.put("recommendation", "review");
            result.put("warnings", List.of("AI 返回结果解析失败"));
            result.put("suggestions", List.of("请人工审核"));
            result.put("reason", "解析异常: " + e.getMessage());
        }

        return result;
    }

    private String extractJSON(String content) {
        // 提取 JSON 对象
        int startIndex = content.indexOf('{');
        int endIndex = content.lastIndexOf('}');

        if (startIndex != -1 && endIndex != -1) {
            return content.substring(startIndex, endIndex + 1);
        }

        return content;
    }

    public Map<String, Object> batchReview(List<Item> items) {
        Map<String, Object> results = new HashMap<>();
        Map<String, Object> itemResults = new HashMap<>();

        int approveCount = 0;
        int reviewCount = 0;
        int rejectCount = 0;
        int autoApprovedCount = 0;
        int cachedCount = 0;

        System.out.println("开始批量审核，共 " + items.size() + " 个商品");

        for (Item item : items) {
            Map<String, Object> review = reviewItem(item);
            itemResults.put(String.valueOf(item.getId()), review);

            // 统计缓存使用情况
            Boolean cached = (Boolean) review.getOrDefault("cached", false);
            if (cached) {
                cachedCount++;
            }

            String recommendation = (String) review.get("recommendation");
            Boolean autoApproved = (Boolean) review.getOrDefault("autoApproved", false);
            
            if (autoApproved) {
                autoApprovedCount++;
                approveCount++;
            } else if ("approve".equals(recommendation)) {
                approveCount++;
            } else if ("review".equals(recommendation)) {
                reviewCount++;
            } else {
                rejectCount++;
            }
        }

        System.out.println("批量审核完成 - 使用缓存: " + cachedCount + 
                          ", 自动通过: " + autoApprovedCount + 
                          ", 建议通过: " + approveCount + 
                          ", 建议复审: " + reviewCount + 
                          ", 建议拒绝: " + rejectCount);

        results.put("items", itemResults);
        results.put("statistics", Map.of(
                "approveCount", approveCount,
                "reviewCount", reviewCount,
                "rejectCount", rejectCount,
                "autoApprovedCount", autoApprovedCount,
                "cachedCount", cachedCount,
                "totalCount", items.size()
        ));

        return results;
    }
}
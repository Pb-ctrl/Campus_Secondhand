package com.example.demo.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
public class FileUploadUtil {

    @Value("${file.upload.path}")
    private String uploadPath;

    public String uploadFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("文件为空");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IOException("文件名无效");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String[] allowedExtensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"};

        boolean isAllowed = false;
        for (String allowedExt : allowedExtensions) {
            if (extension.toLowerCase().equals(allowedExt)) {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed) {
            throw new IOException("不支持的文件类型，仅支持 jpg、jpeg、png、gif、webp 格式");
        }

        long fileSize = file.getSize();
        if (fileSize > 5 * 1024 * 1024) {
            throw new IOException("文件大小不能超过5MB");
        }

        String fileName = UUID.randomUUID().toString() + extension;

        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        Path path = Paths.get(uploadPath + fileName);
        Files.write(path, file.getBytes());

        return "/uploads/images/" + fileName;
    }
}
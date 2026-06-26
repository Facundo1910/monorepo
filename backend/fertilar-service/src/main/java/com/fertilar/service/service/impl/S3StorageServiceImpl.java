package com.fertilar.service.service.impl;

import com.fertilar.service.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class S3StorageServiceImpl implements S3StorageService {

    private static final String CERTIFICADOS_PREFIX = "certificados/";

    private final S3Client s3Client;

    @Value("${aws.s3.certificados-bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    @Override
    public String subirCertificadoHtml(String numero, String html) {
        String key = CERTIFICADOS_PREFIX + numero + ".html";

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("text/html; charset=utf-8")
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(html.getBytes(StandardCharsets.UTF_8)));

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    }

    @Override
    public void eliminarCertificado(String urlDocumento) {
        if (urlDocumento == null || urlDocumento.isBlank()) {
            return;
        }

        String key = extraerKey(urlDocumento);
        if (key == null) {
            return;
        }

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        s3Client.deleteObject(request);
    }

    private String extraerKey(String urlDocumento) {
        String marker = ".amazonaws.com/";
        int index = urlDocumento.indexOf(marker);
        if (index == -1) {
            return null;
        }
        return urlDocumento.substring(index + marker.length());
    }
}

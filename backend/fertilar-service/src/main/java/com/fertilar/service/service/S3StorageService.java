package com.fertilar.service.service;

public interface S3StorageService {

    String subirCertificadoHtml(String numero, String html);

    void eliminarCertificado(String urlDocumento);
}

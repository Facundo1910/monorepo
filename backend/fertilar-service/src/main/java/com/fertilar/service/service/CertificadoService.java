package com.fertilar.service.service;

import com.fertilar.service.dto.CertificadoDTO;
import com.fertilar.service.dto.CertificadoRequest;

import java.util.List;
import java.util.UUID;

public interface CertificadoService {

    CertificadoDTO generar(UUID pilaId, CertificadoRequest request, String authHeader);

    List<CertificadoDTO> listarPorPila(UUID pilaId);

    CertificadoDTO obtener(UUID id);

    void eliminar(UUID id, String authHeader);
}

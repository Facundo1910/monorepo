package com.fertilar.service.service;

import com.fertilar.service.dto.AlertaDTO;
import com.fertilar.service.dto.AlertaResolverResponseDTO;

import java.util.List;
import java.util.UUID;

public interface AlertaService {

    List<AlertaDTO> listar(Boolean resuelta);

    AlertaDTO obtener(UUID id);

    List<AlertaDTO> listarPorPila(UUID pilaId);

    AlertaResolverResponseDTO resolver(UUID id);
}

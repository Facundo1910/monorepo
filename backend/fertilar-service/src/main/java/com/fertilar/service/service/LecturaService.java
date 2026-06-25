package com.fertilar.service.service;

import com.fertilar.service.dto.LecturaDTO;
import com.fertilar.service.dto.LecturaRequest;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface LecturaService {

    LecturaDTO crear(LecturaRequest request);

    Page<LecturaDTO> listar(int page, int size);

    LecturaDTO obtener(UUID id);

    List<LecturaDTO> listarPorSensor(UUID sensorId, LocalDateTime desde, LocalDateTime hasta, Integer limit);

    List<LecturaDTO> listarPorPila(UUID pilaId, LocalDateTime desde, LocalDateTime hasta);
}

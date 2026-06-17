package com.fertilar.service.service;

import com.fertilar.service.dto.SensorDTO;
import com.fertilar.service.dto.SensorRequest;
import com.fertilar.service.dto.SensorResumenDTO;

import java.util.List;
import java.util.UUID;

public interface SensorService {

    List<SensorResumenDTO> listar();

    List<SensorResumenDTO> listarPorPila(UUID pilaId);

    SensorDTO obtener(UUID id);

    SensorDTO crear(SensorRequest request);

    SensorDTO actualizar(UUID id, SensorRequest request);

    void eliminar(UUID id);
}

package com.fertilar.service.service;

import com.fertilar.service.dto.UmbralDTO;
import com.fertilar.service.dto.UmbralRequest;

import java.util.List;
import java.util.UUID;

public interface UmbralService {

    List<UmbralDTO> listarPorPila(UUID pilaId);

    UmbralDTO obtener(UUID id);

    UmbralDTO crear(UUID pilaId, UmbralRequest request);

    UmbralDTO actualizar(UUID id, UmbralRequest request);

    void eliminar(UUID id);
}

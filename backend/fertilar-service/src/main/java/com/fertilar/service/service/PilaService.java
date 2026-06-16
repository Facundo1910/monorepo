package com.fertilar.service.service;

import com.fertilar.service.dto.PilaDTO;
import com.fertilar.service.dto.PilaRequest;
import com.fertilar.service.dto.PilaResumenDTO;

import java.util.List;
import java.util.UUID;

public interface PilaService {

    List<PilaResumenDTO> listar();

    PilaDTO obtener(UUID id);

    PilaDTO crear(PilaRequest request);

    PilaDTO actualizar(UUID id, PilaRequest request);

    void eliminar(UUID id);
}

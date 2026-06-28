package com.fertilar.service.service;

import com.fertilar.service.dto.PilaFasesDTO;

import java.util.UUID;

public interface FaseEvaluacionService {

    PilaFasesDTO evaluar(UUID pilaId);
}

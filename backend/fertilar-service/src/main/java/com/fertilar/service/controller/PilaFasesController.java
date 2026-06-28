package com.fertilar.service.controller;

import com.fertilar.service.dto.PilaFasesDTO;
import com.fertilar.service.service.FaseEvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/pilas/{pilaId}/fases")
@RequiredArgsConstructor
public class PilaFasesController {

    private final FaseEvaluacionService faseEvaluacionService;

    @GetMapping
    public ResponseEntity<PilaFasesDTO> evaluar(@PathVariable UUID pilaId) {
        return ResponseEntity.ok(faseEvaluacionService.evaluar(pilaId));
    }
}

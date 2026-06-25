package com.fertilar.service.controller;

import com.fertilar.service.dto.AlertaDTO;
import com.fertilar.service.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pilas/{pilaId}/alertas")
@RequiredArgsConstructor
public class PilaAlertasController {

    private final AlertaService alertaService;

    @GetMapping
    public ResponseEntity<List<AlertaDTO>> listarPorPila(@PathVariable UUID pilaId) {
        return ResponseEntity.ok(alertaService.listarPorPila(pilaId));
    }
}

package com.fertilar.service.controller;

import com.fertilar.service.dto.AlertaDTO;
import com.fertilar.service.dto.AlertaResolverResponseDTO;
import com.fertilar.service.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService alertaService;

    @GetMapping
    public ResponseEntity<List<AlertaDTO>> listar(@RequestParam(required = false) Boolean resuelta) {
        return ResponseEntity.ok(alertaService.listar(resuelta));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertaDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(alertaService.obtener(id));
    }

    @PutMapping("/{id}/resolver")
    public ResponseEntity<AlertaResolverResponseDTO> resolver(@PathVariable UUID id) {
        return ResponseEntity.ok(alertaService.resolver(id));
    }
}

package com.fertilar.service.controller;

import com.fertilar.service.dto.CertificadoDTO;
import com.fertilar.service.dto.CertificadoRequest;
import com.fertilar.service.service.CertificadoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pilas/{pilaId}/certificados")
@RequiredArgsConstructor
public class PilaCertificadosController {

    private final CertificadoService certificadoService;

    @GetMapping
    public ResponseEntity<List<CertificadoDTO>> listarPorPila(@PathVariable UUID pilaId) {
        return ResponseEntity.ok(certificadoService.listarPorPila(pilaId));
    }

    @PostMapping
    public ResponseEntity<CertificadoDTO> generar(
            @PathVariable UUID pilaId,
            @RequestBody(required = false) CertificadoRequest request,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(certificadoService.generar(pilaId, request, authHeader));
    }
}

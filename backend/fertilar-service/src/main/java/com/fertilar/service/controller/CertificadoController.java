package com.fertilar.service.controller;

import com.fertilar.service.dto.CertificadoDTO;
import com.fertilar.service.service.CertificadoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/certificados")
@RequiredArgsConstructor
public class CertificadoController {

    private final CertificadoService certificadoService;

    @GetMapping
    public ResponseEntity<List<CertificadoDTO>> listar() {
        return ResponseEntity.ok(certificadoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CertificadoDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(certificadoService.obtener(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        certificadoService.eliminar(id, authHeader);
        return ResponseEntity.noContent().build();
    }
}

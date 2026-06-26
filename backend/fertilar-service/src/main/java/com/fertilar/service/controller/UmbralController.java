package com.fertilar.service.controller;

import com.fertilar.service.dto.UmbralDTO;
import com.fertilar.service.dto.UmbralRequest;
import com.fertilar.service.service.UmbralService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/umbrales")
@RequiredArgsConstructor
public class UmbralController {

    private final UmbralService umbralService;

    @GetMapping("/{id}")
    public ResponseEntity<UmbralDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(umbralService.obtener(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UmbralDTO> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody UmbralRequest request) {
        return ResponseEntity.ok(umbralService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        umbralService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

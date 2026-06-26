package com.fertilar.service.controller;

import com.fertilar.service.dto.UmbralDTO;
import com.fertilar.service.dto.UmbralRequest;
import com.fertilar.service.service.UmbralService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pilas/{pilaId}/umbrales")
@RequiredArgsConstructor
public class PilaUmbralesController {

    private final UmbralService umbralService;

    @GetMapping
    public ResponseEntity<List<UmbralDTO>> listarPorPila(@PathVariable UUID pilaId) {
        return ResponseEntity.ok(umbralService.listarPorPila(pilaId));
    }

    @PostMapping
    public ResponseEntity<UmbralDTO> crear(
            @PathVariable UUID pilaId,
            @Valid @RequestBody UmbralRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(umbralService.crear(pilaId, request));
    }
}

package com.fertilar.service.controller;

import com.fertilar.service.dto.LecturaDTO;
import com.fertilar.service.dto.LecturaRequest;
import com.fertilar.service.service.LecturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/lecturas")
@RequiredArgsConstructor
public class LecturaController {

    private final LecturaService lecturaService;

    @PostMapping
    public ResponseEntity<LecturaDTO> crear(@Valid @RequestBody LecturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lecturaService.crear(request));
    }

    @GetMapping
    public ResponseEntity<Page<LecturaDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(lecturaService.listar(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LecturaDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(lecturaService.obtener(id));
    }
}

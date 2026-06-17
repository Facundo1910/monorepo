package com.fertilar.service.controller;

import com.fertilar.service.dto.SensorDTO;
import com.fertilar.service.dto.SensorRequest;
import com.fertilar.service.dto.SensorResumenDTO;
import com.fertilar.service.service.SensorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sensores")
@RequiredArgsConstructor
public class SensorController {

    private final SensorService sensorService;

    @GetMapping
    public ResponseEntity<List<SensorResumenDTO>> listar() {
        return ResponseEntity.ok(sensorService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SensorDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(sensorService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<SensorDTO> crear(@Valid @RequestBody SensorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sensorService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SensorDTO> actualizar(@PathVariable UUID id, @Valid @RequestBody SensorRequest request) {
        return ResponseEntity.ok(sensorService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        sensorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

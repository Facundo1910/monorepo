package com.fertilar.service.controller;

import com.fertilar.service.dto.SensorResumenDTO;
import com.fertilar.service.service.SensorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pilas/{pilaId}/sensores")
@RequiredArgsConstructor
public class PilaSensoresController {

    private final SensorService sensorService;

    @GetMapping
    public ResponseEntity<List<SensorResumenDTO>> listarPorPila(@PathVariable UUID pilaId) {
        return ResponseEntity.ok(sensorService.listarPorPila(pilaId));
    }
}

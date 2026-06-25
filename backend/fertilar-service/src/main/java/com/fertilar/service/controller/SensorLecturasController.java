package com.fertilar.service.controller;

import com.fertilar.service.dto.LecturaDTO;
import com.fertilar.service.service.LecturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sensores/{sensorId}/lecturas")
@RequiredArgsConstructor
public class SensorLecturasController {

    private final LecturaService lecturaService;

    @GetMapping
    public ResponseEntity<List<LecturaDTO>> listarPorSensor(
            @PathVariable UUID sensorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(lecturaService.listarPorSensor(sensorId, desde, hasta, limit));
    }
}

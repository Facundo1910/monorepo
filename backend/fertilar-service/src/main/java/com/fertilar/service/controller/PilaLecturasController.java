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
@RequestMapping("/pilas/{pilaId}/lecturas")
@RequiredArgsConstructor
public class PilaLecturasController {

    private final LecturaService lecturaService;

    @GetMapping
    public ResponseEntity<List<LecturaDTO>> listarPorPila(
            @PathVariable UUID pilaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        return ResponseEntity.ok(lecturaService.listarPorPila(pilaId, desde, hasta));
    }
}

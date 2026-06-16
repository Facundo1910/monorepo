package com.fertilar.service.controller;

import com.fertilar.service.dto.PilaDTO;
import com.fertilar.service.dto.PilaRequest;
import com.fertilar.service.dto.PilaResumenDTO;
import com.fertilar.service.service.PilaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pilas")
@RequiredArgsConstructor
public class PilaController {

    private final PilaService pilaService;

    @GetMapping
    public ResponseEntity<List<PilaResumenDTO>> listar() {
        return ResponseEntity.ok(pilaService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PilaDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(pilaService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<PilaDTO> crear(@Valid @RequestBody PilaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pilaService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PilaDTO> actualizar(@PathVariable UUID id, @Valid @RequestBody PilaRequest request) {
        return ResponseEntity.ok(pilaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        pilaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

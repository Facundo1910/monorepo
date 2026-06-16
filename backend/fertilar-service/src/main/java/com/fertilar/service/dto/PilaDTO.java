package com.fertilar.service.dto;

import com.fertilar.service.entity.Pila;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PilaDTO {

    private UUID id;
    private String nombre;
    private String descripcion;
    private String ubicacion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Pila.Estado estado;
    private LocalDateTime createdAt;

    public static PilaDTO from(Pila pila) {
        return PilaDTO.builder()
                .id(pila.getId())
                .nombre(pila.getNombre())
                .descripcion(pila.getDescripcion())
                .ubicacion(pila.getUbicacion())
                .fechaInicio(pila.getFechaInicio())
                .fechaFin(pila.getFechaFin())
                .estado(pila.getEstado())
                .createdAt(pila.getCreatedAt())
                .build();
    }
}

package com.fertilar.service.dto;

import com.fertilar.service.entity.Pila;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
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
    private Integer diasEstimados;
    private BigDecimal humedadObjetivo;
    private BigDecimal temperaturaObjetivo;
    private LocalDate fechaEstimadaFin;
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
                .diasEstimados(pila.getDiasEstimados())
                .humedadObjetivo(pila.getHumedadObjetivo())
                .temperaturaObjetivo(pila.getTemperaturaObjetivo())
                .fechaEstimadaFin(pila.getFechaEstimadaFin())
                .estado(pila.getEstado())
                .createdAt(pila.getCreatedAt())
                .build();
    }
}

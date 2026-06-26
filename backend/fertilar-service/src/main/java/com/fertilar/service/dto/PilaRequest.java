package com.fertilar.service.dto;

import com.fertilar.service.entity.Pila;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PilaRequest {

    @NotBlank
    private String nombre;

    private String descripcion;

    private String ubicacion;

    @NotNull
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private Integer diasEstimados;

    private BigDecimal humedadObjetivo;

    private BigDecimal temperaturaObjetivo;

    @NotNull
    private Pila.Estado estado;
}

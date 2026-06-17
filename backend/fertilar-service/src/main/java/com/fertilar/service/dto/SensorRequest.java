package com.fertilar.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SensorRequest {

    @NotNull
    private UUID pilaId;

    @NotBlank
    private String codigo;

    @NotBlank
    private String tipo;

    private String descripcion;

    @NotNull
    private Boolean activo;
}

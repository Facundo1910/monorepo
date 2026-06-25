package com.fertilar.service.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class LecturaRequest {

    @NotNull
    private UUID sensorId;

    private BigDecimal temperatura;
    private BigDecimal humedad;
    private BigDecimal nitrogeno;
    private BigDecimal fosforo;
    private BigDecimal potasio;
    private BigDecimal ph;
    private BigDecimal conductividad;
}

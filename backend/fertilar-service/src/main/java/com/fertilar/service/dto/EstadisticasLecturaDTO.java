package com.fertilar.service.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class EstadisticasLecturaDTO {

    private BigDecimal temperaturaPromedio;
    private BigDecimal humedadPromedio;
    private BigDecimal phPromedio;
    private int cantidadLecturas;
}

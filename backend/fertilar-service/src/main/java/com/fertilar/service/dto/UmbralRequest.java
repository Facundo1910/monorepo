package com.fertilar.service.dto;

import com.fertilar.service.entity.Alerta;
import com.fertilar.service.entity.Umbral;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UmbralRequest {

    @NotNull
    private Umbral.Parametro parametro;

    private BigDecimal valorMin;
    private BigDecimal valorMax;

    @NotNull
    private Alerta.Nivel nivel;

    private Boolean activo = true;
}

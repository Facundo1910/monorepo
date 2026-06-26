package com.fertilar.service.dto;

import com.fertilar.service.entity.Alerta;
import com.fertilar.service.entity.Umbral;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UmbralDTO {

    private UUID id;
    private UUID pilaId;
    private Umbral.Parametro parametro;
    private BigDecimal valorMin;
    private BigDecimal valorMax;
    private Alerta.Nivel nivel;
    private Boolean activo;
    private LocalDateTime createdAt;

    public static UmbralDTO from(Umbral umbral) {
        return UmbralDTO.builder()
                .id(umbral.getId())
                .pilaId(umbral.getPila().getId())
                .parametro(umbral.getParametro())
                .valorMin(umbral.getValorMin())
                .valorMax(umbral.getValorMax())
                .nivel(umbral.getNivel())
                .activo(umbral.getActivo())
                .createdAt(umbral.getCreatedAt())
                .build();
    }
}

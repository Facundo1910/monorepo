package com.fertilar.service.dto;

import com.fertilar.service.entity.Alerta;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AlertaResolverResponseDTO {

    private UUID id;
    private Boolean resuelta;
    private LocalDateTime resolvedAt;

    public static AlertaResolverResponseDTO from(Alerta alerta) {
        return AlertaResolverResponseDTO.builder()
                .id(alerta.getId())
                .resuelta(alerta.getResuelta())
                .resolvedAt(alerta.getResolvedAt())
                .build();
    }
}

package com.fertilar.service.dto;

import com.fertilar.service.entity.Alerta;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AlertaDTO {

    private UUID id;
    private UUID pilaId;
    private UUID lecturaId;
    private String tipo;
    private String mensaje;
    private Alerta.Nivel nivel;
    private Boolean resuelta;
    private LocalDateTime createdAt;

    public static AlertaDTO from(Alerta alerta) {
        return AlertaDTO.builder()
                .id(alerta.getId())
                .pilaId(alerta.getPila().getId())
                .lecturaId(alerta.getLectura().getId())
                .tipo(alerta.getTipo())
                .mensaje(alerta.getMensaje())
                .nivel(alerta.getNivel())
                .resuelta(alerta.getResuelta())
                .createdAt(alerta.getCreatedAt())
                .build();
    }
}

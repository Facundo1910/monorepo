package com.fertilar.service.dto;

import com.fertilar.service.entity.Lectura;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LecturaDTO {

    private UUID id;
    private UUID sensorId;
    private BigDecimal temperatura;
    private BigDecimal humedad;
    private BigDecimal nitrogeno;
    private BigDecimal fosforo;
    private BigDecimal potasio;
    private BigDecimal ph;
    private BigDecimal conductividad;
    private LocalDateTime timestamp;

    public static LecturaDTO from(Lectura lectura) {
        return LecturaDTO.builder()
                .id(lectura.getId())
                .sensorId(lectura.getSensor().getId())
                .temperatura(lectura.getTemperatura())
                .humedad(lectura.getHumedad())
                .nitrogeno(lectura.getNitrogeno())
                .fosforo(lectura.getFosforo())
                .potasio(lectura.getPotasio())
                .ph(lectura.getPh())
                .conductividad(lectura.getConductividad())
                .timestamp(lectura.getTimestamp())
                .build();
    }
}

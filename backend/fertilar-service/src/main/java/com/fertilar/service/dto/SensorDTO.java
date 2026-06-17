package com.fertilar.service.dto;

import com.fertilar.service.entity.Sensor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SensorDTO {

    private UUID id;
    private UUID pilaId;
    private String codigo;
    private String tipo;
    private String descripcion;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SensorDTO from(Sensor sensor) {
        return SensorDTO.builder()
                .id(sensor.getId())
                .pilaId(sensor.getPila().getId())
                .codigo(sensor.getCodigo())
                .tipo(sensor.getTipo())
                .descripcion(sensor.getDescripcion())
                .activo(sensor.getActivo())
                .createdAt(sensor.getCreatedAt())
                .updatedAt(sensor.getUpdatedAt())
                .build();
    }
}

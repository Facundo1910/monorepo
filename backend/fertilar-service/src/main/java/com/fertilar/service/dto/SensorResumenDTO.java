package com.fertilar.service.dto;

import com.fertilar.service.entity.Sensor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SensorResumenDTO {

    private UUID id;
    private UUID pilaId;
    private String codigo;
    private String tipo;
    private Boolean activo;

    public static SensorResumenDTO from(Sensor sensor) {
        return SensorResumenDTO.builder()
                .id(sensor.getId())
                .pilaId(sensor.getPila().getId())
                .codigo(sensor.getCodigo())
                .tipo(sensor.getTipo())
                .activo(sensor.getActivo())
                .build();
    }
}

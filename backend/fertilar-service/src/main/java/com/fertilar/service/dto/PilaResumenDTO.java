package com.fertilar.service.dto;

import com.fertilar.service.entity.Pila;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PilaResumenDTO {

    private UUID id;
    private String nombre;
    private Pila.Estado estado;
    private LocalDate fechaInicio;
    private String ubicacion;

    public static PilaResumenDTO from(Pila pila) {
        return PilaResumenDTO.builder()
                .id(pila.getId())
                .nombre(pila.getNombre())
                .estado(pila.getEstado())
                .fechaInicio(pila.getFechaInicio())
                .ubicacion(pila.getUbicacion())
                .build();
    }
}

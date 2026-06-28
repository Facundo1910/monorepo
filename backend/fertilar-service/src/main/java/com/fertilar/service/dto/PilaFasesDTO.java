package com.fertilar.service.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PilaFasesDTO {

    private UUID pilaId;
    private int diasTranscurridos;
    private int diasEstimados;
    private FasesDetalle fases;
    private boolean aptoParaCertificar;
    private String motivoNoCertificable;

    @Data
    @Builder
    public static class FasesDetalle {
        private FaseMesofila mesofila;
        private FaseTermofila termofila;
        private FaseEnfriamiento enfriamiento;
        private FaseMaduracion maduracion;
    }

    @Data
    @Builder
    public static class FaseMesofila {
        private boolean completada;
        private String descripcion;
        private BigDecimal temperaturaMax;
    }

    @Data
    @Builder
    public static class FaseTermofila {
        private boolean completada;
        private String descripcion;
        private Integer diasSobre55;
    }

    @Data
    @Builder
    public static class FaseEnfriamiento {
        private boolean completada;
        private String descripcion;
        private BigDecimal temperaturaActual;
    }

    @Data
    @Builder
    public static class FaseMaduracion {
        private boolean completada;
        private String descripcion;
        private Integer diasRestantes;
    }
}

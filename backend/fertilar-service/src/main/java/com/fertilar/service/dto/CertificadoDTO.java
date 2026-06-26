package com.fertilar.service.dto;

import com.fertilar.service.entity.Certificado;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CertificadoDTO {

    private UUID id;
    private UUID pilaId;
    private String pilaNombre;
    private UUID usuarioId;
    private String usuarioNombre;
    private String numero;
    private LocalDate fechaEmision;
    private String urlDocumento;
    private String observaciones;
    private BigDecimal temperaturaPromedio;
    private BigDecimal humedadPromedio;
    private BigDecimal phPromedio;
    private LocalDateTime createdAt;

    public static CertificadoDTO from(Certificado certificado) {
        return CertificadoDTO.builder()
                .id(certificado.getId())
                .pilaId(certificado.getPila().getId())
                .pilaNombre(certificado.getPila().getNombre())
                .usuarioId(certificado.getUsuario().getId())
                .usuarioNombre(certificado.getUsuario().getNombre() + " " + certificado.getUsuario().getApellido())
                .numero(certificado.getNumero())
                .fechaEmision(certificado.getFechaEmision())
                .urlDocumento(certificado.getUrlDocumento())
                .observaciones(certificado.getObservaciones())
                .createdAt(certificado.getCreatedAt())
                .build();
    }

    public static CertificadoDTO from(Certificado certificado, EstadisticasLecturaDTO estadisticas) {
        CertificadoDTO dto = from(certificado);
        if (estadisticas != null) {
            dto.setTemperaturaPromedio(estadisticas.getTemperaturaPromedio());
            dto.setHumedadPromedio(estadisticas.getHumedadPromedio());
            dto.setPhPromedio(estadisticas.getPhPromedio());
        }
        return dto;
    }
}

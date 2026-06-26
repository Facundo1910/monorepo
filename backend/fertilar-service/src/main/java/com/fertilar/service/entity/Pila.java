package com.fertilar.service.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "pila")
public class Pila {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 255)
    private String ubicacion;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "dias_estimados", nullable = false)
    private Integer diasEstimados = 90;

    @Column(name = "humedad_objetivo", precision = 5, scale = 2, nullable = false)
    private BigDecimal humedadObjetivo = new BigDecimal("43.0");

    @Column(name = "temperatura_objetivo", precision = 5, scale = 2, nullable = false)
    private BigDecimal temperaturaObjetivo = new BigDecimal("30.0");

    @Column(name = "fecha_estimada_fin")
    private LocalDate fechaEstimadaFin;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Estado estado;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum Estado {
        ACTIVA, FINALIZADA, PAUSADA
    }
}

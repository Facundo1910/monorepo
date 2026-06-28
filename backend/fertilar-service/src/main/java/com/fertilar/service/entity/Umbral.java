package com.fertilar.service.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "umbral")
public class Umbral {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pila_id", nullable = false)
    private Pila pila;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Parametro parametro;

    @Column(name = "valor_min", precision = 8, scale = 2)
    private BigDecimal valorMin;

    @Column(name = "valor_max", precision = 8, scale = 2)
    private BigDecimal valorMax;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Alerta.Nivel nivel;

    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Parametro {
        TEMPERATURA, HUMEDAD, PH, CONDUCTIVIDAD, NITROGENO, FOSFORO, POTASIO, OXIGENO
    }
}

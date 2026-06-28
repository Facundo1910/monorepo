package com.fertilar.service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Data
@Entity
@Table(name = "lectura")
public class Lectura {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @Column(precision = 5, scale = 2)
    private BigDecimal temperatura;

    @Column(precision = 5, scale = 2)
    private BigDecimal humedad;

    @Column(precision = 8, scale = 2)
    private BigDecimal nitrogeno;

    @Column(precision = 8, scale = 2)
    private BigDecimal fosforo;

    @Column(precision = 8, scale = 2)
    private BigDecimal potasio;

    @Column(precision = 4, scale = 2)
    private BigDecimal ph;

    @Column(precision = 8, scale = 2)
    private BigDecimal conductividad;

    @Column(precision = 8, scale = 2)
    private BigDecimal oxigeno;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now(ZoneId.of("America/Argentina/Buenos_Aires"));
}

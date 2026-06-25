package com.fertilar.service.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "alerta")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lectura_id", nullable = false)
    private Lectura lectura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pila_id", nullable = false)
    private Pila pila;

    @Column(nullable = false, length = 100)
    private String tipo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Nivel nivel;

    @Column(nullable = false)
    private Boolean resuelta = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Nivel {
        INFO, ADVERTENCIA, CRITICA
    }
}

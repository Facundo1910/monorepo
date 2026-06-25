package com.fertilar.service.repository;

import com.fertilar.service.entity.Lectura;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface LecturaRepository extends JpaRepository<Lectura, UUID> {

    Page<Lectura> findAllByOrderByTimestampDesc(Pageable pageable);

    List<Lectura> findBySensorIdOrderByTimestampDesc(UUID sensorId);

    @Query("""
            SELECT l FROM Lectura l
            WHERE l.sensor.id = :sensorId
            AND (:desde IS NULL OR l.timestamp >= :desde)
            AND (:hasta IS NULL OR l.timestamp <= :hasta)
            ORDER BY l.timestamp DESC
            """)
    List<Lectura> findBySensorIdFiltered(
            @Param("sensorId") UUID sensorId,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            Pageable pageable);

    @Query("""
            SELECT l FROM Lectura l
            WHERE l.sensor.pila.id = :pilaId
            AND (:desde IS NULL OR l.timestamp >= :desde)
            AND (:hasta IS NULL OR l.timestamp <= :hasta)
            ORDER BY l.timestamp DESC
            """)
    List<Lectura> findByPilaIdFiltered(
            @Param("pilaId") UUID pilaId,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);
}

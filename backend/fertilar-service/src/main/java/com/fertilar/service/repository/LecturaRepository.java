package com.fertilar.service.repository;

import com.fertilar.service.entity.Lectura;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface LecturaRepository extends JpaRepository<Lectura, UUID> {

    Page<Lectura> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<Lectura> findBySensorIdOrderByTimestampDesc(UUID sensorId, Pageable pageable);

    Page<Lectura> findBySensorIdAndTimestampBetweenOrderByTimestampDesc(
            UUID sensorId, LocalDateTime desde, LocalDateTime hasta, Pageable pageable);

    Page<Lectura> findBySensorIdAndTimestampGreaterThanEqualOrderByTimestampDesc(
            UUID sensorId, LocalDateTime desde, Pageable pageable);

    Page<Lectura> findBySensorIdAndTimestampLessThanEqualOrderByTimestampDesc(
            UUID sensorId, LocalDateTime hasta, Pageable pageable);

    List<Lectura> findBySensor_Pila_IdOrderByTimestampDesc(UUID pilaId);

    List<Lectura> findBySensor_Pila_IdAndTimestampBetweenOrderByTimestampDesc(
            UUID pilaId, LocalDateTime desde, LocalDateTime hasta);

    List<Lectura> findBySensor_Pila_IdAndTimestampGreaterThanEqualOrderByTimestampDesc(
            UUID pilaId, LocalDateTime desde);

    List<Lectura> findBySensor_Pila_IdAndTimestampLessThanEqualOrderByTimestampDesc(
            UUID pilaId, LocalDateTime hasta);
}

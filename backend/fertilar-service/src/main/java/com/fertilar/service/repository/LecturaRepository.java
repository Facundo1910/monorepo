package com.fertilar.service.repository;

import com.fertilar.service.entity.Lectura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LecturaRepository extends JpaRepository<Lectura, UUID> {

    List<Lectura> findBySensorIdOrderByTimestampDesc(UUID sensorId);
}

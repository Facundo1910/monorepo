package com.fertilar.service.repository;

import com.fertilar.service.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SensorRepository extends JpaRepository<Sensor, UUID> {

    List<Sensor> findByPilaId(UUID pilaId);

    List<Sensor> findByPilaIdAndActivoTrue(UUID pilaId);
}

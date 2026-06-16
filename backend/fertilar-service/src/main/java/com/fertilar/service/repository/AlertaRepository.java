package com.fertilar.service.repository;

import com.fertilar.service.entity.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertaRepository extends JpaRepository<Alerta, UUID> {

    List<Alerta> findByPilaIdAndResueltaFalse(UUID pilaId);

    List<Alerta> findByPilaId(UUID pilaId);
}

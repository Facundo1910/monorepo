package com.fertilar.service.repository;

import com.fertilar.service.entity.Umbral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UmbralRepository extends JpaRepository<Umbral, UUID> {

    List<Umbral> findByPilaIdOrderByParametroAscCreatedAtAsc(UUID pilaId);

    List<Umbral> findByPilaIdAndActivoTrueOrderByParametroAscCreatedAtAsc(UUID pilaId);
}

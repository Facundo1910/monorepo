package com.fertilar.service.repository;

import com.fertilar.service.entity.Certificado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificadoRepository extends JpaRepository<Certificado, UUID> {

    List<Certificado> findByPilaId(UUID pilaId);

    List<Certificado> findAllByOrderByFechaEmisionDescCreatedAtDesc();

    List<Certificado> findByUsuarioId(UUID usuarioId);

    @Query("SELECT MAX(c.numero) FROM Certificado c WHERE c.numero LIKE :patron")
    Optional<String> findMaxNumeroLike(@Param("patron") String patron);
}

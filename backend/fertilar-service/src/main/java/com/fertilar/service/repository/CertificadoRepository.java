package com.fertilar.service.repository;

import com.fertilar.service.entity.Certificado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificadoRepository extends JpaRepository<Certificado, UUID> {

    List<Certificado> findByPilaId(UUID pilaId);

    List<Certificado> findByUsuarioId(UUID usuarioId);
}

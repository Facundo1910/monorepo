package com.fertilar.service.repository;

import com.fertilar.service.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByCognitoSub(String cognitoSub);

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}

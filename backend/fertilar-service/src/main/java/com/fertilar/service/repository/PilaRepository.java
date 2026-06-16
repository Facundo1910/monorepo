package com.fertilar.service.repository;

import com.fertilar.service.entity.Pila;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PilaRepository extends JpaRepository<Pila, UUID> {

    List<Pila> findByEstado(Pila.Estado estado);
}

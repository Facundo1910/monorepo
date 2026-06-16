package com.fertilar.service.service.impl;

import com.fertilar.service.dto.PilaDTO;
import com.fertilar.service.dto.PilaRequest;
import com.fertilar.service.dto.PilaResumenDTO;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.service.PilaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PilaServiceImpl implements PilaService {

    private final PilaRepository pilaRepository;

    @Override
    public List<PilaResumenDTO> listar() {
        return pilaRepository.findAll()
                .stream()
                .map(PilaResumenDTO::from)
                .toList();
    }

    @Override
    public PilaDTO obtener(UUID id) {
        return pilaRepository.findById(id)
                .map(PilaDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("Pila", id));
    }

    @Override
    public PilaDTO crear(PilaRequest request) {
        Pila pila = new Pila();
        pila.setNombre(request.getNombre());
        pila.setDescripcion(request.getDescripcion());
        pila.setUbicacion(request.getUbicacion());
        pila.setFechaInicio(request.getFechaInicio());
        pila.setFechaFin(request.getFechaFin());
        pila.setEstado(request.getEstado());
        return PilaDTO.from(pilaRepository.save(pila));
    }

    @Override
    public PilaDTO actualizar(UUID id, PilaRequest request) {
        Pila pila = pilaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pila", id));

        pila.setNombre(request.getNombre());
        pila.setDescripcion(request.getDescripcion());
        pila.setUbicacion(request.getUbicacion());
        pila.setFechaInicio(request.getFechaInicio());
        pila.setFechaFin(request.getFechaFin());
        pila.setEstado(request.getEstado());

        return PilaDTO.from(pilaRepository.save(pila));
    }

    @Override
    public void eliminar(UUID id) {
        if (!pilaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Pila", id);
        }
        pilaRepository.deleteById(id);
    }
}

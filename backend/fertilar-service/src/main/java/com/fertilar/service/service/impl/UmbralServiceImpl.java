package com.fertilar.service.service.impl;

import com.fertilar.service.dto.UmbralDTO;
import com.fertilar.service.dto.UmbralRequest;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.entity.Umbral;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.repository.UmbralRepository;
import com.fertilar.service.service.UmbralService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UmbralServiceImpl implements UmbralService {

    private final UmbralRepository umbralRepository;
    private final PilaRepository pilaRepository;

    @Override
    public List<UmbralDTO> listarPorPila(UUID pilaId) {
        validarPilaExiste(pilaId);
        return umbralRepository.findByPilaIdOrderByParametroAscCreatedAtAsc(pilaId)
                .stream()
                .map(UmbralDTO::from)
                .toList();
    }

    @Override
    public UmbralDTO obtener(UUID id) {
        return umbralRepository.findById(id)
                .map(UmbralDTO::from)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Umbral no encontrado", id));
    }

    @Override
    public UmbralDTO crear(UUID pilaId, UmbralRequest request) {
        Pila pila = pilaRepository.findById(pilaId)
                .orElseThrow(() -> new ResourceNotFoundException("Pila", pilaId));
        validarLimites(request);

        Umbral umbral = new Umbral();
        umbral.setPila(pila);
        aplicarRequest(umbral, request);

        return UmbralDTO.from(umbralRepository.save(umbral));
    }

    @Override
    public UmbralDTO actualizar(UUID id, UmbralRequest request) {
        Umbral umbral = umbralRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Umbral no encontrado", id));
        validarLimites(request);
        aplicarRequest(umbral, request);

        return UmbralDTO.from(umbralRepository.save(umbral));
    }

    @Override
    public void eliminar(UUID id) {
        if (!umbralRepository.existsById(id)) {
            throw ResourceNotFoundException.withMessage("Umbral no encontrado", id);
        }
        umbralRepository.deleteById(id);
    }

    private void aplicarRequest(Umbral umbral, UmbralRequest request) {
        umbral.setParametro(request.getParametro());
        umbral.setValorMin(request.getValorMin());
        umbral.setValorMax(request.getValorMax());
        umbral.setNivel(request.getNivel());
        umbral.setActivo(request.getActivo() != null ? request.getActivo() : true);
    }

    private void validarLimites(UmbralRequest request) {
        if (request.getValorMin() == null && request.getValorMax() == null) {
            throw new IllegalArgumentException("Debe indicar al menos valorMin o valorMax");
        }
        if (request.getValorMin() != null && request.getValorMax() != null
                && request.getValorMin().compareTo(request.getValorMax()) > 0) {
            throw new IllegalArgumentException("valorMin no puede ser mayor que valorMax");
        }
    }

    private void validarPilaExiste(UUID pilaId) {
        if (!pilaRepository.existsById(pilaId)) {
            throw new ResourceNotFoundException("Pila", pilaId);
        }
    }
}

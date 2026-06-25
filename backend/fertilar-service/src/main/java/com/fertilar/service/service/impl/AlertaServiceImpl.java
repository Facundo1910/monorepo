package com.fertilar.service.service.impl;

import com.fertilar.service.dto.AlertaDTO;
import com.fertilar.service.dto.AlertaResolverResponseDTO;
import com.fertilar.service.entity.Alerta;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.AlertaRepository;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlertaServiceImpl implements AlertaService {

    private final AlertaRepository alertaRepository;
    private final PilaRepository pilaRepository;

    @Override
    public List<AlertaDTO> listar(Boolean resuelta) {
        List<Alerta> alertas = resuelta == null
                ? alertaRepository.findAll()
                : alertaRepository.findByResuelta(resuelta);
        return alertas.stream().map(AlertaDTO::from).toList();
    }

    @Override
    public AlertaDTO obtener(UUID id) {
        return alertaRepository.findById(id)
                .map(AlertaDTO::from)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Alerta no encontrada", id));
    }

    @Override
    public List<AlertaDTO> listarPorPila(UUID pilaId) {
        validarPilaExiste(pilaId);
        return alertaRepository.findByPilaId(pilaId)
                .stream()
                .map(AlertaDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public AlertaResolverResponseDTO resolver(UUID id) {
        Alerta alerta = alertaRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Alerta no encontrada", id));

        alerta.setResuelta(true);
        alerta.setResolvedAt(LocalDateTime.now());

        return AlertaResolverResponseDTO.from(alertaRepository.save(alerta));
    }

    private void validarPilaExiste(UUID pilaId) {
        if (!pilaRepository.existsById(pilaId)) {
            throw new ResourceNotFoundException("Pila", pilaId);
        }
    }
}

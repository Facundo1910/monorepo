package com.fertilar.service.service.impl;

import com.fertilar.service.dto.LecturaDTO;
import com.fertilar.service.dto.LecturaRequest;
import com.fertilar.service.entity.Lectura;
import com.fertilar.service.entity.Sensor;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.LecturaRepository;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.repository.SensorRepository;
import com.fertilar.service.service.AlertaEvaluacionService;
import com.fertilar.service.service.LecturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LecturaServiceImpl implements LecturaService {

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int DEFAULT_SENSOR_LIMIT = 100;
    private static final int MAX_SENSOR_LIMIT = 1000;

    private final LecturaRepository lecturaRepository;
    private final SensorRepository sensorRepository;
    private final PilaRepository pilaRepository;
    private final AlertaEvaluacionService alertaEvaluacionService;

    @Override
    @Transactional
    public LecturaDTO crear(LecturaRequest request) {
        Sensor sensor = sensorRepository.findById(request.getSensorId())
                .orElseThrow(() -> new ResourceNotFoundException("Sensor", request.getSensorId()));

        Lectura lectura = new Lectura();
        lectura.setSensor(sensor);
        lectura.setTemperatura(request.getTemperatura());
        lectura.setHumedad(request.getHumedad());
        lectura.setNitrogeno(request.getNitrogeno());
        lectura.setFosforo(request.getFosforo());
        lectura.setPotasio(request.getPotasio());
        lectura.setPh(request.getPh());
        lectura.setConductividad(request.getConductividad());
        lectura.setOxigeno(request.getOxigeno());
        lectura.setTimestamp(LocalDateTime.now());

        Lectura guardada = lecturaRepository.save(lectura);
        alertaEvaluacionService.evaluarLectura(guardada);
        return LecturaDTO.from(guardada);
    }

    @Override
    public Page<LecturaDTO> listar(int page, int size) {
        int pageSize = size > 0 ? size : DEFAULT_PAGE_SIZE;
        Pageable pageable = PageRequest.of(Math.max(page, 0), pageSize);
        return lecturaRepository.findAllByOrderByTimestampDesc(pageable)
                .map(LecturaDTO::from);
    }

    @Override
    public LecturaDTO obtener(UUID id) {
        return lecturaRepository.findById(id)
                .map(LecturaDTO::from)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Lectura no encontrada", id));
    }

    @Override
    public List<LecturaDTO> listarPorSensor(UUID sensorId, LocalDateTime desde, LocalDateTime hasta, Integer limit) {
        validarSensorExiste(sensorId);
        int effectiveLimit = limit != null && limit > 0
                ? Math.min(limit, MAX_SENSOR_LIMIT)
                : DEFAULT_SENSOR_LIMIT;
        Pageable pageable = PageRequest.of(0, effectiveLimit);

        Page<Lectura> page;
        if (desde != null && hasta != null) {
            page = lecturaRepository.findBySensorIdAndTimestampBetweenOrderByTimestampDesc(
                    sensorId, desde, hasta, pageable);
        } else if (desde != null) {
            page = lecturaRepository.findBySensorIdAndTimestampGreaterThanEqualOrderByTimestampDesc(
                    sensorId, desde, pageable);
        } else if (hasta != null) {
            page = lecturaRepository.findBySensorIdAndTimestampLessThanEqualOrderByTimestampDesc(
                    sensorId, hasta, pageable);
        } else {
            page = lecturaRepository.findBySensorIdOrderByTimestampDesc(sensorId, pageable);
        }

        return page.map(LecturaDTO::from).getContent();
    }

    @Override
    public List<LecturaDTO> listarPorPila(UUID pilaId, LocalDateTime desde, LocalDateTime hasta) {
        validarPilaExiste(pilaId);

        List<Lectura> lecturas;
        if (desde != null && hasta != null) {
            lecturas = lecturaRepository.findBySensor_Pila_IdAndTimestampBetweenOrderByTimestampDesc(
                    pilaId, desde, hasta);
        } else if (desde != null) {
            lecturas = lecturaRepository.findBySensor_Pila_IdAndTimestampGreaterThanEqualOrderByTimestampDesc(
                    pilaId, desde);
        } else if (hasta != null) {
            lecturas = lecturaRepository.findBySensor_Pila_IdAndTimestampLessThanEqualOrderByTimestampDesc(
                    pilaId, hasta);
        } else {
            lecturas = lecturaRepository.findBySensor_Pila_IdOrderByTimestampDesc(pilaId);
        }

        return lecturas.stream().map(LecturaDTO::from).toList();
    }

    private void validarSensorExiste(UUID sensorId) {
        if (!sensorRepository.existsById(sensorId)) {
            throw new ResourceNotFoundException("Sensor", sensorId);
        }
    }

    private void validarPilaExiste(UUID pilaId) {
        if (!pilaRepository.existsById(pilaId)) {
            throw new ResourceNotFoundException("Pila", pilaId);
        }
    }
}

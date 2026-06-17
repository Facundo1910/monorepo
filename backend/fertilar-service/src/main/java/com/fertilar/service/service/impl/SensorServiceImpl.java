package com.fertilar.service.service.impl;

import com.fertilar.service.dto.SensorDTO;
import com.fertilar.service.dto.SensorRequest;
import com.fertilar.service.dto.SensorResumenDTO;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.entity.Sensor;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.repository.SensorRepository;
import com.fertilar.service.service.SensorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SensorServiceImpl implements SensorService {

    private final SensorRepository sensorRepository;
    private final PilaRepository pilaRepository;

    @Override
    public List<SensorResumenDTO> listar() {
        return sensorRepository.findAll()
                .stream()
                .map(SensorResumenDTO::from)
                .toList();
    }

    @Override
    public List<SensorResumenDTO> listarPorPila(UUID pilaId) {
        validarPilaExiste(pilaId);
        return sensorRepository.findByPilaId(pilaId)
                .stream()
                .map(SensorResumenDTO::from)
                .toList();
    }

    @Override
    public SensorDTO obtener(UUID id) {
        return sensorRepository.findById(id)
                .map(SensorDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor", id));
    }

    @Override
    public SensorDTO crear(SensorRequest request) {
        Pila pila = obtenerPila(request.getPilaId());
        validarUnSensorPorPila(pila.getId(), null);

        Sensor sensor = new Sensor();
        sensor.setPila(pila);
        sensor.setCodigo(request.getCodigo());
        sensor.setTipo(request.getTipo());
        sensor.setDescripcion(request.getDescripcion());
        sensor.setActivo(request.getActivo());

        return SensorDTO.from(sensorRepository.save(sensor));
    }

    @Override
    public SensorDTO actualizar(UUID id, SensorRequest request) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor", id));

        Pila pila = obtenerPila(request.getPilaId());
        if (!pila.getId().equals(sensor.getPila().getId())) {
            validarUnSensorPorPila(pila.getId(), id);
        }

        sensor.setPila(pila);
        sensor.setCodigo(request.getCodigo());
        sensor.setTipo(request.getTipo());
        sensor.setDescripcion(request.getDescripcion());
        sensor.setActivo(request.getActivo());

        return SensorDTO.from(sensorRepository.save(sensor));
    }

    @Override
    public void eliminar(UUID id) {
        if (!sensorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sensor", id);
        }
        sensorRepository.deleteById(id);
    }

    private Pila obtenerPila(UUID pilaId) {
        return pilaRepository.findById(pilaId)
                .orElseThrow(() -> new ResourceNotFoundException("Pila", pilaId));
    }

    private void validarPilaExiste(UUID pilaId) {
        if (!pilaRepository.existsById(pilaId)) {
            throw new ResourceNotFoundException("Pila", pilaId);
        }
    }

    private void validarUnSensorPorPila(UUID pilaId, UUID sensorIdExcluido) {
        boolean yaTieneSensor = sensorRepository.findByPilaId(pilaId).stream()
                .anyMatch(sensor -> sensorIdExcluido == null || !sensor.getId().equals(sensorIdExcluido));
        if (yaTieneSensor) {
            throw new IllegalStateException("La pila ya tiene un sensor asignado");
        }
    }
}

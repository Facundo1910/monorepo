package com.fertilar.service.service.impl;

import com.fertilar.service.dto.CertificadoDTO;
import com.fertilar.service.dto.CertificadoRequest;
import com.fertilar.service.dto.EstadisticasLecturaDTO;
import com.fertilar.service.entity.Certificado;
import com.fertilar.service.entity.Lectura;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.entity.Usuario;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.CertificadoRepository;
import com.fertilar.service.repository.LecturaRepository;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.service.CertificadoService;
import com.fertilar.service.service.S3StorageService;
import com.fertilar.service.service.UsuarioAuthService;
import com.fertilar.service.util.CertificadoHtmlGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificadoServiceImpl implements CertificadoService {

    private final CertificadoRepository certificadoRepository;
    private final PilaRepository pilaRepository;
    private final LecturaRepository lecturaRepository;
    private final S3StorageService s3StorageService;
    private final UsuarioAuthService usuarioAuthService;

    @Override
    @Transactional
    public CertificadoDTO generar(UUID pilaId, CertificadoRequest request, String authHeader) {
        Usuario emisor = usuarioAuthService.requireRol(
                authHeader, Usuario.Rol.ADMIN, Usuario.Rol.ENCARGADO);

        Pila pila = pilaRepository.findById(pilaId)
                .orElseThrow(() -> new ResourceNotFoundException("Pila", pilaId));

        if (pila.getEstado() != Pila.Estado.FINALIZADA) {
            throw new IllegalStateException("La pila debe estar en estado FINALIZADA para emitir un certificado");
        }

        List<Lectura> lecturas = lecturaRepository.findBySensor_Pila_IdOrderByTimestampDesc(pilaId);
        if (lecturas.isEmpty()) {
            throw new IllegalStateException("La pila no tiene lecturas registradas");
        }

        EstadisticasLecturaDTO estadisticas = calcularEstadisticas(lecturas);
        String numero = generarNumero();
        LocalDate fechaEmision = LocalDate.now();
        String observaciones = request != null ? request.getObservaciones() : null;

        String html = CertificadoHtmlGenerator.generar(
                numero, pila, estadisticas, emisor, fechaEmision, observaciones);
        String urlDocumento = s3StorageService.subirCertificadoHtml(numero, html);

        Certificado certificado = new Certificado();
        certificado.setPila(pila);
        certificado.setUsuario(emisor);
        certificado.setNumero(numero);
        certificado.setFechaEmision(fechaEmision);
        certificado.setUrlDocumento(urlDocumento);
        certificado.setObservaciones(observaciones);

        return CertificadoDTO.from(certificadoRepository.save(certificado), estadisticas);
    }

    @Override
    public List<CertificadoDTO> listar() {
        return certificadoRepository.findAllByOrderByFechaEmisionDescCreatedAtDesc()
                .stream()
                .map(CertificadoDTO::from)
                .toList();
    }

    @Override
    public List<CertificadoDTO> listarPorPila(UUID pilaId) {
        validarPilaExiste(pilaId);
        return certificadoRepository.findByPilaId(pilaId)
                .stream()
                .map(CertificadoDTO::from)
                .toList();
    }

    @Override
    public CertificadoDTO obtener(UUID id) {
        return certificadoRepository.findById(id)
                .map(CertificadoDTO::from)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Certificado no encontrado", id));
    }

    @Override
    @Transactional
    public void eliminar(UUID id, String authHeader) {
        usuarioAuthService.requireRol(authHeader, Usuario.Rol.ADMIN, Usuario.Rol.ENCARGADO);

        Certificado certificado = certificadoRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.withMessage("Certificado no encontrado", id));

        s3StorageService.eliminarCertificado(certificado.getUrlDocumento());
        certificadoRepository.delete(certificado);
    }

    private EstadisticasLecturaDTO calcularEstadisticas(List<Lectura> lecturas) {
        BigDecimal sumTemp = BigDecimal.ZERO;
        BigDecimal sumHum = BigDecimal.ZERO;
        BigDecimal sumPh = BigDecimal.ZERO;
        int countTemp = 0;
        int countHum = 0;
        int countPh = 0;

        for (Lectura lectura : lecturas) {
            if (lectura.getTemperatura() != null) {
                sumTemp = sumTemp.add(lectura.getTemperatura());
                countTemp++;
            }
            if (lectura.getHumedad() != null) {
                sumHum = sumHum.add(lectura.getHumedad());
                countHum++;
            }
            if (lectura.getPh() != null) {
                sumPh = sumPh.add(lectura.getPh());
                countPh++;
            }
        }

        return EstadisticasLecturaDTO.builder()
                .temperaturaPromedio(promediar(sumTemp, countTemp))
                .humedadPromedio(promediar(sumHum, countHum))
                .phPromedio(promediar(sumPh, countPh))
                .cantidadLecturas(lecturas.size())
                .build();
    }

    private BigDecimal promediar(BigDecimal suma, int count) {
        if (count == 0) {
            return null;
        }
        return suma.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private String generarNumero() {
        int year = LocalDate.now().getYear();
        String patron = "CERT-" + year + "-%";
        int secuencia = certificadoRepository.findMaxNumeroLike(patron)
                .map(numero -> Integer.parseInt(numero.substring(numero.lastIndexOf('-') + 1)) + 1)
                .orElse(1);
        return String.format("CERT-%d-%04d", year, secuencia);
    }

    private void validarPilaExiste(UUID pilaId) {
        if (!pilaRepository.existsById(pilaId)) {
            throw new ResourceNotFoundException("Pila", pilaId);
        }
    }
}

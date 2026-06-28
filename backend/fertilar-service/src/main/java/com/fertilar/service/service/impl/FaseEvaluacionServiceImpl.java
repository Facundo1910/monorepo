package com.fertilar.service.service.impl;

import com.fertilar.service.dto.PilaFasesDTO;
import com.fertilar.service.entity.Lectura;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.LecturaRepository;
import com.fertilar.service.repository.PilaRepository;
import com.fertilar.service.service.FaseEvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaseEvaluacionServiceImpl implements FaseEvaluacionService {

    private static final ZoneId ZONE = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final BigDecimal TEMP_MESOFILA = new BigDecimal("45");
    private static final BigDecimal TEMP_TERMOFILA = new BigDecimal("55");
    private static final BigDecimal TEMP_ENFRIAMIENTO = new BigDecimal("40");
    private static final int DIAS_TERMOFILA_REQUERIDOS = 3;

    private final PilaRepository pilaRepository;
    private final LecturaRepository lecturaRepository;

    @Override
    public PilaFasesDTO evaluar(UUID pilaId) {
        Pila pila = pilaRepository.findById(pilaId)
                .orElseThrow(() -> new ResourceNotFoundException("Pila", pilaId));

        List<Lectura> lecturas = lecturaRepository.findBySensor_Pila_IdOrderByTimestampDesc(pilaId);
        List<Lectura> asc = lecturas.stream()
                .sorted(Comparator.comparing(Lectura::getTimestamp))
                .toList();

        LocalDate hoy = LocalDate.now(ZONE);
        int diasEstimados = pila.getDiasEstimados() != null ? pila.getDiasEstimados() : 90;
        int diasTranscurridos = (int) Math.max(0, ChronoUnit.DAYS.between(pila.getFechaInicio(), hoy));

        Map<LocalDate, BigDecimal> promediosDiarios = calcularPromediosDiarios(asc);

        PilaFasesDTO.FaseMesofila mesofila = evaluarMesofila(asc);
        TermofilaResult termofilaResult = evaluarTermofila(promediosDiarios);
        PilaFasesDTO.FaseEnfriamiento enfriamiento = evaluarEnfriamiento(asc, termofilaResult);
        PilaFasesDTO.FaseMaduracion maduracion = evaluarMaduracion(pila, hoy, diasEstimados);

        boolean apto = mesofila.isCompletada()
                && termofilaResult.fase().isCompletada()
                && enfriamiento.isCompletada()
                && maduracion.isCompletada();

        return PilaFasesDTO.builder()
                .pilaId(pilaId)
                .diasTranscurridos(diasTranscurridos)
                .diasEstimados(diasEstimados)
                .fases(PilaFasesDTO.FasesDetalle.builder()
                        .mesofila(mesofila)
                        .termofila(termofilaResult.fase())
                        .enfriamiento(enfriamiento)
                        .maduracion(maduracion)
                        .build())
                .aptoParaCertificar(apto)
                .motivoNoCertificable(apto ? null : construirMotivoNoCertificable(
                        mesofila, termofilaResult.fase(), enfriamiento, maduracion))
                .build();
    }

    private Map<LocalDate, BigDecimal> calcularPromediosDiarios(List<Lectura> lecturas) {
        Map<LocalDate, List<BigDecimal>> porDia = new HashMap<>();
        for (Lectura lectura : lecturas) {
            if (lectura.getTemperatura() == null) {
                continue;
            }
            LocalDate dia = lectura.getTimestamp().atZone(ZONE).toLocalDate();
            porDia.computeIfAbsent(dia, d -> new ArrayList<>()).add(lectura.getTemperatura());
        }

        Map<LocalDate, BigDecimal> promedios = new HashMap<>();
        for (Map.Entry<LocalDate, List<BigDecimal>> entry : porDia.entrySet()) {
            BigDecimal suma = entry.getValue().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            promedios.put(
                    entry.getKey(),
                    suma.divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP));
        }
        return promedios;
    }

    private PilaFasesDTO.FaseMesofila evaluarMesofila(List<Lectura> lecturas) {
        BigDecimal max = lecturas.stream()
                .map(Lectura::getTemperatura)
                .filter(t -> t != null)
                .max(BigDecimal::compareTo)
                .orElse(null);

        boolean completada = max != null && max.compareTo(TEMP_MESOFILA) > 0;
        return PilaFasesDTO.FaseMesofila.builder()
                .completada(completada)
                .descripcion(completada
                        ? "Temperatura superó 45°C"
                        : "Aún no se registró temperatura superior a 45°C")
                .temperaturaMax(max != null ? max.setScale(1, RoundingMode.HALF_UP) : null)
                .build();
    }

    private TermofilaResult evaluarTermofila(Map<LocalDate, BigDecimal> promediosDiarios) {
        List<LocalDate> diasOrdenados = promediosDiarios.keySet().stream().sorted().toList();

        int rachaActual = 0;
        int maxRacha = 0;
        LocalDate finPrimeraRachaValida = null;
        boolean rachaValidaCerrada = false;

        for (LocalDate dia : diasOrdenados) {
            BigDecimal promedio = promediosDiarios.get(dia);
            if (promedio.compareTo(TEMP_TERMOFILA) > 0) {
                rachaActual++;
                maxRacha = Math.max(maxRacha, rachaActual);
                if (rachaActual >= DIAS_TERMOFILA_REQUERIDOS && !rachaValidaCerrada) {
                    finPrimeraRachaValida = dia;
                }
            } else {
                if (rachaActual >= DIAS_TERMOFILA_REQUERIDOS) {
                    rachaValidaCerrada = true;
                }
                rachaActual = 0;
            }
        }

        boolean completada = maxRacha >= DIAS_TERMOFILA_REQUERIDOS;
        return new TermofilaResult(
                PilaFasesDTO.FaseTermofila.builder()
                        .completada(completada)
                        .descripcion(completada
                                ? "Superó 55°C por 3 días consecutivos (Resolución N°29/2017)"
                                : "Se requieren 3 días consecutivos con promedio > 55°C (Resolución N°29/2017)")
                        .diasSobre55(maxRacha > 0 ? maxRacha : null)
                        .build(),
                finPrimeraRachaValida);
    }

    private PilaFasesDTO.FaseEnfriamiento evaluarEnfriamiento(
            List<Lectura> lecturas,
            TermofilaResult termofila) {

        BigDecimal tempActual = lecturas.stream()
                .filter(l -> l.getTemperatura() != null)
                .max(Comparator.comparing(Lectura::getTimestamp))
                .map(l -> l.getTemperatura().setScale(1, RoundingMode.HALF_UP))
                .orElse(null);

        if (!termofila.fase().isCompletada() || termofila.finRacha() == null) {
            return PilaFasesDTO.FaseEnfriamiento.builder()
                    .completada(false)
                    .descripcion(termofila.fase().isCompletada()
                            ? "Temperatura aún no bajó de 40°C"
                            : "Pendiente de completar la fase termófila")
                    .temperaturaActual(tempActual)
                    .build();
        }

        boolean enfriamiento = lecturas.stream()
                .filter(l -> l.getTemperatura() != null)
                .anyMatch(l -> {
                    LocalDate dia = l.getTimestamp().atZone(ZONE).toLocalDate();
                    return dia.isAfter(termofila.finRacha())
                            && l.getTemperatura().compareTo(TEMP_ENFRIAMIENTO) < 0;
                });

        return PilaFasesDTO.FaseEnfriamiento.builder()
                .completada(enfriamiento)
                .descripcion(enfriamiento
                        ? "Temperatura bajó por debajo de 40°C"
                        : "Temperatura aún no bajó de 40°C")
                .temperaturaActual(tempActual)
                .build();
    }

    private PilaFasesDTO.FaseMaduracion evaluarMaduracion(Pila pila, LocalDate hoy, int diasEstimados) {
        LocalDate finProceso = pila.getFechaInicio().plusDays(diasEstimados);
        boolean completada = !hoy.isBefore(finProceso);
        int diasRestantes = completada
                ? 0
                : (int) ChronoUnit.DAYS.between(hoy, finProceso);

        return PilaFasesDTO.FaseMaduracion.builder()
                .completada(completada)
                .descripcion(completada
                        ? "Proceso completó los " + diasEstimados + " días"
                        : "Faltan " + diasRestantes + " días para completar los "
                                + diasEstimados + " días del proceso")
                .diasRestantes(completada ? null : diasRestantes)
                .build();
    }

    private String construirMotivoNoCertificable(
            PilaFasesDTO.FaseMesofila mesofila,
            PilaFasesDTO.FaseTermofila termofila,
            PilaFasesDTO.FaseEnfriamiento enfriamiento,
            PilaFasesDTO.FaseMaduracion maduracion) {

        List<String> pendientes = new ArrayList<>();
        if (!mesofila.isCompletada()) {
            pendientes.add("mesófila");
        }
        if (!termofila.isCompletada()) {
            pendientes.add("termófila");
        }
        if (!enfriamiento.isCompletada()) {
            pendientes.add("enfriamiento");
        }
        if (!maduracion.isCompletada()) {
            pendientes.add("maduración");
        }

        if (pendientes.isEmpty()) {
            return null;
        }
        if (pendientes.size() == 1) {
            return "Fase de " + pendientes.get(0) + " no completada";
        }
        String ultima = pendientes.remove(pendientes.size() - 1);
        return "Fases de " + String.join(", ", pendientes) + " y " + ultima + " no completadas";
    }

    private record TermofilaResult(PilaFasesDTO.FaseTermofila fase, LocalDate finRacha) {}
}

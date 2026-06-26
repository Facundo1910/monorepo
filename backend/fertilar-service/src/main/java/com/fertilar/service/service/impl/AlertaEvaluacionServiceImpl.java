package com.fertilar.service.service.impl;

import com.fertilar.service.entity.Alerta;
import com.fertilar.service.entity.Lectura;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.entity.Umbral;
import com.fertilar.service.repository.AlertaRepository;
import com.fertilar.service.repository.UmbralRepository;
import com.fertilar.service.service.AlertaEvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AlertaEvaluacionServiceImpl implements AlertaEvaluacionService {

    private final AlertaRepository alertaRepository;
    private final UmbralRepository umbralRepository;

    @Override
    public void evaluarLectura(Lectura lectura) {
        Pila pila = lectura.getSensor().getPila();
        List<Umbral> umbrales = umbralRepository.findByPilaIdAndActivoTrueOrderByParametroAscCreatedAtAsc(pila.getId());
        if (umbrales.isEmpty()) {
            return;
        }

        List<Alerta> alertas = new ArrayList<>();
        for (Umbral umbral : umbrales) {
            evaluarUmbral(lectura, pila, umbral, alertas);
        }

        if (!alertas.isEmpty()) {
            alertaRepository.saveAll(alertas);
        }
    }

    private void evaluarUmbral(Lectura lectura, Pila pila, Umbral umbral, List<Alerta> alertas) {
        BigDecimal valor = obtenerValor(lectura, umbral.getParametro());
        if (valor == null) {
            return;
        }

        String nombreParametro = nombreParametro(umbral.getParametro());
        String unidad = unidad(umbral.getParametro());

        if (umbral.getValorMin() != null && umbral.getValorMax() != null) {
            if (valor.compareTo(umbral.getValorMin()) < 0) {
                alertas.add(crearAlerta(lectura, pila, umbral.getParametro().name(),
                        formatearMensajeBajoMinimo(nombreParametro, valor, unidad, umbral.getValorMin()),
                        umbral.getNivel()));
            } else if (valor.compareTo(umbral.getValorMax()) > 0) {
                alertas.add(crearAlerta(lectura, pila, umbral.getParametro().name(),
                        formatearMensajeSobreMaximo(nombreParametro, valor, unidad, umbral.getValorMax()),
                        umbral.getNivel()));
            }
            return;
        }

        if (umbral.getValorMin() != null && valor.compareTo(umbral.getValorMin()) < 0) {
            alertas.add(crearAlerta(lectura, pila, umbral.getParametro().name(),
                    formatearMensajeBajoMinimo(nombreParametro, valor, unidad, umbral.getValorMin()),
                    umbral.getNivel()));
        }

        if (umbral.getValorMax() != null && valor.compareTo(umbral.getValorMax()) > 0) {
            alertas.add(crearAlerta(lectura, pila, umbral.getParametro().name(),
                    formatearMensajeSobreMaximo(nombreParametro, valor, unidad, umbral.getValorMax()),
                    umbral.getNivel()));
        }
    }

    private BigDecimal obtenerValor(Lectura lectura, Umbral.Parametro parametro) {
        return switch (parametro) {
            case TEMPERATURA -> lectura.getTemperatura();
            case HUMEDAD -> lectura.getHumedad();
            case PH -> lectura.getPh();
            case CONDUCTIVIDAD -> lectura.getConductividad();
            case NITROGENO -> lectura.getNitrogeno();
            case FOSFORO -> lectura.getFosforo();
            case POTASIO -> lectura.getPotasio();
        };
    }

    private String nombreParametro(Umbral.Parametro parametro) {
        return switch (parametro) {
            case TEMPERATURA -> "Temperatura";
            case HUMEDAD -> "Humedad";
            case PH -> "pH";
            case CONDUCTIVIDAD -> "Conductividad";
            case NITROGENO -> "Nitrógeno";
            case FOSFORO -> "Fósforo";
            case POTASIO -> "Potasio";
        };
    }

    private String unidad(Umbral.Parametro parametro) {
        return switch (parametro) {
            case TEMPERATURA -> "°C";
            case HUMEDAD -> "%";
            default -> "";
        };
    }

    private String formatearMensajeBajoMinimo(String nombre, BigDecimal valor, String unidad, BigDecimal minimo) {
        return String.format("%s %.2f%s está por debajo del mínimo de %s%s",
                nombre, valor, unidad, minimo.stripTrailingZeros().toPlainString(), unidad);
    }

    private String formatearMensajeSobreMaximo(String nombre, BigDecimal valor, String unidad, BigDecimal maximo) {
        return String.format("%s %.2f%s supera el máximo de %s%s",
                nombre, valor, unidad, maximo.stripTrailingZeros().toPlainString(), unidad);
    }

    private Alerta crearAlerta(Lectura lectura, Pila pila, String tipo, String mensaje, Alerta.Nivel nivel) {
        Alerta alerta = new Alerta();
        alerta.setLectura(lectura);
        alerta.setPila(pila);
        alerta.setTipo(tipo);
        alerta.setMensaje(mensaje);
        alerta.setNivel(nivel);
        return alerta;
    }
}

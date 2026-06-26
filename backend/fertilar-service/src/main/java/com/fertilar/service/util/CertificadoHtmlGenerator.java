package com.fertilar.service.util;

import com.fertilar.service.dto.EstadisticasLecturaDTO;
import com.fertilar.service.entity.Pila;
import com.fertilar.service.entity.Usuario;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class CertificadoHtmlGenerator {

    private static final String ESTABLECIMIENTO = "Avícola El Quebrachal";
    private static final DateTimeFormatter FECHA_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private CertificadoHtmlGenerator() {}

    public static String generar(
            String numero,
            Pila pila,
            EstadisticasLecturaDTO estadisticas,
            Usuario emisor,
            LocalDate fechaEmision,
            String observaciones) {

        String emisorNombre = emisor.getNombre() + " " + emisor.getApellido();
        String fechaInicio = formatearFecha(pila.getFechaInicio());
        String fechaFin = formatearFecha(pila.getFechaFin());
        String fechaEmisionStr = formatearFecha(fechaEmision);
        String observacionesHtml = observaciones != null && !observaciones.isBlank()
                ? escapeHtml(observaciones)
                : "Sin observaciones";

        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Certificado %s - FertilAR</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: Georgia, 'Times New Roman', serif;
                            background: #f4f7f4;
                            color: #1a3320;
                            padding: 40px 20px;
                        }
                        .certificado {
                            max-width: 820px;
                            margin: 0 auto;
                            background: #fff;
                            border: 3px solid #2d6a4f;
                            border-radius: 8px;
                            padding: 48px 56px;
                            box-shadow: 0 8px 32px rgba(45, 106, 79, 0.15);
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #40916c;
                            padding-bottom: 24px;
                            margin-bottom: 32px;
                        }
                        .logo {
                            font-size: 2.4rem;
                            font-weight: bold;
                            color: #2d6a4f;
                            letter-spacing: 2px;
                        }
                        .logo span { color: #52b788; }
                        .subtitulo {
                            margin-top: 8px;
                            font-size: 0.95rem;
                            color: #52796f;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                        }
                        .establecimiento {
                            margin-top: 12px;
                            font-size: 1.1rem;
                            color: #1b4332;
                        }
                        .titulo-cert {
                            text-align: center;
                            font-size: 1.5rem;
                            color: #2d6a4f;
                            margin-bottom: 8px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        .numero {
                            text-align: center;
                            font-size: 1rem;
                            color: #52796f;
                            margin-bottom: 32px;
                        }
                        .seccion { margin-bottom: 24px; }
                        .seccion h3 {
                            font-size: 0.85rem;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            color: #40916c;
                            margin-bottom: 12px;
                            border-bottom: 1px solid #d8f3dc;
                            padding-bottom: 4px;
                        }
                        .grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 12px 24px;
                        }
                        .campo label {
                            display: block;
                            font-size: 0.75rem;
                            text-transform: uppercase;
                            color: #52796f;
                            letter-spacing: 0.5px;
                        }
                        .campo span {
                            font-size: 1rem;
                            color: #1a3320;
                        }
                        .metricas {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 16px;
                            text-align: center;
                        }
                        .metrica {
                            background: #f1faee;
                            border: 1px solid #b7e4c7;
                            border-radius: 6px;
                            padding: 16px 8px;
                        }
                        .metrica .valor {
                            font-size: 1.6rem;
                            font-weight: bold;
                            color: #2d6a4f;
                        }
                        .metrica .unidad {
                            font-size: 0.85rem;
                            color: #52796f;
                        }
                        .metrica .nombre {
                            font-size: 0.75rem;
                            text-transform: uppercase;
                            color: #40916c;
                            margin-top: 4px;
                        }
                        .observaciones {
                            background: #f8fdf9;
                            border-left: 4px solid #52b788;
                            padding: 12px 16px;
                            font-style: italic;
                            color: #344e41;
                            line-height: 1.5;
                        }
                        .footer {
                            margin-top: 40px;
                            padding-top: 24px;
                            border-top: 2px solid #d8f3dc;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 16px;
                        }
                        .firma label {
                            display: block;
                            font-size: 0.75rem;
                            text-transform: uppercase;
                            color: #52796f;
                        }
                        .firma span { font-size: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="certificado">
                        <div class="header">
                            <div class="logo">Fertil<span>AR</span></div>
                            <div class="subtitulo">Sistema de Telemetría y Trazabilidad</div>
                            <div class="establecimiento">%s</div>
                        </div>

                        <div class="titulo-cert">Certificado de Compostaje</div>
                        <div class="numero">N° %s</div>

                        <div class="seccion">
                            <h3>Información del proceso</h3>
                            <div class="grid">
                                <div class="campo">
                                    <label>Pila</label>
                                    <span>%s</span>
                                </div>
                                <div class="campo">
                                    <label>Ubicación</label>
                                    <span>%s</span>
                                </div>
                                <div class="campo">
                                    <label>Fecha de inicio</label>
                                    <span>%s</span>
                                </div>
                                <div class="campo">
                                    <label>Fecha de finalización</label>
                                    <span>%s</span>
                                </div>
                            </div>
                        </div>

                        <div class="seccion">
                            <h3>Promedios del proceso (%d lecturas)</h3>
                            <div class="metricas">
                                <div class="metrica">
                                    <div class="valor">%s</div>
                                    <div class="unidad">°C</div>
                                    <div class="nombre">Temperatura</div>
                                </div>
                                <div class="metrica">
                                    <div class="valor">%s</div>
                                    <div class="unidad">%%</div>
                                    <div class="nombre">Humedad</div>
                                </div>
                                <div class="metrica">
                                    <div class="valor">%s</div>
                                    <div class="unidad"></div>
                                    <div class="nombre">pH</div>
                                </div>
                            </div>
                        </div>

                        <div class="seccion">
                            <h3>Observaciones</h3>
                            <div class="observaciones">%s</div>
                        </div>

                        <div class="footer">
                            <div class="firma">
                                <label>Emitido por</label>
                                <span>%s</span>
                            </div>
                            <div class="firma">
                                <label>Fecha de emisión</label>
                                <span>%s</span>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                numero,
                ESTABLECIMIENTO,
                numero,
                escapeHtml(pila.getNombre()),
                escapeHtml(pila.getUbicacion() != null ? pila.getUbicacion() : "—"),
                fechaInicio,
                fechaFin,
                estadisticas.getCantidadLecturas(),
                formatearDecimal(estadisticas.getTemperaturaPromedio()),
                formatearDecimal(estadisticas.getHumedadPromedio()),
                formatearDecimal(estadisticas.getPhPromedio()),
                observacionesHtml,
                escapeHtml(emisorNombre),
                fechaEmisionStr
        );
    }

    private static String formatearFecha(LocalDate fecha) {
        return fecha != null ? fecha.format(FECHA_FORMAT) : "—";
    }

    private static String formatearDecimal(BigDecimal valor) {
        if (valor == null) {
            return "—";
        }
        return valor.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}

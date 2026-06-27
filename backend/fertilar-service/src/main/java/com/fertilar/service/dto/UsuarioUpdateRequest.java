package com.fertilar.service.dto;

import com.fertilar.service.entity.Usuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioUpdateRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellido;

    @NotNull
    private Usuario.Rol rol;

    @NotNull
    private Boolean activo;
}

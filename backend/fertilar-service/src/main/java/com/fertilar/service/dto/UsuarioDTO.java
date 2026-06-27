package com.fertilar.service.dto;

import com.fertilar.service.entity.Usuario;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UsuarioDTO {

    private UUID id;
    private String email;
    private String nombre;
    private String apellido;
    private Usuario.Rol rol;
    private Boolean activo;

    public static UsuarioDTO from(Usuario usuario) {
        return UsuarioDTO.builder()
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .rol(usuario.getRol())
                .activo(usuario.getActivo())
                .build();
    }
}

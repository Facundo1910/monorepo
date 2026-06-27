package com.fertilar.service.service.impl;

import com.fertilar.service.entity.Usuario;
import com.fertilar.service.exception.AccessDeniedException;
import com.fertilar.service.exception.UnauthorizedException;
import com.fertilar.service.repository.UsuarioRepository;
import com.fertilar.service.service.UsuarioAuthService;
import com.fertilar.service.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class UsuarioAuthServiceImpl implements UsuarioAuthService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public Usuario obtenerUsuarioAutenticado(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Token de autorización requerido");
        }

        String token = authHeader.replace("Bearer ", "").trim();
        String payload;
        try {
            payload = JwtUtil.decodePayload(token);
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Token inválido");
        }
        String sub = JwtUtil.getClaim(payload, "sub");
        if (sub == null) {
            throw new UnauthorizedException("Token inválido");
        }

        return usuarioRepository.findByCognitoSub(sub)
                .map(usuario -> {
                    if (!Boolean.TRUE.equals(usuario.getActivo())) {
                        throw new AccessDeniedException("Usuario desactivado");
                    }
                    return usuario;
                })
                .orElseThrow(() -> new UnauthorizedException("Usuario no registrado"));
    }

    @Override
    public Usuario requireRol(String authHeader, Usuario.Rol... roles) {
        Usuario usuario = obtenerUsuarioAutenticado(authHeader);
        boolean autorizado = Arrays.stream(roles).anyMatch(rol -> usuario.getRol() == rol);
        if (!autorizado) {
            throw new AccessDeniedException("No tiene permisos para realizar esta acción");
        }
        return usuario;
    }
}

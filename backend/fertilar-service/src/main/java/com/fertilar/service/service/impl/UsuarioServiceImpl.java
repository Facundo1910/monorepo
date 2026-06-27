package com.fertilar.service.service.impl;

import com.fertilar.service.dto.UsuarioCreateRequest;
import com.fertilar.service.dto.UsuarioDTO;
import com.fertilar.service.dto.UsuarioUpdateRequest;
import com.fertilar.service.entity.Usuario;
import com.fertilar.service.exception.ResourceNotFoundException;
import com.fertilar.service.repository.UsuarioRepository;
import com.fertilar.service.service.CognitoUserService;
import com.fertilar.service.service.UsuarioAuthService;
import com.fertilar.service.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UsernameExistsException;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioAuthService usuarioAuthService;
    private final CognitoUserService cognitoUserService;

    @Override
    public List<UsuarioDTO> listar(String authHeader) {
        requireAdmin(authHeader);
        return usuarioRepository.findAllByOrderByApellidoAscNombreAsc()
                .stream()
                .map(UsuarioDTO::from)
                .toList();
    }

    @Override
    public UsuarioDTO obtener(UUID id, String authHeader) {
        requireAdmin(authHeader);
        return usuarioRepository.findById(id)
                .map(UsuarioDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
    }

    @Override
    @Transactional
    public UsuarioDTO crear(UsuarioCreateRequest request, String authHeader) {
        requireAdmin(authHeader);

        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }

        String contrasenaTemporal = request.getContrasenaTemporal();
        if (contrasenaTemporal == null || contrasenaTemporal.isBlank()) {
            contrasenaTemporal = generarContrasenaTemporal();
        } else {
            validarContrasenaCognito(contrasenaTemporal);
        }

        String cognitoSub;
        try {
            cognitoSub = cognitoUserService.crearUsuario(
                    request.getEmail(),
                    request.getNombre(),
                    request.getApellido(),
                    contrasenaTemporal);
        } catch (UsernameExistsException ex) {
            throw new IllegalArgumentException("Ya existe un usuario en Cognito con ese email");
        } catch (CognitoIdentityProviderException ex) {
            throw new IllegalStateException("No se pudo crear el usuario en Cognito: "
                    + ex.awsErrorDetails().errorMessage());
        }

        Usuario usuario = new Usuario();
        usuario.setCognitoSub(cognitoSub);
        usuario.setEmail(request.getEmail());
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setRol(request.getRol());
        usuario.setActivo(true);

        return UsuarioDTO.from(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional
    public UsuarioDTO actualizar(UUID id, UsuarioUpdateRequest request, String authHeader) {
        Usuario admin = requireAdmin(authHeader);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));

        if (admin.getId().equals(id) && Boolean.FALSE.equals(request.getActivo())) {
            throw new IllegalArgumentException("No podés desactivar tu propio usuario");
        }

        if (admin.getId().equals(id) && request.getRol() != Usuario.Rol.ADMIN) {
            throw new IllegalArgumentException("No podés quitarte el rol de administrador");
        }

        boolean activoAnterior = usuario.getActivo();
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setRol(request.getRol());
        usuario.setActivo(request.getActivo());

        if (activoAnterior != request.getActivo()) {
            sincronizarEstadoCognito(usuario, request.getActivo());
        }

        return UsuarioDTO.from(usuarioRepository.save(usuario));
    }

    private Usuario requireAdmin(String authHeader) {
        return usuarioAuthService.requireRol(authHeader, Usuario.Rol.ADMIN);
    }

    private void sincronizarEstadoCognito(Usuario usuario, boolean activo) {
        try {
            if (activo) {
                cognitoUserService.activarUsuario(usuario.getEmail());
            } else {
                cognitoUserService.desactivarUsuario(usuario.getEmail());
            }
        } catch (CognitoIdentityProviderException ex) {
            throw new IllegalStateException("No se pudo actualizar el usuario en Cognito: "
                    + ex.awsErrorDetails().errorMessage());
        }
    }

    private static final String TEMP_PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String TEMP_PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String TEMP_PASSWORD_DIGITS = "23456789";
    private static final String TEMP_PASSWORD_SPECIAL = "!@#$%";

    private String generarContrasenaTemporal() {
        SecureRandom random = new SecureRandom();
        String all = TEMP_PASSWORD_UPPER + TEMP_PASSWORD_LOWER + TEMP_PASSWORD_DIGITS + TEMP_PASSWORD_SPECIAL;
        StringBuilder password = new StringBuilder(14);
        password.append(pickRandomChar(random, TEMP_PASSWORD_UPPER));
        password.append(pickRandomChar(random, TEMP_PASSWORD_LOWER));
        password.append(pickRandomChar(random, TEMP_PASSWORD_DIGITS));
        password.append(pickRandomChar(random, TEMP_PASSWORD_SPECIAL));
        for (int i = 0; i < 10; i++) {
            password.append(pickRandomChar(random, all));
        }
        return shuffle(password.toString(), random);
    }

    private void validarContrasenaCognito(String password) {
        if (password.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }
        if (password.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos un número");
        }
        if (password.chars().noneMatch(Character::isUpperCase)) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos una mayúscula");
        }
        if (password.chars().noneMatch(Character::isLowerCase)) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos una minúscula");
        }
        if (password.chars().noneMatch(ch -> !Character.isLetterOrDigit(ch))) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos un carácter especial");
        }
    }

    private char pickRandomChar(SecureRandom random, String chars) {
        return chars.charAt(random.nextInt(chars.length()));
    }

    private String shuffle(String input, SecureRandom random) {
        char[] chars = input.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return new String(chars);
    }
}

package com.fertilar.service.exception;

public class ResourceNotFoundException extends RuntimeException {

    private final String recurso;
    private final Object id;

    public ResourceNotFoundException(String recurso, Object id) {
        super(recurso + " no encontrado/a");
        this.recurso = recurso;
        this.id = id;
    }

    public static ResourceNotFoundException withMessage(String message, Object id) {
        return new ResourceNotFoundException(message, id, true);
    }

    private ResourceNotFoundException(String message, Object id, boolean exactMessage) {
        super(message);
        this.recurso = message;
        this.id = id;
    }

    public String getRecurso() { return recurso; }
    public Object getId() { return id; }
}

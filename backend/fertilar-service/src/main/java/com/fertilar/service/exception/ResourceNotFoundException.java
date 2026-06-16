package com.fertilar.service.exception;

public class ResourceNotFoundException extends RuntimeException {

    private final String recurso;
    private final Object id;

    public ResourceNotFoundException(String recurso, Object id) {
        super(recurso + " no encontrado/a");
        this.recurso = recurso;
        this.id = id;
    }

    public String getRecurso() { return recurso; }
    public Object getId() { return id; }
}

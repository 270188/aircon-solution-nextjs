package pe.airconsolution.api.common;

/** Regla de negocio incumplida (horario lleno, fecha no válida, etc.). Se responde con 409. */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}

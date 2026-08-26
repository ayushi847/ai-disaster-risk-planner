package com.sih.disaster.exception;

/** Thrown for state conflicts, e.g. approving an already-decided decision. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}

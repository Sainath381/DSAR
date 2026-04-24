package com.dsar.portal.audit;

public final class AuditAction {
    public static final String LOGIN_SUCCESS     = "LOGIN_SUCCESS";
    public static final String LOGIN_FAILURE     = "LOGIN_FAILURE";
    public static final String USER_SEEDED       = "USER_SEEDED";
    public static final String REQUEST_CREATED   = "REQUEST_CREATED";
    public static final String STATUS_CHANGED    = "STATUS_CHANGED";
    public static final String ACTION_EXECUTED   = "ACTION_EXECUTED";
    public static final String RECORD_ACCESSED   = "RECORD_ACCESSED";

    private AuditAction() {}
}

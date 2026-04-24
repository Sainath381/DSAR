package com.dsar.portal.request;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DsarRequestRepository extends JpaRepository<DsarRequest, UUID> {

    List<DsarRequest> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);

    Optional<DsarRequest> findByIdAndRequesterId(UUID id, UUID requesterId);

    @Query("""
           select r from DsarRequest r
           where (:type is null or r.type = :type)
             and (:status is null or r.status = :status)
           order by r.slaDueAt asc
           """)
    Page<DsarRequest> search(@Param("type") DsarType type,
                             @Param("status") DsarStatus status,
                             Pageable pageable);
}

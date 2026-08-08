package de.regioit.abfall.api.monitoring

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.Timestamp
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Repository
class MonitoringRepository(
    private val jdbc: JdbcClient,
) {
    fun statistics(
        today: LocalDate,
        now: Instant,
        cutoff: Instant,
    ): MonitoringStatistics =
        MonitoringStatistics(
            upcomingCollectionEvents = count("select count(*) from collection_event where effective_date >= :today", "today", today),
            outdatedCollectionEvents = count("select count(*) from collection_event where effective_date < :today", "today", today),
            activeNotices =
                count(
                    "select count(*) from notice where valid_from <= :value and valid_until >= :value",
                    "value",
                    Timestamp.from(now),
                ),
            expiredNotices = count("select count(*) from notice where valid_until < :value", "value", Timestamp.from(now)),
            openCases =
                scalar(
                    "select count(*) from case_record where public_status not in ('completed', 'rejected', 'closed')",
                ),
            completedCases =
                scalar(
                    "select count(*) from case_record where public_status in ('completed', 'rejected', 'closed')",
                ),
            pendingOutboxEvents = scalar("select count(*) from outbox_event where published_at is null"),
            failedOutboxEvents =
                scalar(
                    "select count(*) from outbox_event where published_at is null and attempt_count > 0",
                ),
            completedRecyclingAccessRequests =
                scalar(
                    "select count(*) from recycling_access_request where access_status = 'completed'",
                ),
            cleanupCandidates = cleanupCandidates(cutoff),
        )

    fun cleanupCandidates(cutoff: Instant): Int =
        count(
            "select count(*) from outbox_event where published_at is not null and published_at < :cutoff",
            "cutoff",
            Timestamp.from(cutoff),
        ) +
            count(
                "select count(*) from idempotency_record where created_at < :cutoff",
                "cutoff",
                Timestamp.from(cutoff),
            ) +
            count(
                "select count(*) from recycling_access_idempotency where created_at < :cutoff",
                "cutoff",
                Timestamp.from(cutoff),
            )

    fun deletePublishedOutboxEvents(cutoff: Instant): Int =
        delete(
            "delete from outbox_event where published_at is not null and published_at < :cutoff",
            cutoff,
        )

    fun deleteCaseIdempotencyRecords(cutoff: Instant): Int = delete("delete from idempotency_record where created_at < :cutoff", cutoff)

    fun deleteAccessIdempotencyRecords(cutoff: Instant): Int =
        delete("delete from recycling_access_idempotency where created_at < :cutoff", cutoff)

    fun findRecentQualityAgentAccess(
        reference: String,
        syntheticCredential: String,
        earliestCreatedAt: Instant,
    ): QualityAgentAccessCandidate? =
        jdbc
            .sql(
                """
                select id, public_reference
                from recycling_access_request
                where public_reference = :reference
                  and tenant_id = 'demo'
                  and identification_method = 'license-plate'
                  and credential_hint = :syntheticCredential
                  and credential_hint like 'DEMO-QA-%'
                  and created_at >= :earliestCreatedAt
                for update
                """.trimIndent(),
            ).param("reference", reference)
            .param("syntheticCredential", syntheticCredential)
            .param("earliestCreatedAt", Timestamp.from(earliestCreatedAt))
            .query { rs, _ ->
                QualityAgentAccessCandidate(
                    id = rs.getString("id"),
                    reference = rs.getString("public_reference"),
                )
            }.optional()
            .orElse(null)

    fun deleteQualityAgentAccessIdempotency(requestId: String): Int =
        jdbc
            .sql("delete from recycling_access_idempotency where access_request_id = :requestId")
            .param("requestId", requestId)
            .update()

    fun deleteQualityAgentAccessEvents(requestId: String): Int =
        jdbc
            .sql("delete from recycling_access_event where access_request_id = :requestId")
            .param("requestId", requestId)
            .update()

    fun deleteQualityAgentAccessRequest(requestId: String): Int =
        jdbc
            .sql("delete from recycling_access_request where id = :requestId")
            .param("requestId", requestId)
            .update()

    fun save(result: MaintenanceResult) {
        jdbc
            .sql(
                """
                insert into quality_maintenance_run
                    (id, executed_at, cutoff_at, status, candidate_count,
                     deleted_outbox_events, deleted_case_idempotency_records,
                     deleted_access_idempotency_records, finding)
                values
                    (:id, :executedAt, :cutoffAt, :status, :candidateCount,
                     :deletedOutboxEvents, :deletedCaseIdempotencyRecords,
                     :deletedAccessIdempotencyRecords, :finding)
                """.trimIndent(),
            ).param("id", UUID.randomUUID().toString())
            .param("executedAt", Timestamp.from(result.executedAt))
            .param("cutoffAt", Timestamp.from(result.cutoffAt))
            .param("status", result.status)
            .param("candidateCount", result.candidateCount)
            .param("deletedOutboxEvents", result.deletedOutboxEvents)
            .param("deletedCaseIdempotencyRecords", result.deletedCaseIdempotencyRecords)
            .param("deletedAccessIdempotencyRecords", result.deletedAccessIdempotencyRecords)
            .param("finding", result.finding.take(500))
            .update()
    }

    fun lastMaintenance(): MaintenanceResult? =
        jdbc
            .sql(
                """
                select executed_at, cutoff_at, status, candidate_count,
                       deleted_outbox_events, deleted_case_idempotency_records,
                       deleted_access_idempotency_records, finding
                from quality_maintenance_run
                order by executed_at desc, id desc
                limit 1
                """.trimIndent(),
            ).query { rs, _ ->
                MaintenanceResult(
                    status = rs.getString("status"),
                    executedAt = rs.getTimestamp("executed_at").toInstant(),
                    cutoffAt = rs.getTimestamp("cutoff_at").toInstant(),
                    candidateCount = rs.getInt("candidate_count"),
                    deletedOutboxEvents = rs.getInt("deleted_outbox_events"),
                    deletedCaseIdempotencyRecords = rs.getInt("deleted_case_idempotency_records"),
                    deletedAccessIdempotencyRecords = rs.getInt("deleted_access_idempotency_records"),
                    finding = rs.getString("finding"),
                )
            }.optional()
            .orElse(null)

    private fun scalar(sql: String): Int = jdbc.sql(sql).query(Int::class.java).single()

    private fun count(
        sql: String,
        parameter: String,
        value: Any,
    ): Int =
        jdbc
            .sql(sql)
            .param(parameter, value)
            .query(Int::class.java)
            .single()

    private fun delete(
        sql: String,
        cutoff: Instant,
    ): Int = jdbc.sql(sql).param("cutoff", Timestamp.from(cutoff)).update()
}

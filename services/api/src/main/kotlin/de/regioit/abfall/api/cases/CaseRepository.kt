package de.regioit.abfall.api.cases

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Instant
import java.time.LocalDate

data class StoredCase(
    val id: String,
    val reference: String,
    val tenantId: String,
    val caseType: String,
    val subject: String,
    val status: String,
    val summary: String,
    val accessToken: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class SlotCapacity(
    val capacity: Int,
    val reserved: Int,
)

@Repository
class CaseRepository(
    private val jdbc: JdbcClient,
) {
    fun findIdempotentCase(
        tenantId: String,
        operation: String,
        idempotencyKey: String,
    ): StoredCase? =
        jdbc
            .sql(
                """
                select c.id, c.public_reference, c.tenant_id, c.case_type, c.subject,
                       c.public_status, c.summary, c.access_token, c.created_at, c.updated_at
                from idempotency_record i
                join case_record c on c.id = i.case_id
                where i.tenant_id = :tenantId and i.operation = :operation
                  and i.idempotency_key = :idempotencyKey
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("operation", operation)
            .param("idempotencyKey", idempotencyKey)
            .query(::mapStoredCase)
            .optional()
            .orElse(null)

    fun insertCase(
        case: StoredCase,
        contactEmail: String?,
    ) {
        jdbc
            .sql(
                """
                insert into case_record
                    (id, public_reference, tenant_id, case_type, subject, public_status, summary,
                     access_token, contact_email, created_at, updated_at, version)
                values
                    (:id, :reference, :tenantId, :caseType, :subject, :status, :summary,
                     :accessToken, :contactEmail, :createdAt, :updatedAt, 0)
                """.trimIndent(),
            ).param("id", case.id)
            .param("reference", case.reference)
            .param("tenantId", case.tenantId)
            .param("caseType", case.caseType)
            .param("subject", case.subject)
            .param("status", case.status)
            .param("summary", case.summary)
            .param("accessToken", case.accessToken)
            .param("contactEmail", contactEmail)
            .param("createdAt", Timestamp.from(case.createdAt))
            .param("updatedAt", Timestamp.from(case.updatedAt))
            .update()
    }

    fun insertDefect(
        caseId: String,
        input: DefectCaseInput,
    ) {
        jdbc
            .sql(
                """
                insert into defect_case
                    (case_id, category, address, description, occurred_at, attachment_names, consent)
                values
                    (:caseId, :category, :address, :description, :occurredAt, :attachmentNames, :consent)
                """.trimIndent(),
            ).param("caseId", caseId)
            .param("category", input.category)
            .param("address", input.address.trim())
            .param("description", input.description.trim())
            .param("occurredAt", Timestamp.from(input.occurredAt))
            .param("attachmentNames", input.attachmentNames.joinToString("|") { it.trim() })
            .param("consent", input.consent)
            .update()
    }

    fun insertBulkWasteOrder(
        caseId: String,
        input: BulkWasteOrderInput,
    ) {
        jdbc
            .sql(
                """
                insert into bulk_waste_order (case_id, address_id, slot_id, items, consent)
                values (:caseId, :addressId, :slotId, :items, :consent)
                """.trimIndent(),
            ).param("caseId", caseId)
            .param("addressId", input.addressId)
            .param("slotId", input.slotId)
            .param("items", input.items.joinToString("|") { "${it.itemTypeId}:${it.quantity}" })
            .param("consent", input.consent)
            .update()
    }

    fun insertInitialEvent(
        eventId: String,
        caseId: String,
        status: String,
        publicLabel: String,
        occurredAt: Instant,
    ) {
        jdbc
            .sql(
                """
                insert into case_event (id, case_id, status, public_label, occurred_at)
                values (:id, :caseId, :status, :publicLabel, :occurredAt)
                """.trimIndent(),
            ).param("id", eventId)
            .param("caseId", caseId)
            .param("status", status)
            .param("publicLabel", publicLabel)
            .param("occurredAt", Timestamp.from(occurredAt))
            .update()
    }

    fun insertIdempotency(
        tenantId: String,
        operation: String,
        idempotencyKey: String,
        caseId: String,
        createdAt: Instant,
    ) {
        jdbc
            .sql(
                """
                insert into idempotency_record
                    (tenant_id, operation, idempotency_key, case_id, created_at)
                values (:tenantId, :operation, :idempotencyKey, :caseId, :createdAt)
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("operation", operation)
            .param("idempotencyKey", idempotencyKey)
            .param("caseId", caseId)
            .param("createdAt", Timestamp.from(createdAt))
            .update()
    }

    fun insertOutboxEvent(
        id: String,
        aggregateId: String,
        eventType: String,
        payload: String,
        createdAt: Instant,
    ) {
        jdbc
            .sql(
                """
                insert into outbox_event
                    (id, aggregate_type, aggregate_id, event_type, payload, created_at)
                values (:id, 'case', :aggregateId, :eventType, :payload, :createdAt)
                """.trimIndent(),
            ).param("id", id)
            .param("aggregateId", aggregateId)
            .param("eventType", eventType)
            .param("payload", payload)
            .param("createdAt", Timestamp.from(createdAt))
            .update()
    }

    fun bulkWasteRules(tenantId: String): List<BulkWasteItemRule> =
        jdbc
            .sql(
                """
                select id, label, max_quantity from bulk_waste_item_rule
                where tenant_id = :tenantId order by label
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query { rs, _ ->
                BulkWasteItemRule(rs.getString("id"), rs.getString("label"), rs.getInt("max_quantity"))
            }.list()

    fun bulkWasteSlots(tenantId: String): List<BulkWasteSlot> =
        jdbc
            .sql(
                """
                select id, slot_date, time_window, capacity - reserved as remaining_capacity
                from bulk_waste_slot
                where tenant_id = :tenantId and capacity > reserved
                order by slot_date
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query { rs, _ ->
                BulkWasteSlot(
                    id = rs.getString("id"),
                    date = rs.getObject("slot_date", LocalDate::class.java),
                    timeWindow = rs.getString("time_window"),
                    remainingCapacity = rs.getInt("remaining_capacity"),
                )
            }.list()

    fun lockSlot(
        tenantId: String,
        slotId: String,
    ): SlotCapacity? =
        jdbc
            .sql(
                """
                select capacity, reserved from bulk_waste_slot
                where tenant_id = :tenantId and id = :slotId
                for update
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("slotId", slotId)
            .query { rs, _ -> SlotCapacity(rs.getInt("capacity"), rs.getInt("reserved")) }
            .optional()
            .orElse(null)

    fun reserveSlot(slotId: String) {
        jdbc
            .sql("update bulk_waste_slot set reserved = reserved + 1 where id = :slotId")
            .param("slotId", slotId)
            .update()
    }

    fun findCase(
        reference: String,
        accessToken: String,
    ): StoredCase? =
        jdbc
            .sql(
                """
                select id, public_reference, tenant_id, case_type, subject, public_status, summary,
                       access_token, created_at, updated_at
                from case_record where public_reference = :reference and access_token = :accessToken
                """.trimIndent(),
            ).param("reference", reference)
            .param("accessToken", accessToken)
            .query(::mapStoredCase)
            .optional()
            .orElse(null)

    fun findCaseForAdmin(reference: String): StoredCase? =
        jdbc
            .sql(
                """
                select id, public_reference, tenant_id, case_type, subject, public_status, summary,
                       access_token, created_at, updated_at
                from case_record where public_reference = :reference
                """.trimIndent(),
            ).param("reference", reference)
            .query(::mapStoredCase)
            .optional()
            .orElse(null)

    fun listCases(tenantId: String): List<StoredCase> =
        jdbc
            .sql(
                """
                select id, public_reference, tenant_id, case_type, subject, public_status, summary,
                       access_token, created_at, updated_at
                from case_record where tenant_id = :tenantId order by created_at desc
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query(::mapStoredCase)
            .list()

    fun events(caseId: String): List<CaseEvent> =
        jdbc
            .sql(
                """
                select status, public_label, occurred_at from case_event
                where case_id = :caseId order by occurred_at
                """.trimIndent(),
            ).param("caseId", caseId)
            .query { rs, _ ->
                CaseEvent(
                    status = rs.getString("status"),
                    publicLabel = rs.getString("public_label"),
                    occurredAt = rs.getTimestamp("occurred_at").toInstant(),
                )
            }.list()

    fun updateStatus(
        caseId: String,
        status: String,
        updatedAt: Instant,
    ) {
        jdbc
            .sql(
                """
                update case_record
                set public_status = :status, updated_at = :updatedAt, version = version + 1
                where id = :caseId
                """.trimIndent(),
            ).param("status", status)
            .param("updatedAt", Timestamp.from(updatedAt))
            .param("caseId", caseId)
            .update()
    }

    private fun mapStoredCase(
        rs: ResultSet,
        row: Int,
    ) = StoredCase(
        id = rs.getString("id"),
        reference = rs.getString("public_reference"),
        tenantId = rs.getString("tenant_id"),
        caseType = rs.getString("case_type"),
        subject = rs.getString("subject"),
        status = rs.getString("public_status"),
        summary = rs.getString("summary"),
        accessToken = rs.getString("access_token"),
        createdAt = rs.getTimestamp("created_at").toInstant(),
        updatedAt = rs.getTimestamp("updated_at").toInstant(),
    )
}

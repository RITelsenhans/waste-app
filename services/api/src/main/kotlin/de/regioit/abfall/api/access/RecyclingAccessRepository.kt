package de.regioit.abfall.api.access

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Instant

data class EligibleRecyclingSite(
    val id: String,
    val name: String,
)

data class StoredRecyclingAccessRequest(
    val id: String,
    val reference: String,
    val tenantId: String,
    val siteId: String,
    val siteName: String,
    val plannedArrivalAt: Instant,
    val accessWindowStart: Instant,
    val accessWindowEnd: Instant,
    val wasteType: String,
    val itemDescription: String,
    val identificationMethod: String,
    val credentialHash: String,
    val credentialHint: String,
    val accessToken: String,
    val status: String,
    val gateState: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val version: Int,
)

@Repository
class RecyclingAccessRepository(
    private val jdbc: JdbcClient,
) {
    fun eligibleSite(
        tenantId: String,
        siteId: String,
    ): EligibleRecyclingSite? =
        jdbc
            .sql(
                """
                select id, name from disposal_site
                where tenant_id = :tenantId and id = :siteId
                  and accepted_waste_types like '%Elektrogeräte%'
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("siteId", siteId)
            .query { rs, _ -> EligibleRecyclingSite(rs.getString("id"), rs.getString("name")) }
            .optional()
            .orElse(null)

    fun findIdempotent(
        tenantId: String,
        operation: String,
        idempotencyKey: String,
    ): StoredRecyclingAccessRequest? =
        jdbc
            .sql(
                """
                select ${requestColumns("r")}, s.name as site_name
                from recycling_access_idempotency i
                join recycling_access_request r on r.id = i.access_request_id
                join disposal_site s on s.id = r.site_id
                where i.tenant_id = :tenantId and i.operation = :operation
                  and i.idempotency_key = :idempotencyKey
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("operation", operation)
            .param("idempotencyKey", idempotencyKey)
            .query(::mapRequest)
            .optional()
            .orElse(null)

    fun findForUpdate(
        reference: String,
        accessToken: String,
    ): StoredRecyclingAccessRequest? =
        jdbc
            .sql(
                """
                select ${requestColumns("r")}, s.name as site_name
                from recycling_access_request r
                join disposal_site s on s.id = r.site_id
                where r.public_reference = :reference and r.access_token = :accessToken
                for update
                """.trimIndent(),
            ).param("reference", reference)
            .param("accessToken", accessToken)
            .query(::mapRequest)
            .optional()
            .orElse(null)

    fun insert(request: StoredRecyclingAccessRequest) {
        jdbc
            .sql(
                """
                insert into recycling_access_request
                    (id, public_reference, tenant_id, site_id, planned_arrival_at,
                     access_window_start, access_window_end, waste_type, item_description,
                     identification_method, credential_hash, credential_hint, access_token,
                     access_status, gate_state, created_at, updated_at, version)
                values
                    (:id, :reference, :tenantId, :siteId, :plannedArrivalAt,
                     :accessWindowStart, :accessWindowEnd, :wasteType, :itemDescription,
                     :identificationMethod, :credentialHash, :credentialHint, :accessToken,
                     :status, :gateState, :createdAt, :updatedAt, 0)
                """.trimIndent(),
            ).param("id", request.id)
            .param("reference", request.reference)
            .param("tenantId", request.tenantId)
            .param("siteId", request.siteId)
            .param("plannedArrivalAt", Timestamp.from(request.plannedArrivalAt))
            .param("accessWindowStart", Timestamp.from(request.accessWindowStart))
            .param("accessWindowEnd", Timestamp.from(request.accessWindowEnd))
            .param("wasteType", request.wasteType)
            .param("itemDescription", request.itemDescription)
            .param("identificationMethod", request.identificationMethod)
            .param("credentialHash", request.credentialHash)
            .param("credentialHint", request.credentialHint)
            .param("accessToken", request.accessToken)
            .param("status", request.status)
            .param("gateState", request.gateState)
            .param("createdAt", Timestamp.from(request.createdAt))
            .param("updatedAt", Timestamp.from(request.updatedAt))
            .update()
    }

    fun insertEvent(
        id: String,
        requestId: String,
        eventType: String,
        label: String,
        occurredAt: Instant,
    ) {
        jdbc
            .sql(
                """
                insert into recycling_access_event
                    (id, access_request_id, event_type, public_label, occurred_at)
                values (:id, :requestId, :eventType, :label, :occurredAt)
                """.trimIndent(),
            ).param("id", id)
            .param("requestId", requestId)
            .param("eventType", eventType)
            .param("label", label)
            .param("occurredAt", Timestamp.from(occurredAt))
            .update()
    }

    fun events(requestId: String): List<RecyclingAccessEvent> =
        jdbc
            .sql(
                """
                select event_type, public_label, occurred_at from recycling_access_event
                where access_request_id = :requestId order by occurred_at, id
                """.trimIndent(),
            ).param("requestId", requestId)
            .query { rs, _ ->
                RecyclingAccessEvent(
                    eventType = rs.getString("event_type"),
                    label = rs.getString("public_label"),
                    occurredAt = rs.getTimestamp("occurred_at").toInstant(),
                )
            }.list()

    fun insertIdempotency(
        tenantId: String,
        operation: String,
        idempotencyKey: String,
        requestId: String,
        createdAt: Instant,
    ) {
        jdbc
            .sql(
                """
                insert into recycling_access_idempotency
                    (tenant_id, operation, idempotency_key, access_request_id, created_at)
                values (:tenantId, :operation, :idempotencyKey, :requestId, :createdAt)
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("operation", operation)
            .param("idempotencyKey", idempotencyKey)
            .param("requestId", requestId)
            .param("createdAt", Timestamp.from(createdAt))
            .update()
    }

    fun updateState(
        request: StoredRecyclingAccessRequest,
        status: String,
        gateState: String,
        updatedAt: Instant,
    ): Boolean =
        jdbc
            .sql(
                """
                update recycling_access_request
                set access_status = :status, gate_state = :gateState,
                    updated_at = :updatedAt, version = version + 1
                where id = :id and version = :version
                """.trimIndent(),
            ).param("status", status)
            .param("gateState", gateState)
            .param("updatedAt", Timestamp.from(updatedAt))
            .param("id", request.id)
            .param("version", request.version)
            .update() == 1

    private fun requestColumns(alias: String) =
        """
        $alias.id, $alias.public_reference, $alias.tenant_id, $alias.site_id,
        $alias.planned_arrival_at, $alias.access_window_start, $alias.access_window_end,
        $alias.waste_type, $alias.item_description, $alias.identification_method,
        $alias.credential_hash, $alias.credential_hint, $alias.access_token,
        $alias.access_status, $alias.gate_state, $alias.created_at, $alias.updated_at, $alias.version
        """.trimIndent()

    private fun mapRequest(
        rs: ResultSet,
        row: Int,
    ) = StoredRecyclingAccessRequest(
        id = rs.getString("id"),
        reference = rs.getString("public_reference"),
        tenantId = rs.getString("tenant_id"),
        siteId = rs.getString("site_id"),
        siteName = rs.getString("site_name"),
        plannedArrivalAt = rs.getTimestamp("planned_arrival_at").toInstant(),
        accessWindowStart = rs.getTimestamp("access_window_start").toInstant(),
        accessWindowEnd = rs.getTimestamp("access_window_end").toInstant(),
        wasteType = rs.getString("waste_type"),
        itemDescription = rs.getString("item_description"),
        identificationMethod = rs.getString("identification_method"),
        credentialHash = rs.getString("credential_hash"),
        credentialHint = rs.getString("credential_hint"),
        accessToken = rs.getString("access_token"),
        status = rs.getString("access_status"),
        gateState = rs.getString("gate_state"),
        createdAt = rs.getTimestamp("created_at").toInstant(),
        updatedAt = rs.getTimestamp("updated_at").toInstant(),
        version = rs.getInt("version"),
    )
}

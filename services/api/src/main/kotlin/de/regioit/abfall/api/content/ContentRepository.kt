package de.regioit.abfall.api.content

import de.regioit.abfall.api.support.PilotNotFoundException
import de.regioit.abfall.api.support.PilotValidationException
import de.regioit.abfall.api.tenant.WasteProperties
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.util.Locale
import java.util.UUID
import kotlin.math.min

@Repository
class ContentRepository(
    private val jdbc: JdbcClient,
) {
    fun searchAddresses(
        tenantId: String,
        query: String,
    ): List<Address> =
        jdbc
            .sql(
                """
                select id, tenant_id, street, house_number, postal_code, city, district, display_label
                from address
                where tenant_id = :tenantId
                  and lower(street || ' ' || house_number || ' ' || postal_code || ' ' || city)
                      like :query
                order by street, house_number
                limit 12
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("query", "%${query.lowercase(Locale.GERMAN)}%")
            .query(::mapAddress)
            .list()

    fun addressExists(
        tenantId: String,
        addressId: String,
    ): Boolean =
        jdbc
            .sql("select count(*) from address where tenant_id = :tenantId and id = :addressId")
            .param("tenantId", tenantId)
            .param("addressId", addressId)
            .query(Int::class.java)
            .single() > 0

    fun collections(
        tenantId: String,
        addressId: String,
    ): List<CollectionEvent> =
        jdbc
            .sql(
                """
                select id, address_id, waste_type_id, waste_type_label, planned_date, effective_date,
                       status, last_modified
                from collection_event
                where tenant_id = :tenantId and address_id = :addressId
                order by effective_date, waste_type_label
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("addressId", addressId)
            .query(::mapCollection)
            .list()

    fun allCollections(tenantId: String): List<CollectionEvent> =
        jdbc
            .sql(
                """
                select id, address_id, waste_type_id, waste_type_label, planned_date, effective_date,
                       status, last_modified
                from collection_event
                where tenant_id = :tenantId
                order by effective_date desc, waste_type_label
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query(::mapCollection)
            .list()

    fun wasteGuideEntries(tenantId: String): List<WasteGuideEntry> =
        jdbc
            .sql(
                """
                select id, tenant_id, name, category, disposal_route, notes, synonyms, data_status
                from waste_guide_entry
                where tenant_id = :tenantId
                order by name
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query(::mapWasteGuideEntry)
            .list()

    fun sites(
        tenantId: String,
        wasteType: String?,
    ): List<Site> {
        val sql =
            if (wasteType.isNullOrBlank()) {
                """
                select id, tenant_id, name, site_type, address, opening_hours, accepted_waste_types,
                       open_now, latitude, longitude, data_status
                from disposal_site where tenant_id = :tenantId order by name
                """.trimIndent()
            } else {
                """
                select id, tenant_id, name, site_type, address, opening_hours, accepted_waste_types,
                       open_now, latitude, longitude, data_status
                from disposal_site
                where tenant_id = :tenantId and lower(accepted_waste_types) like :wasteType
                order by name
                """.trimIndent()
            }
        var statement = jdbc.sql(sql).param("tenantId", tenantId)
        if (!wasteType.isNullOrBlank()) {
            statement = statement.param("wasteType", "%${wasteType.lowercase(Locale.GERMAN)}%")
        }
        return statement.query(::mapSite).list()
    }

    fun notices(
        tenantId: String,
        addressId: String?,
        now: Instant,
    ): List<Notice> =
        jdbc
            .sql(
                """
                select id, tenant_id, address_id, notice_type, title, body, priority, valid_from, valid_until
                from notice
                where tenant_id = :tenantId
                  and valid_from <= :now and valid_until >= :now
                  and (address_id is null or address_id = :addressId)
                order by case priority when 'critical' then 1 when 'warning' then 2 else 3 end, valid_from desc
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .param("now", Timestamp.from(now))
            .param("addressId", addressId)
            .query(::mapNotice)
            .list()

    fun allNotices(tenantId: String): List<Notice> =
        jdbc
            .sql(
                """
                select id, tenant_id, address_id, notice_type, title, body, priority, valid_from, valid_until
                from notice where tenant_id = :tenantId order by valid_until desc, valid_from desc
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query(::mapNotice)
            .list()

    fun createCollection(input: CollectionInput): CollectionEvent {
        val id = "collection-${UUID.randomUUID()}"
        val now = Instant.now()
        jdbc
            .sql(
                """
                insert into collection_event
                    (id, tenant_id, address_id, waste_type_id, waste_type_label, planned_date,
                     effective_date, status, last_modified)
                values
                    (:id, :tenantId, :addressId, :wasteTypeId, :wasteTypeLabel, :plannedDate,
                     :effectiveDate, :status, :lastModified)
                """.trimIndent(),
            ).param("id", id)
            .param("tenantId", input.tenantId)
            .param("addressId", input.addressId)
            .param("wasteTypeId", input.wasteTypeId)
            .param("wasteTypeLabel", input.wasteTypeLabel.trim())
            .param("plannedDate", input.plannedDate)
            .param("effectiveDate", input.effectiveDate)
            .param("status", input.status)
            .param("lastModified", Timestamp.from(now))
            .update()
        return CollectionEvent(
            id,
            input.addressId,
            input.wasteTypeId,
            input.wasteTypeLabel.trim(),
            input.plannedDate,
            input.effectiveDate,
            input.status,
            now,
        )
    }

    fun createWasteGuideEntry(input: WasteGuideInput): WasteGuideEntry {
        val id = "guide-${UUID.randomUUID()}"
        val now = Instant.now()
        jdbc
            .sql(
                """
                insert into waste_guide_entry
                    (id, tenant_id, name, category, disposal_route, notes, synonyms, data_status)
                values (:id, :tenantId, :name, :category, :disposalRoute, :notes, :synonyms, :dataStatus)
                """.trimIndent(),
            ).param("id", id)
            .param("tenantId", input.tenantId)
            .param("name", input.name.trim())
            .param("category", input.category.trim())
            .param("disposalRoute", input.disposalRoute.trim())
            .param("notes", input.notes.trim())
            .param("synonyms", input.synonyms.joinToString("|") { it.trim() })
            .param("dataStatus", Timestamp.from(now))
            .update()
        return WasteGuideEntry(
            id,
            input.tenantId,
            input.name.trim(),
            input.category.trim(),
            input.disposalRoute.trim(),
            input.notes.trim(),
            input.synonyms.map(String::trim).filter(String::isNotBlank),
            now,
        )
    }

    fun createSite(input: SiteInput): Site {
        val id = "site-${UUID.randomUUID()}"
        val now = Instant.now()
        jdbc
            .sql(
                """
                insert into disposal_site
                    (id, tenant_id, name, site_type, address, opening_hours, accepted_waste_types,
                     open_now, latitude, longitude, data_status)
                values
                    (:id, :tenantId, :name, :siteType, :address, :openingHours, :acceptedWasteTypes,
                     :openNow, :latitude, :longitude, :dataStatus)
                """.trimIndent(),
            ).param("id", id)
            .param("tenantId", input.tenantId)
            .param("name", input.name.trim())
            .param("siteType", input.siteType.trim())
            .param("address", input.address.trim())
            .param("openingHours", input.openingHours.trim())
            .param("acceptedWasteTypes", input.acceptedWasteTypes.joinToString("|") { it.trim() })
            .param("openNow", input.openNow)
            .param("latitude", input.latitude)
            .param("longitude", input.longitude)
            .param("dataStatus", Timestamp.from(now))
            .update()
        return Site(
            id,
            input.tenantId,
            input.name.trim(),
            input.siteType.trim(),
            input.address.trim(),
            input.openingHours.trim(),
            input.acceptedWasteTypes.map(String::trim).filter(String::isNotBlank),
            input.openNow,
            input.latitude,
            input.longitude,
            now,
        )
    }

    fun createNotice(input: NoticeInput): Notice {
        val id = "notice-${UUID.randomUUID()}"
        jdbc
            .sql(
                """
                insert into notice
                    (id, tenant_id, address_id, notice_type, title, body, priority, valid_from, valid_until)
                values
                    (:id, :tenantId, :addressId, :noticeType, :title, :body, :priority,
                     :validFrom, :validUntil)
                """.trimIndent(),
            ).param("id", id)
            .param("tenantId", input.tenantId)
            .param("addressId", input.addressId)
            .param("noticeType", input.noticeType.trim())
            .param("title", input.title.trim())
            .param("body", input.body.trim())
            .param("priority", input.priority)
            .param("validFrom", Timestamp.from(input.validFrom))
            .param("validUntil", Timestamp.from(input.validUntil))
            .update()
        return Notice(
            id,
            input.tenantId,
            input.addressId,
            input.noticeType.trim(),
            input.title.trim(),
            input.body.trim(),
            input.priority,
            input.validFrom,
            input.validUntil,
        )
    }

    fun updateCollection(
        id: String,
        input: CollectionInput,
    ): CollectionEvent {
        val now = Instant.now()
        requireUpdated(
            jdbc
                .sql(
                    """
                    update collection_event
                    set address_id = :addressId, waste_type_id = :wasteTypeId,
                        waste_type_label = :wasteTypeLabel, planned_date = :plannedDate,
                        effective_date = :effectiveDate, status = :status, last_modified = :lastModified
                    where id = :id and tenant_id = :tenantId
                    """.trimIndent(),
                ).param("id", id)
                .param("tenantId", input.tenantId)
                .param("addressId", input.addressId)
                .param("wasteTypeId", input.wasteTypeId)
                .param("wasteTypeLabel", input.wasteTypeLabel.trim())
                .param("plannedDate", input.plannedDate)
                .param("effectiveDate", input.effectiveDate)
                .param("status", input.status)
                .param("lastModified", Timestamp.from(now))
                .update(),
            id,
        )
        return CollectionEvent(
            id,
            input.addressId,
            input.wasteTypeId,
            input.wasteTypeLabel.trim(),
            input.plannedDate,
            input.effectiveDate,
            input.status,
            now,
        )
    }

    fun updateWasteGuideEntry(
        id: String,
        input: WasteGuideInput,
    ): WasteGuideEntry {
        val now = Instant.now()
        requireUpdated(
            jdbc
                .sql(
                    """
                    update waste_guide_entry
                    set name = :name, category = :category, disposal_route = :disposalRoute,
                        notes = :notes, synonyms = :synonyms, data_status = :dataStatus
                    where id = :id and tenant_id = :tenantId
                    """.trimIndent(),
                ).param("id", id)
                .param("tenantId", input.tenantId)
                .param("name", input.name.trim())
                .param("category", input.category.trim())
                .param("disposalRoute", input.disposalRoute.trim())
                .param("notes", input.notes.trim())
                .param("synonyms", input.synonyms.joinToString("|") { it.trim() })
                .param("dataStatus", Timestamp.from(now))
                .update(),
            id,
        )
        return WasteGuideEntry(
            id,
            input.tenantId,
            input.name.trim(),
            input.category.trim(),
            input.disposalRoute.trim(),
            input.notes.trim(),
            input.synonyms.map(String::trim).filter(String::isNotBlank),
            now,
        )
    }

    fun updateSite(
        id: String,
        input: SiteInput,
    ): Site {
        val now = Instant.now()
        requireUpdated(
            jdbc
                .sql(
                    """
                    update disposal_site
                    set name = :name, site_type = :siteType, address = :address,
                        opening_hours = :openingHours, accepted_waste_types = :acceptedWasteTypes,
                        open_now = :openNow, latitude = :latitude, longitude = :longitude,
                        data_status = :dataStatus
                    where id = :id and tenant_id = :tenantId
                    """.trimIndent(),
                ).param("id", id)
                .param("tenantId", input.tenantId)
                .param("name", input.name.trim())
                .param("siteType", input.siteType.trim())
                .param("address", input.address.trim())
                .param("openingHours", input.openingHours.trim())
                .param("acceptedWasteTypes", input.acceptedWasteTypes.joinToString("|") { it.trim() })
                .param("openNow", input.openNow)
                .param("latitude", input.latitude)
                .param("longitude", input.longitude)
                .param("dataStatus", Timestamp.from(now))
                .update(),
            id,
        )
        return Site(
            id,
            input.tenantId,
            input.name.trim(),
            input.siteType.trim(),
            input.address.trim(),
            input.openingHours.trim(),
            input.acceptedWasteTypes.map(String::trim).filter(String::isNotBlank),
            input.openNow,
            input.latitude,
            input.longitude,
            now,
        )
    }

    fun updateNotice(
        id: String,
        input: NoticeInput,
    ): Notice {
        requireUpdated(
            jdbc
                .sql(
                    """
                    update notice
                    set address_id = :addressId, notice_type = :noticeType, title = :title,
                        body = :body, priority = :priority, valid_from = :validFrom,
                        valid_until = :validUntil
                    where id = :id and tenant_id = :tenantId
                    """.trimIndent(),
                ).param("id", id)
                .param("tenantId", input.tenantId)
                .param("addressId", input.addressId)
                .param("noticeType", input.noticeType.trim())
                .param("title", input.title.trim())
                .param("body", input.body.trim())
                .param("priority", input.priority)
                .param("validFrom", Timestamp.from(input.validFrom))
                .param("validUntil", Timestamp.from(input.validUntil))
                .update(),
            id,
        )
        return Notice(
            id,
            input.tenantId,
            input.addressId,
            input.noticeType.trim(),
            input.title.trim(),
            input.body.trim(),
            input.priority,
            input.validFrom,
            input.validUntil,
        )
    }

    fun deleteContent(
        table: String,
        id: String,
        tenantId: String,
    ) {
        val allowedTables = setOf("collection_event", "waste_guide_entry", "disposal_site", "notice")
        require(table in allowedTables)
        requireUpdated(
            jdbc
                .sql("delete from $table where id = :id and tenant_id = :tenantId")
                .param("id", id)
                .param("tenantId", tenantId)
                .update(),
            id,
        )
    }

    private fun requireUpdated(
        count: Int,
        id: String,
    ) {
        if (count == 0) throw PilotNotFoundException("Der Eintrag $id ist nicht vorhanden.")
    }

    private fun mapAddress(
        rs: ResultSet,
        row: Int,
    ) = Address(
        id = rs.getString("id"),
        tenantId = rs.getString("tenant_id"),
        street = rs.getString("street"),
        houseNumber = rs.getString("house_number"),
        postalCode = rs.getString("postal_code"),
        city = rs.getString("city"),
        district = rs.getString("district"),
        displayLabel = rs.getString("display_label"),
    )

    private fun mapCollection(
        rs: ResultSet,
        row: Int,
    ) = CollectionEvent(
        id = rs.getString("id"),
        addressId = rs.getString("address_id"),
        wasteTypeId = rs.getString("waste_type_id"),
        wasteTypeLabel = rs.getString("waste_type_label"),
        plannedDate = rs.getObject("planned_date", LocalDate::class.java),
        effectiveDate = rs.getObject("effective_date", LocalDate::class.java),
        status = rs.getString("status"),
        lastModified = rs.getTimestamp("last_modified").toInstant(),
    )

    private fun mapWasteGuideEntry(
        rs: ResultSet,
        row: Int,
    ) = WasteGuideEntry(
        id = rs.getString("id"),
        tenantId = rs.getString("tenant_id"),
        name = rs.getString("name"),
        category = rs.getString("category"),
        disposalRoute = rs.getString("disposal_route"),
        notes = rs.getString("notes"),
        synonyms = splitValues(rs.getString("synonyms")),
        dataStatus = rs.getTimestamp("data_status").toInstant(),
    )

    private fun mapSite(
        rs: ResultSet,
        row: Int,
    ) = Site(
        id = rs.getString("id"),
        tenantId = rs.getString("tenant_id"),
        name = rs.getString("name"),
        siteType = rs.getString("site_type"),
        address = rs.getString("address"),
        openingHours = rs.getString("opening_hours"),
        acceptedWasteTypes = splitValues(rs.getString("accepted_waste_types")),
        openNow = rs.getBoolean("open_now"),
        latitude = rs.getDouble("latitude"),
        longitude = rs.getDouble("longitude"),
        dataStatus = rs.getTimestamp("data_status").toInstant(),
    )

    private fun mapNotice(
        rs: ResultSet,
        row: Int,
    ) = Notice(
        id = rs.getString("id"),
        tenantId = rs.getString("tenant_id"),
        addressId = rs.getString("address_id"),
        noticeType = rs.getString("notice_type"),
        title = rs.getString("title"),
        body = rs.getString("body"),
        priority = rs.getString("priority"),
        validFrom = rs.getTimestamp("valid_from").toInstant(),
        validUntil = rs.getTimestamp("valid_until").toInstant(),
    )

    private fun splitValues(value: String): List<String> = value.split('|').map(String::trim).filter(String::isNotBlank)
}

@Service
class ContentService(
    private val repository: ContentRepository,
    private val clock: Clock,
    private val properties: WasteProperties,
) {
    private val collectionStatuses = setOf("planned", "moved", "cancelled", "additional")
    private val noticePriorities = setOf("info", "warning", "critical")

    fun searchAddresses(
        tenantId: String,
        query: String,
    ): List<Address> {
        validateTenant(tenantId)
        if (query.trim().length < 2) {
            throw PilotValidationException("Bitte mindestens zwei Zeichen für die Adresssuche eingeben.")
        }
        return repository.searchAddresses(tenantId, query.trim())
    }

    fun collections(
        tenantId: String,
        addressId: String,
    ): List<CollectionEvent> {
        validateAddress(tenantId, addressId)
        return repository.collections(tenantId, addressId)
    }

    fun searchWasteGuide(
        tenantId: String,
        query: String,
    ): List<WasteGuideEntry> {
        validateTenant(tenantId)
        val normalizedQuery = normalize(query)
        if (normalizedQuery.length < 2) {
            throw PilotValidationException("Bitte mindestens zwei Zeichen für die ABC-Suche eingeben.")
        }
        return repository
            .wasteGuideEntries(tenantId)
            .map { entry -> entry to searchScore(entry, normalizedQuery) }
            .filter { (_, score) -> score < Int.MAX_VALUE }
            .sortedBy { (_, score) -> score }
            .take(12)
            .map { (entry) -> entry }
    }

    fun sites(
        tenantId: String,
        wasteType: String?,
    ): List<Site> {
        validateTenant(tenantId)
        return repository.sites(tenantId, wasteType?.trim())
    }

    fun notices(
        tenantId: String,
        addressId: String?,
    ): List<Notice> {
        validateTenant(tenantId)
        return repository.notices(tenantId, addressId, clock.instant())
    }

    fun adminCollections(tenantId: String): List<CollectionEvent> {
        validateTenant(tenantId)
        return repository.allCollections(tenantId)
    }

    fun adminWasteGuide(tenantId: String): List<WasteGuideEntry> {
        validateTenant(tenantId)
        return repository.wasteGuideEntries(tenantId)
    }

    fun adminSites(tenantId: String): List<Site> {
        validateTenant(tenantId)
        return repository.sites(tenantId, null)
    }

    fun adminNotices(tenantId: String): List<Notice> {
        validateTenant(tenantId)
        return repository.allNotices(tenantId)
    }

    @Transactional
    fun createCollection(input: CollectionInput): CollectionEvent {
        validateTenant(input.tenantId)
        validateAddress(input.tenantId, input.addressId)
        if (input.status !in collectionStatuses) {
            throw PilotValidationException("Unbekannter Terminstatus: ${input.status}")
        }
        return repository.createCollection(input)
    }

    @Transactional
    fun createWasteGuideEntry(input: WasteGuideInput): WasteGuideEntry {
        validateTenant(input.tenantId)
        return repository.createWasteGuideEntry(input)
    }

    @Transactional
    fun createSite(input: SiteInput): Site {
        validateTenant(input.tenantId)
        validateSite(input)
        return repository.createSite(input)
    }

    @Transactional
    fun createNotice(input: NoticeInput): Notice {
        validateTenant(input.tenantId)
        validateNotice(input)
        return repository.createNotice(input)
    }

    private fun validateSite(input: SiteInput) {
        if (input.acceptedWasteTypes.none(String::isNotBlank)) {
            throw PilotValidationException("Mindestens eine angenommene Abfallart ist erforderlich.")
        }
        if (input.latitude !in -90.0..90.0 || input.longitude !in -180.0..180.0) {
            throw PilotValidationException("Die Kartenkoordinaten liegen außerhalb des gültigen Bereichs.")
        }
    }

    private fun validateNotice(input: NoticeInput) {
        input.addressId?.let { validateAddress(input.tenantId, it) }
        if (input.priority !in noticePriorities) {
            throw PilotValidationException("Unbekannte Priorität: ${input.priority}")
        }
        if (!input.validUntil.isAfter(input.validFrom)) {
            throw PilotValidationException("Das Ende der Meldung muss nach dem Beginn liegen.")
        }
    }

    @Transactional
    fun updateCollection(
        id: String,
        input: CollectionInput,
    ): CollectionEvent {
        validateTenant(input.tenantId)
        validateAddress(input.tenantId, input.addressId)
        if (input.status !in collectionStatuses) {
            throw PilotValidationException("Unbekannter Terminstatus: ${input.status}")
        }
        return repository.updateCollection(id, input)
    }

    @Transactional
    fun updateWasteGuideEntry(
        id: String,
        input: WasteGuideInput,
    ): WasteGuideEntry {
        validateTenant(input.tenantId)
        return repository.updateWasteGuideEntry(id, input)
    }

    @Transactional
    fun updateSite(
        id: String,
        input: SiteInput,
    ): Site {
        validateTenant(input.tenantId)
        validateSite(input)
        return repository.updateSite(id, input)
    }

    @Transactional
    fun updateNotice(
        id: String,
        input: NoticeInput,
    ): Notice {
        validateTenant(input.tenantId)
        validateNotice(input)
        return repository.updateNotice(id, input)
    }

    @Transactional
    fun deleteContent(
        resource: String,
        id: String,
        tenantId: String,
    ) {
        validateTenant(tenantId)
        val table =
            mapOf(
                "collections" to "collection_event",
                "waste-guide" to "waste_guide_entry",
                "sites" to "disposal_site",
                "notices" to "notice",
            )[resource] ?: throw PilotValidationException("Unbekannter Inhaltstyp: $resource")
        repository.deleteContent(table, id, tenantId)
    }

    private fun validateTenant(tenantId: String) {
        if (tenantId !in properties.tenants) {
            throw PilotNotFoundException("Der Pilotmandant '$tenantId' ist nicht vorhanden.")
        }
    }

    private fun validateAddress(
        tenantId: String,
        addressId: String,
    ) {
        validateTenant(tenantId)
        if (!repository.addressExists(tenantId, addressId)) {
            throw PilotNotFoundException("Die ausgewählte Testadresse ist nicht vorhanden.")
        }
    }

    private fun searchScore(
        entry: WasteGuideEntry,
        query: String,
    ): Int {
        val terms = listOf(entry.name) + entry.synonyms
        val normalizedTerms = terms.map(::normalize)
        if (normalizedTerms.any { it.contains(query) || query.contains(it) }) {
            return 0
        }
        return normalizedTerms
            .flatMap { it.split(' ') }
            .minOfOrNull { term -> levenshtein(term, query) }
            ?.takeIf { it <= 2 }
            ?: Int.MAX_VALUE
    }

    private fun normalize(value: String): String =
        value
            .trim()
            .lowercase(Locale.GERMAN)
            .replace("ä", "ae")
            .replace("ö", "oe")
            .replace("ü", "ue")
            .replace("ß", "ss")

    private fun levenshtein(
        left: String,
        right: String,
    ): Int {
        if (left.isEmpty()) return right.length
        if (right.isEmpty()) return left.length
        var previous = IntArray(right.length + 1) { it }
        left.forEachIndexed { leftIndex, leftChar ->
            val current = IntArray(right.length + 1)
            current[0] = leftIndex + 1
            right.forEachIndexed { rightIndex, rightChar ->
                current[rightIndex + 1] =
                    min(
                        min(current[rightIndex] + 1, previous[rightIndex + 1] + 1),
                        previous[rightIndex] + if (leftChar == rightChar) 0 else 1,
                    )
            }
            previous = current
        }
        return previous[right.length]
    }
}

package de.regioit.abfall.api.content

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate

data class Address(
    val id: String,
    val tenantId: String,
    val street: String,
    val houseNumber: String,
    val postalCode: String,
    val city: String,
    val district: String?,
    val displayLabel: String,
)

data class CollectionEvent(
    val id: String,
    val addressId: String,
    val wasteTypeId: String,
    val wasteTypeLabel: String,
    val plannedDate: LocalDate,
    val effectiveDate: LocalDate,
    val status: String,
    val lastModified: Instant,
)

data class CollectionInput(
    @field:NotBlank val tenantId: String,
    @field:NotBlank val addressId: String,
    @field:NotBlank val wasteTypeId: String,
    @field:Size(min = 2, max = 120) val wasteTypeLabel: String,
    val plannedDate: LocalDate,
    val effectiveDate: LocalDate,
    @field:NotBlank val status: String,
)

data class WasteGuideEntry(
    val id: String,
    val tenantId: String,
    val name: String,
    val category: String,
    val disposalRoute: String,
    val notes: String,
    val synonyms: List<String>,
    val dataStatus: Instant,
)

data class WasteGuideInput(
    @field:NotBlank val tenantId: String,
    @field:Size(min = 2, max = 160) val name: String,
    @field:Size(min = 2, max = 120) val category: String,
    @field:Size(min = 2, max = 500) val disposalRoute: String,
    @field:Size(max = 1000) val notes: String,
    val synonyms: List<String> = emptyList(),
)

data class Site(
    val id: String,
    val tenantId: String,
    val name: String,
    val siteType: String,
    val address: String,
    val openingHours: String,
    val acceptedWasteTypes: List<String>,
    val openNow: Boolean,
    val dataStatus: Instant,
)

data class SiteInput(
    @field:NotBlank val tenantId: String,
    @field:Size(min = 2, max = 160) val name: String,
    @field:NotBlank val siteType: String,
    @field:NotBlank val address: String,
    @field:NotBlank val openingHours: String,
    @field:Size(min = 1) val acceptedWasteTypes: List<String>,
    val openNow: Boolean,
)

data class Notice(
    val id: String,
    val tenantId: String,
    val addressId: String?,
    val noticeType: String,
    val title: String,
    val body: String,
    val priority: String,
    val validFrom: Instant,
    val validUntil: Instant,
)

data class NoticeInput(
    @field:NotBlank val tenantId: String,
    val addressId: String?,
    @field:NotBlank val noticeType: String,
    @field:Size(min = 3, max = 240) val title: String,
    @field:Size(min = 3, max = 2000) val body: String,
    @field:NotBlank val priority: String,
    val validFrom: Instant,
    val validUntil: Instant,
)

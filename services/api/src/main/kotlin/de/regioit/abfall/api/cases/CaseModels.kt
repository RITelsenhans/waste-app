package de.regioit.abfall.api.cases

import jakarta.validation.Valid
import jakarta.validation.constraints.AssertTrue
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate

data class DefectCaseInput(
    @field:NotBlank val tenantId: String,
    @field:NotBlank val category: String,
    @field:Size(min = 4, max = 240) val address: String,
    @field:Size(min = 10, max = 2000) val description: String,
    val occurredAt: Instant,
    @field:Email val contactEmail: String?,
    @field:AssertTrue(message = "Die Zustimmung ist für den Pilotvorgang erforderlich.")
    val consent: Boolean,
    @field:Size(max = 3) val attachmentNames: List<@NotBlank String> = emptyList(),
)

data class CaseCreated(
    val reference: String,
    val accessToken: String,
    val status: String,
    val createdAt: Instant,
)

data class CaseEvent(
    val status: String,
    val publicLabel: String,
    val occurredAt: Instant,
)

data class CaseDetail(
    val reference: String,
    val tenantId: String,
    val caseType: String,
    val subject: String,
    val status: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val summary: String,
    val events: List<CaseEvent>,
)

data class CaseStatusInput(
    @field:NotBlank val status: String,
    @field:Size(min = 3, max = 240) val publicLabel: String,
)

data class BulkWasteItemRule(
    val id: String,
    val label: String,
    val maxQuantity: Int,
)

data class BulkWasteRules(
    val tenantId: String,
    val maxTotalItems: Int,
    val items: List<BulkWasteItemRule>,
    val preparationInstructions: String,
)

data class BulkWasteSlot(
    val id: String,
    val date: LocalDate,
    val timeWindow: String,
    val remainingCapacity: Int,
)

data class BulkWasteOrderItem(
    @field:NotBlank val itemTypeId: String,
    @field:Min(1) @field:Max(10) val quantity: Int,
)

data class BulkWasteOrderInput(
    @field:NotBlank val tenantId: String,
    @field:NotBlank val addressId: String,
    @field:NotBlank val slotId: String,
    @field:Valid @field:Size(min = 1) val items: List<BulkWasteOrderItem>,
    @field:Email val contactEmail: String?,
    @field:AssertTrue(message = "Die Zustimmung ist für den Pilotvorgang erforderlich.")
    val consent: Boolean,
)

data class CaseCreationResult(
    val response: CaseCreated,
    val created: Boolean,
)

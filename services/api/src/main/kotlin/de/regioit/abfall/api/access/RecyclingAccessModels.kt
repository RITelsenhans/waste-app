package de.regioit.abfall.api.access

import jakarta.validation.constraints.AssertTrue
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class RecyclingAccessRequestInput(
    @field:NotBlank val tenantId: String,
    @field:NotBlank val siteId: String,
    val plannedArrivalAt: Instant,
    @field:NotBlank val wasteType: String,
    @field:Size(min = 3, max = 160) val itemDescription: String,
    @field:NotBlank val identificationMethod: String,
    @field:Size(max = 25) val syntheticLicensePlate: String?,
    @field:AssertTrue(message = "Im Showcase dürfen ausschließlich synthetische Daten verwendet werden.")
    val syntheticDataConfirmed: Boolean,
)

data class RecyclingAccessSimulationInput(
    @field:Size(min = 32, max = 160) val accessToken: String,
    @field:NotBlank val eventType: String,
    @field:Size(min = 4, max = 32) val credential: String,
)

data class RecyclingAccessEvent(
    val eventType: String,
    val label: String,
    val occurredAt: Instant,
)

data class RecyclingAccessRequestView(
    val reference: String,
    val accessToken: String,
    val tenantId: String,
    val siteId: String,
    val siteName: String,
    val plannedArrivalAt: Instant,
    val accessWindowStart: Instant,
    val accessWindowEnd: Instant,
    val wasteType: String,
    val itemDescription: String,
    val identificationMethod: String,
    val credential: String?,
    val credentialHint: String,
    val status: String,
    val gateState: String,
    val nextSimulationEvent: String?,
    val events: List<RecyclingAccessEvent>,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class RecyclingAccessCreationResult(
    val response: RecyclingAccessRequestView,
    val created: Boolean,
)

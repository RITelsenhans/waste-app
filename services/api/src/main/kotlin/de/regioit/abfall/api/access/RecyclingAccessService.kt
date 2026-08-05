package de.regioit.abfall.api.access

import de.regioit.abfall.api.support.PilotConflictException
import de.regioit.abfall.api.support.PilotNotFoundException
import de.regioit.abfall.api.support.PilotValidationException
import de.regioit.abfall.api.tenant.WasteProperties
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.HexFormat
import java.util.Locale
import java.util.UUID

@Service
class RecyclingAccessService(
    private val repository: RecyclingAccessRepository,
    private val properties: WasteProperties,
    private val clock: Clock,
) {
    private val random = SecureRandom()
    private val identificationMethods = setOf("code", "license-plate")
    private val transitions =
        mapOf(
            "authorized" to Transition("arrival-scan", "entry-granted", "open-entry"),
            "entry-granted" to Transition("entry-confirmed", "on-site", "closed"),
            "on-site" to Transition("exit-scan", "exit-granted", "open-exit"),
            "exit-granted" to Transition("exit-confirmed", "completed", "closed"),
        )

    @Transactional
    @Synchronized
    fun create(
        idempotencyKey: String,
        input: RecyclingAccessRequestInput,
    ): RecyclingAccessCreationResult {
        validateIdempotencyKey(idempotencyKey)
        validateInput(input)
        repository.findIdempotent(input.tenantId, "create-access", idempotencyKey)?.let {
            return RecyclingAccessCreationResult(it.toView(null), false)
        }

        val site =
            repository.eligibleSite(input.tenantId, input.siteId)
                ?: throw PilotNotFoundException(
                    "Der gewählte Demo-Standort nimmt in diesem Showcase keine Elektrogeräte an.",
                )
        val credential = credentialFor(input)
        val now = clock.instant()
        val request =
            StoredRecyclingAccessRequest(
                id = UUID.randomUUID().toString(),
                reference = "DEMO-Z-${randomHex(12)}",
                tenantId = input.tenantId,
                siteId = site.id,
                siteName = site.name,
                plannedArrivalAt = input.plannedArrivalAt,
                accessWindowStart = input.plannedArrivalAt.minus(Duration.ofMinutes(15)),
                accessWindowEnd = input.plannedArrivalAt.plus(Duration.ofMinutes(45)),
                wasteType = input.wasteType,
                itemDescription = input.itemDescription.trim(),
                identificationMethod = input.identificationMethod,
                credentialHash = hashCredential(credential),
                credentialHint = credentialHint(input.identificationMethod, credential),
                accessToken = randomToken(),
                status = "authorized",
                gateState = "closed",
                createdAt = now,
                updatedAt = now,
                version = 0,
            )
        repository.insert(request)
        repository.insertEvent(
            UUID.randomUUID().toString(),
            request.id,
            "request-authorized",
            "Zufahrt für den Demo-Zeitraum freigegeben.",
            now,
        )
        repository.insertIdempotency(input.tenantId, "create-access", idempotencyKey, request.id, now)
        return RecyclingAccessCreationResult(request.toView(credential), true)
    }

    @Transactional
    @Synchronized
    fun simulate(
        reference: String,
        idempotencyKey: String,
        input: RecyclingAccessSimulationInput,
    ): RecyclingAccessRequestView {
        validateIdempotencyKey(idempotencyKey)
        val request =
            repository.findForUpdate(reference, input.accessToken)
                ?: throw PilotNotFoundException("Zufahrtsvorgang oder Zugriffsschlüssel ist nicht gültig.")
        val operation = "simulate-${input.eventType}"
        repository.findIdempotent(request.tenantId, operation, idempotencyKey)?.let {
            return it.toView(null)
        }
        if (!MessageDigest.isEqual(
                hashCredential(normalizeCredential(input.credential)).toByteArray(StandardCharsets.UTF_8),
                request.credentialHash.toByteArray(StandardCharsets.UTF_8),
            )
        ) {
            throw PilotNotFoundException("Die simulierte Kennung passt nicht zur Zufahrtsberechtigung.")
        }
        val transition =
            transitions[request.status]
                ?: throw PilotConflictException("Die simulierte Ausfahrt ist bereits abgeschlossen.")
        if (transition.eventType != input.eventType) {
            throw PilotConflictException(
                "Als nächster Schritt ist '${transition.eventType}' vorgesehen, nicht '${input.eventType}'.",
            )
        }
        val now = clock.instant()
        if (!repository.updateState(request, transition.status, transition.gateState, now)) {
            throw PilotConflictException("Der Torzustand wurde zwischenzeitlich verändert. Bitte neu laden.")
        }
        repository.insertEvent(
            UUID.randomUUID().toString(),
            request.id,
            input.eventType,
            eventLabel(input.eventType),
            now,
        )
        repository.insertIdempotency(request.tenantId, operation, idempotencyKey, request.id, now)
        val updated =
            repository.findForUpdate(reference, input.accessToken)
                ?: throw PilotNotFoundException("Der aktualisierte Zufahrtsvorgang ist nicht mehr vorhanden.")
        return updated.toView(null)
    }

    private fun validateInput(input: RecyclingAccessRequestInput) {
        val tenant = properties.tenants[input.tenantId]
        if (tenant == null) {
            throw PilotNotFoundException("Der Pilotmandant '${input.tenantId}' ist nicht vorhanden.")
        }
        if (tenant.enabledFeatures["recyclingAccessShowcase"] != true) {
            throw PilotNotFoundException("Der 24/7-Zugangs-Showcase ist für diesen Mandanten nicht aktiviert.")
        }
        if (!input.syntheticDataConfirmed) {
            throw PilotValidationException("Im Showcase dürfen ausschließlich synthetische Daten verwendet werden.")
        }
        if (input.wasteType != "electronics") {
            throw PilotValidationException("Der Showcase ist derzeit auf Elektroaltgeräte begrenzt.")
        }
        if (input.identificationMethod !in identificationMethods) {
            throw PilotValidationException("Unbekannte Identifikationsmethode.")
        }
        val now = clock.instant()
        if (
            input.plannedArrivalAt.isBefore(now.minus(Duration.ofHours(24))) ||
            input.plannedArrivalAt.isAfter(now.plus(Duration.ofDays(90)))
        ) {
            throw PilotValidationException("Der Demo-Termin muss innerhalb der nächsten 90 Tage liegen.")
        }
        if (input.identificationMethod == "license-plate") {
            val plate = normalizeCredential(input.syntheticLicensePlate.orEmpty())
            if (!plate.matches(Regex("^DEMO-[A-Z0-9-]{2,20}$"))) {
                throw PilotValidationException("Das synthetische Kennzeichen muss mit 'DEMO-' beginnen.")
            }
        } else if (!input.syntheticLicensePlate.isNullOrBlank()) {
            throw PilotValidationException("Bei Zugang per Code darf kein Kennzeichen übertragen werden.")
        }
    }

    private fun validateIdempotencyKey(value: String) {
        if (value.length !in 16..120) {
            throw PilotValidationException("Der Idempotency-Key muss zwischen 16 und 120 Zeichen lang sein.")
        }
    }

    private fun credentialFor(input: RecyclingAccessRequestInput): String =
        if (input.identificationMethod == "license-plate") {
            normalizeCredential(input.syntheticLicensePlate.orEmpty())
        } else {
            "RIT-${100000 + random.nextInt(900000)}"
        }

    private fun normalizeCredential(value: String) = value.trim().uppercase(Locale.ROOT).replace(" ", "")

    private fun credentialHint(
        method: String,
        credential: String,
    ) = if (method == "license-plate") credential else "RIT-••••••"

    private fun hashCredential(value: String): String =
        HexFormat.of().formatHex(
            MessageDigest.getInstance("SHA-256").digest(value.toByteArray(StandardCharsets.UTF_8)),
        )

    private fun randomHex(length: Int): String =
        UUID
            .randomUUID()
            .toString()
            .replace("-", "")
            .uppercase(Locale.ROOT)
            .take(length)

    private fun randomToken(): String = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "")

    private fun eventLabel(eventType: String): String =
        when (eventType) {
            "arrival-scan" -> "Kennung erkannt – Einfahrt freigegeben und Schranke geöffnet."
            "entry-confirmed" -> "Fahrzeug eingefahren – Schranke wieder geschlossen."
            "exit-scan" -> "Ausfahrt erkannt – Schranke für die Ausfahrt geöffnet."
            else -> "Ausfahrt abgeschlossen – Schranke geschlossen."
        }

    private fun StoredRecyclingAccessRequest.toView(credential: String?): RecyclingAccessRequestView =
        RecyclingAccessRequestView(
            reference = reference,
            accessToken = accessToken,
            tenantId = tenantId,
            siteId = siteId,
            siteName = siteName,
            plannedArrivalAt = plannedArrivalAt,
            accessWindowStart = accessWindowStart,
            accessWindowEnd = accessWindowEnd,
            wasteType = wasteType,
            itemDescription = itemDescription,
            identificationMethod = identificationMethod,
            credential = credential,
            credentialHint = credentialHint,
            status = status,
            gateState = gateState,
            nextSimulationEvent = transitions[status]?.eventType,
            events = repository.events(id),
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private data class Transition(
        val eventType: String,
        val status: String,
        val gateState: String,
    )
}

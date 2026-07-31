package de.regioit.abfall.api.cases

import de.regioit.abfall.api.content.ContentRepository
import de.regioit.abfall.api.support.PilotConflictException
import de.regioit.abfall.api.support.PilotNotFoundException
import de.regioit.abfall.api.support.PilotValidationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.util.Locale
import java.util.UUID

@Service
class CaseService(
    private val repository: CaseRepository,
    private val contentRepository: ContentRepository,
    private val clock: Clock,
) {
    private val defectCategories =
        setOf("bin-not-emptied", "damaged-bin", "illegal-dumping", "dirty-site", "depot-container", "other")
    private val allowedAttachmentExtensions = setOf("jpg", "jpeg", "png", "heic")
    private val allowedTransitions =
        mapOf(
            "received" to setOf("in-review", "rejected"),
            "in-review" to setOf("needs-info", "in-progress", "rejected"),
            "needs-info" to setOf("in-progress", "closed"),
            "in-progress" to setOf("completed", "rejected"),
            "completed" to setOf("closed"),
            "rejected" to setOf("closed"),
            "closed" to emptySet(),
        )

    @Transactional
    @Synchronized
    fun createDefect(
        idempotencyKey: String,
        input: DefectCaseInput,
    ): CaseCreationResult {
        validateTenant(input.tenantId)
        validateIdempotencyKey(idempotencyKey)
        validateDefect(input)
        repository.findIdempotentCase(input.tenantId, "defect", idempotencyKey)?.let {
            return CaseCreationResult(it.createdResponse(), false)
        }

        val categoryLabel = defectCategoryLabel(input.category)
        val case =
            newCase(
                tenantId = input.tenantId,
                caseType = "defect",
                subject = categoryLabel,
                summary = "$categoryLabel · ${input.address.trim()} · ${input.description.trim()}",
            )
        repository.insertCase(case, input.contactEmail)
        repository.insertDefect(case.id, input)
        insertCaseFoundation(case, "defect", idempotencyKey, "Meldung eingegangen")
        return CaseCreationResult(case.createdResponse(), true)
    }

    fun bulkWasteRules(tenantId: String): BulkWasteRules {
        validateTenant(tenantId)
        return BulkWasteRules(
            tenantId = tenantId,
            maxTotalItems = 10,
            items = repository.bulkWasteRules(tenantId),
            preparationInstructions =
                "Bitte stellen Sie die angemeldeten Gegenstände am Abholtag bis 07:00 Uhr gut erreichbar bereit. " +
                    "Elektrogeräte stehen getrennt von Möbeln.",
        )
    }

    fun bulkWasteSlots(
        tenantId: String,
        addressId: String,
    ): List<BulkWasteSlot> {
        validateTenant(tenantId)
        validateAddress(tenantId, addressId)
        return repository.bulkWasteSlots(tenantId)
    }

    @Transactional
    @Synchronized
    fun createBulkWasteOrder(
        idempotencyKey: String,
        input: BulkWasteOrderInput,
    ): CaseCreationResult {
        validateTenant(input.tenantId)
        validateIdempotencyKey(idempotencyKey)
        validateAddress(input.tenantId, input.addressId)
        repository.findIdempotentCase(input.tenantId, "bulk-waste", idempotencyKey)?.let {
            return CaseCreationResult(it.createdResponse(), false)
        }

        val rules = repository.bulkWasteRules(input.tenantId).associateBy(BulkWasteItemRule::id)
        val totalQuantity = input.items.sumOf(BulkWasteOrderItem::quantity)
        if (totalQuantity > 10) {
            throw PilotValidationException("Im Pilot können höchstens zehn Gegenstände angemeldet werden.")
        }
        input.items.forEach { item ->
            val rule =
                rules[item.itemTypeId]
                    ?: throw PilotValidationException("Unbekannte Sperrmüllkategorie: ${item.itemTypeId}")
            if (item.quantity > rule.maxQuantity) {
                throw PilotValidationException("Für ${rule.label} sind höchstens ${rule.maxQuantity} Stück zulässig.")
            }
        }

        val slot =
            repository.lockSlot(input.tenantId, input.slotId)
                ?: throw PilotNotFoundException("Der ausgewählte Sperrmülltermin ist nicht vorhanden.")
        if (slot.reserved >= slot.capacity) {
            throw PilotConflictException("Der ausgewählte Sperrmülltermin ist inzwischen ausgebucht.")
        }

        val itemSummary =
            input.items.joinToString(", ") { item ->
                "${item.quantity} × ${rules.getValue(item.itemTypeId).label}"
            }
        val case =
            newCase(
                tenantId = input.tenantId,
                caseType = "bulk-waste",
                subject = "Sperrmüllabholung",
                summary = itemSummary,
            )
        repository.reserveSlot(input.slotId)
        repository.insertCase(case, input.contactEmail)
        repository.insertBulkWasteOrder(case.id, input)
        insertCaseFoundation(case, "bulk-waste", idempotencyKey, "Sperrmüllanmeldung eingegangen")
        return CaseCreationResult(case.createdResponse(), true)
    }

    fun getCase(
        reference: String,
        accessToken: String,
    ): CaseDetail {
        if (accessToken.length < 32) {
            throw PilotNotFoundException("Vorgang oder Zugriffsschlüssel ist nicht gültig.")
        }
        val case =
            repository.findCase(reference, accessToken)
                ?: throw PilotNotFoundException("Vorgang oder Zugriffsschlüssel ist nicht gültig.")
        return case.detail()
    }

    fun listCases(tenantId: String): List<CaseDetail> {
        validateTenant(tenantId)
        return repository.listCases(tenantId).map { it.detail() }
    }

    @Transactional
    fun updateStatus(
        reference: String,
        input: CaseStatusInput,
    ): CaseDetail {
        val case =
            repository.findCaseForAdmin(reference)
                ?: throw PilotNotFoundException("Der Vorgang $reference ist nicht vorhanden.")
        val possible = allowedTransitions[case.status].orEmpty()
        if (input.status !in possible) {
            throw PilotValidationException("Statuswechsel von ${case.status} zu ${input.status} ist nicht zulässig.")
        }
        val now = clock.instant()
        repository.updateStatus(case.id, input.status, now)
        repository.insertInitialEvent(
            eventId = UUID.randomUUID().toString(),
            caseId = case.id,
            status = input.status,
            publicLabel = input.publicLabel.trim(),
            occurredAt = now,
        )
        return repository.findCaseForAdmin(reference)!!.detail()
    }

    private fun insertCaseFoundation(
        case: StoredCase,
        operation: String,
        idempotencyKey: String,
        publicLabel: String,
    ) {
        repository.insertInitialEvent(
            eventId = UUID.randomUUID().toString(),
            caseId = case.id,
            status = case.status,
            publicLabel = publicLabel,
            occurredAt = case.createdAt,
        )
        repository.insertIdempotency(case.tenantId, operation, idempotencyKey, case.id, case.createdAt)
        repository.insertOutboxEvent(
            id = UUID.randomUUID().toString(),
            aggregateId = case.id,
            eventType = "case-created",
            payload = "{\"reference\":\"${case.reference}\",\"caseType\":\"${case.caseType}\"}",
            createdAt = case.createdAt,
        )
    }

    private fun newCase(
        tenantId: String,
        caseType: String,
        subject: String,
        summary: String,
    ): StoredCase {
        val now = clock.instant()
        val publicReference =
            "DEMO-${UUID.randomUUID().toString().replace("-", "").uppercase(Locale.ROOT).take(20)}"
        val accessToken =
            UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "")
        return StoredCase(
            id = UUID.randomUUID().toString(),
            reference = publicReference,
            tenantId = tenantId,
            caseType = caseType,
            subject = subject,
            status = "received",
            summary = summary,
            accessToken = accessToken,
            createdAt = now,
            updatedAt = now,
        )
    }

    private fun validateDefect(input: DefectCaseInput) {
        if (input.category !in defectCategories) {
            throw PilotValidationException("Unbekannte Mängelkategorie: ${input.category}")
        }
        if (!input.consent) {
            throw PilotValidationException("Die Zustimmung ist für den Pilotvorgang erforderlich.")
        }
        input.attachmentNames.forEach { name ->
            val extension = name.substringAfterLast('.', "").lowercase(Locale.ROOT)
            if (extension !in allowedAttachmentExtensions) {
                throw PilotValidationException("Im Pilot sind nur JPG-, PNG- oder HEIC-Bilder auswählbar.")
            }
        }
    }

    private fun validateIdempotencyKey(value: String) {
        if (value.length !in 16..120) {
            throw PilotValidationException("Der Idempotency-Key muss zwischen 16 und 120 Zeichen lang sein.")
        }
    }

    private fun validateTenant(tenantId: String) {
        if (tenantId != "demo") {
            throw PilotNotFoundException("Der Pilotmandant '$tenantId' ist nicht vorhanden.")
        }
    }

    private fun validateAddress(
        tenantId: String,
        addressId: String,
    ) {
        if (!contentRepository.addressExists(tenantId, addressId)) {
            throw PilotNotFoundException("Die ausgewählte Testadresse ist nicht vorhanden.")
        }
    }

    private fun defectCategoryLabel(category: String): String =
        when (category) {
            "bin-not-emptied" -> "Tonne nicht geleert"
            "damaged-bin" -> "Beschädigter Behälter"
            "illegal-dumping" -> "Illegal abgelagerter Abfall"
            "dirty-site" -> "Verschmutzter Standort"
            "depot-container" -> "Problem am Depotcontainer"
            else -> "Sonstige Reklamation"
        }

    private fun StoredCase.createdResponse() =
        CaseCreated(reference = reference, accessToken = accessToken, status = status, createdAt = createdAt)

    private fun StoredCase.detail() =
        CaseDetail(
            reference = reference,
            tenantId = tenantId,
            caseType = caseType,
            subject = subject,
            status = status,
            createdAt = createdAt,
            updatedAt = updatedAt,
            summary = summary,
            events = repository.events(id),
        )
}

package de.regioit.abfall.api.monitoring

import de.regioit.abfall.api.tenant.WasteProperties
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.LocalDate
import java.time.ZoneId

@Service
class MonitoringService(
    private val repository: MonitoringRepository,
    private val properties: MonitoringProperties,
    private val wasteProperties: WasteProperties,
    private val clock: Clock,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun summary(): MonitoringSummary {
        val now = clock.instant()
        val cutoff = now.minus(Duration.ofDays(properties.retentionDays))
        val timezone = wasteProperties.tenants["demo"]?.timezone ?: "Europe/Berlin"
        return MonitoringSummary(
            status = "ready",
            generatedAt = now,
            retentionDays = properties.retentionDays,
            statistics = repository.statistics(LocalDate.now(clock.withZone(ZoneId.of(timezone))), now, cutoff),
            lastMaintenance = repository.lastMaintenance(),
        )
    }

    @Transactional
    fun cleanup(): MaintenanceResult {
        val now = clock.instant()
        val cutoff = now.minus(Duration.ofDays(properties.retentionDays))
        val candidates = repository.cleanupCandidates(cutoff)
        val result =
            when {
                !properties.cleanupEnabled ->
                    result(
                        "disabled",
                        now,
                        cutoff,
                        candidates,
                        "Löschung ist per Laufzeitkonfiguration deaktiviert.",
                    )
                candidates > properties.maximumRowsPerRun ->
                    result(
                        "blocked",
                        now,
                        cutoff,
                        candidates,
                        "Sicherheitslimit von ${properties.maximumRowsPerRun} Datensätzen überschritten; nichts gelöscht.",
                    )
                else -> {
                    val outbox = repository.deletePublishedOutboxEvents(cutoff)
                    val caseIdempotency = repository.deleteCaseIdempotencyRecords(cutoff)
                    val accessIdempotency = repository.deleteAccessIdempotencyRecords(cutoff)
                    MaintenanceResult(
                        status = "completed",
                        executedAt = now,
                        cutoffAt = cutoff,
                        candidateCount = candidates,
                        deletedOutboxEvents = outbox,
                        deletedCaseIdempotencyRecords = caseIdempotency,
                        deletedAccessIdempotencyRecords = accessIdempotency,
                        finding =
                            "${outbox + caseIdempotency + accessIdempotency} technische Alt-Datensätze gelöscht; Fachhistorien unverändert.",
                    )
                }
            }
        repository.save(result)
        logger.info(
            "Quality maintenance status={} candidates={} deleted={} cutoff={}",
            result.status,
            result.candidateCount,
            result.deletedTotal,
            result.cutoffAt,
        )
        return result
    }

    private fun result(
        status: String,
        now: java.time.Instant,
        cutoff: java.time.Instant,
        candidates: Int,
        finding: String,
    ) = MaintenanceResult(
        status = status,
        executedAt = now,
        cutoffAt = cutoff,
        candidateCount = candidates,
        deletedOutboxEvents = 0,
        deletedCaseIdempotencyRecords = 0,
        deletedAccessIdempotencyRecords = 0,
        finding = finding,
    )
}

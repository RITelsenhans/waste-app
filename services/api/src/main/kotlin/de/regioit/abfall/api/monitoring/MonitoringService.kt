package de.regioit.abfall.api.monitoring

import de.regioit.abfall.api.tenant.WasteProperties
import org.slf4j.LoggerFactory
import org.springframework.boot.SpringBootVersion
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.LocalDate
import java.time.ZoneId
import java.util.Locale

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
            release =
                MonitoringRelease(
                    provider = if (properties.releaseCommitSha == "unknown") "local" else "railway",
                    commitSha = properties.releaseCommitSha,
                    branch = properties.releaseBranch,
                    applicationVersion = javaClass.`package`.implementationVersion ?: "development",
                    javaVersion = System.getProperty("java.version"),
                    springBootVersion = SpringBootVersion.getVersion(),
                    kotlinVersion = KotlinVersion.CURRENT.toString(),
                ),
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

    @Transactional
    fun cleanupQualityAgentAccess(input: QualityAgentAccessCleanupInput): QualityAgentAccessCleanupResult {
        val reference = input.reference.trim().uppercase(Locale.ROOT)
        val credential =
            input.syntheticCredential
                .trim()
                .uppercase(Locale.ROOT)
                .replace(" ", "")
        if (!reference.matches(Regex("^DEMO-Z-[A-F0-9]{12}$")) || !credential.matches(Regex("^DEMO-QA-[A-Z0-9-]{2,16}$"))) {
            return qualityAgentCleanupResult(
                "blocked",
                reference,
                "Nur eindeutig markierte synthetische Qualitätsagent-Daten dürfen entfernt werden.",
            )
        }
        if (!properties.cleanupEnabled) {
            return qualityAgentCleanupResult(
                "disabled",
                reference,
                "Die Bereinigung synthetischer Qualitätsagent-Daten ist deaktiviert.",
            )
        }
        val candidate =
            repository.findRecentQualityAgentAccess(
                reference,
                credential,
                clock.instant().minus(Duration.ofHours(1)),
            ) ?: return qualityAgentCleanupResult(
                "blocked",
                reference,
                "Kein passender, höchstens eine Stunde alter Qualitätsagent-Vorgang gefunden; nichts gelöscht.",
            )
        val idempotency = repository.deleteQualityAgentAccessIdempotency(candidate.id)
        val events = repository.deleteQualityAgentAccessEvents(candidate.id)
        val requests = repository.deleteQualityAgentAccessRequest(candidate.id)
        val result =
            QualityAgentAccessCleanupResult(
                status = if (requests == 1) "completed" else "blocked",
                reference = candidate.reference,
                deletedEvents = events,
                deletedIdempotencyRecords = idempotency,
                deletedRequests = requests,
                finding =
                    if (requests == 1) {
                        "Der ausschließlich synthetische Qualitätsagent-Zugang wurde vollständig entfernt."
                    } else {
                        "Der markierte Qualitätsagent-Zugang konnte nicht eindeutig entfernt werden."
                    },
            )
        logger.info(
            "Quality-agent access cleanup status={} reference={} deleted={}",
            result.status,
            result.reference,
            result.deletedTotal,
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

    private fun qualityAgentCleanupResult(
        status: String,
        reference: String,
        finding: String,
    ) = QualityAgentAccessCleanupResult(
        status = status,
        reference = reference,
        deletedEvents = 0,
        deletedIdempotencyRecords = 0,
        deletedRequests = 0,
        finding = finding,
    )
}

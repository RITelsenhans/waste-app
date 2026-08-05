package de.regioit.abfall.api.monitoring

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Instant

@ConfigurationProperties("waste.monitoring")
data class MonitoringProperties(
    val enabled: Boolean = false,
    val token: String = "",
    val cleanupEnabled: Boolean = false,
    val retentionDays: Long = 30,
    val maximumRowsPerRun: Int = 500,
)

data class MonitoringStatistics(
    val upcomingCollectionEvents: Int,
    val outdatedCollectionEvents: Int,
    val activeNotices: Int,
    val expiredNotices: Int,
    val openCases: Int,
    val completedCases: Int,
    val pendingOutboxEvents: Int,
    val failedOutboxEvents: Int,
    val completedRecyclingAccessRequests: Int,
    val cleanupCandidates: Int,
)

data class MonitoringSummary(
    val status: String,
    val generatedAt: Instant,
    val retentionDays: Long,
    val statistics: MonitoringStatistics,
    val lastMaintenance: MaintenanceResult?,
)

data class MaintenanceResult(
    val status: String,
    val executedAt: Instant,
    val cutoffAt: Instant,
    val candidateCount: Int,
    val deletedOutboxEvents: Int,
    val deletedCaseIdempotencyRecords: Int,
    val deletedAccessIdempotencyRecords: Int,
    val finding: String,
) {
    val deletedTotal: Int
        get() =
            deletedOutboxEvents +
                deletedCaseIdempotencyRecords +
                deletedAccessIdempotencyRecords
}

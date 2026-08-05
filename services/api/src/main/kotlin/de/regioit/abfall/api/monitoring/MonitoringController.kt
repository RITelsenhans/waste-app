package de.regioit.abfall.api.monitoring

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Configuration
class MonitoringConfiguration {
    @Bean
    fun monitoringGuard(properties: MonitoringProperties): MonitoringGuard = MonitoringGuard(properties)
}

@RestController
@RequestMapping("/v1/monitoring")
@ConditionalOnProperty(prefix = "waste.monitoring", name = ["enabled"], havingValue = "true")
class MonitoringController(
    private val guard: MonitoringGuard,
    private val service: MonitoringService,
) {
    @GetMapping("/summary")
    fun summary(
        @RequestHeader("X-Monitoring-Token", required = false) token: String?,
    ): MonitoringSummary {
        guard.check(token)
        return service.summary()
    }

    @PostMapping("/maintenance")
    fun maintenance(
        @RequestHeader("X-Monitoring-Token", required = false) token: String?,
    ): MaintenanceResult {
        guard.check(token)
        return service.cleanup()
    }
}

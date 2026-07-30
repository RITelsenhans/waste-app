package de.regioit.abfall.api.health

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Clock
import java.time.Instant

data class ReadyResponse(
    val status: String,
    val checkedAt: Instant,
)

@Configuration
class HealthConfiguration {
    @Bean
    fun clock(): Clock = Clock.systemUTC()
}

@RestController
@RequestMapping("/v1/health")
class ReadyController(
    private val clock: Clock,
) {
    @GetMapping("/ready")
    fun ready(): ReadyResponse = ReadyResponse(status = "ready", checkedAt = clock.instant())
}

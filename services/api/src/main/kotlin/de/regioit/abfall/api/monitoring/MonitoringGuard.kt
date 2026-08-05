package de.regioit.abfall.api.monitoring

import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

class MonitoringGuard(
    private val properties: MonitoringProperties,
) {
    fun check(candidate: String?) {
        if (candidate == null || properties.token.length < MINIMUM_TOKEN_LENGTH) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Monitoring-Zugriff verweigert.")
        }
        val actual = digest(candidate)
        val expected = digest(properties.token)
        if (!MessageDigest.isEqual(actual, expected)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Monitoring-Zugriff verweigert.")
        }
    }

    private fun digest(value: String): ByteArray =
        MessageDigest
            .getInstance("SHA-256")
            .digest(value.toByteArray(StandardCharsets.UTF_8))

    private companion object {
        const val MINIMUM_TOKEN_LENGTH = 32
    }
}

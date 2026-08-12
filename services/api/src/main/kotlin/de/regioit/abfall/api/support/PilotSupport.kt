package de.regioit.abfall.api.support

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.stereotype.Component
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.net.URI
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

@ConfigurationProperties("waste.pilot")
data class PilotProperties(
    val adminEnabled: Boolean = false,
    val adminToken: String = "",
    val allowedOrigins: List<String> = emptyList(),
)

class PilotValidationException(
    message: String,
) : RuntimeException(message)

class PilotNotFoundException(
    message: String,
) : RuntimeException(message)

class PilotConflictException(
    message: String,
) : RuntimeException(message)

class PilotAdminDisabledException : RuntimeException("Die lokale Pilotpflege ist deaktiviert.")

class PilotAdminGuard(
    private val properties: PilotProperties,
) {
    fun check() {
        if (!properties.adminEnabled) {
            throw PilotAdminDisabledException()
        }
    }
}

@Component
class PilotAdminTokenFilter(
    private val properties: PilotProperties,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        !request.requestURI.startsWith("/v1/admin/") && request.requestURI != "/v1/admin"

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        if (!properties.adminEnabled) {
            writeProblem(
                response,
                HttpStatus.FORBIDDEN,
                "Pilotpflege deaktiviert",
                "Die lokale Pilotpflege ist deaktiviert.",
                "/problems/admin-disabled",
            )
            return
        }
        if (properties.adminToken.length < 32) {
            writeProblem(
                response,
                HttpStatus.SERVICE_UNAVAILABLE,
                "Pilotpflege nicht vollständig konfiguriert",
                "Der interne Admin-Zugang ist nicht sicher konfiguriert.",
                "/problems/admin-not-configured",
            )
            return
        }

        val supplied = request.getHeader("X-Pilot-Admin-Token").orEmpty()
        if (!secureEquals(supplied, properties.adminToken)) {
            writeProblem(
                response,
                HttpStatus.UNAUTHORIZED,
                "Admin-Anmeldung erforderlich",
                "Für diesen administrativen Aufruf fehlt eine gültige Berechtigung.",
                "/problems/admin-authentication-required",
            )
            return
        }
        filterChain.doFilter(request, response)
    }

    private fun secureEquals(
        candidate: String,
        expected: String,
    ): Boolean =
        MessageDigest.isEqual(
            candidate.toByteArray(StandardCharsets.UTF_8),
            expected.toByteArray(StandardCharsets.UTF_8),
        )

    private fun writeProblem(
        response: HttpServletResponse,
        status: HttpStatus,
        title: String,
        detail: String,
        type: String,
    ) {
        response.status = status.value()
        response.contentType = "application/problem+json"
        response.characterEncoding = StandardCharsets.UTF_8.name()
        response.writer.write(
            """{"type":"$type","title":"$title","status":${status.value()},"detail":"$detail"}""",
        )
    }
}

@Configuration
class PilotWebConfiguration(
    private val properties: PilotProperties,
) : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        if (properties.allowedOrigins.isNotEmpty()) {
            registry
                .addMapping("/v1/**")
                .allowedOrigins(*properties.allowedOrigins.toTypedArray())
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Idempotency-Key", "X-Monitoring-Token", "Accept")
        }
    }
}

@Configuration
class PilotSupportConfiguration {
    @org.springframework.context.annotation.Bean
    fun pilotAdminGuard(properties: PilotProperties): PilotAdminGuard = PilotAdminGuard(properties)
}

@RestControllerAdvice
class PilotProblemHandler {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleInvalidArgument(error: MethodArgumentNotValidException): ProblemDetail {
        val detail =
            error.bindingResult.allErrors.joinToString(" ") { issue ->
                val field = (issue as? FieldError)?.field
                if (field == null) issue.defaultMessage.orEmpty() else "$field: ${issue.defaultMessage}"
            }
        return problem(HttpStatus.BAD_REQUEST, "Eingabe ungültig", detail, "/problems/invalid-input")
    }

    @ExceptionHandler(PilotValidationException::class)
    fun handleValidation(error: PilotValidationException): ProblemDetail =
        problem(HttpStatus.BAD_REQUEST, "Eingabe ungültig", error.message.orEmpty(), "/problems/invalid-input")

    @ExceptionHandler(PilotNotFoundException::class)
    fun handleNotFound(error: PilotNotFoundException): ProblemDetail =
        problem(HttpStatus.NOT_FOUND, "Nicht gefunden", error.message.orEmpty(), "/problems/not-found")

    @ExceptionHandler(PilotConflictException::class)
    fun handleConflict(error: PilotConflictException): ProblemDetail =
        problem(HttpStatus.CONFLICT, "Konflikt", error.message.orEmpty(), "/problems/conflict")

    @ExceptionHandler(PilotAdminDisabledException::class)
    fun handleAdminDisabled(error: PilotAdminDisabledException): ProblemDetail =
        problem(HttpStatus.FORBIDDEN, "Pilotpflege deaktiviert", error.message.orEmpty(), "/problems/admin-disabled")

    private fun problem(
        status: HttpStatus,
        title: String,
        detail: String,
        type: String,
    ): ProblemDetail =
        ProblemDetail.forStatusAndDetail(status, detail).apply {
            this.title = title
            this.type = URI.create(type)
        }
}

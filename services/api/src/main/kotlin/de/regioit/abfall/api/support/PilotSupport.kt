package de.regioit.abfall.api.support

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.net.URI

@ConfigurationProperties("waste.pilot")
data class PilotProperties(
    val adminEnabled: Boolean = false,
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
                .allowedHeaders("Content-Type", "Idempotency-Key", "Accept")
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

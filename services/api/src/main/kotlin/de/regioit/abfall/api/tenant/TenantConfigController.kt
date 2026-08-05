package de.regioit.abfall.api.tenant

import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.net.URI

class TenantNotFoundException : RuntimeException()

@RestController
@RequestMapping("/v1/tenants")
class TenantConfigController(
    private val service: TenantConfigService,
) {
    @GetMapping
    fun municipalities(): List<MunicipalitySummary> = service.municipalities()

    @GetMapping("/{tenantKey}/config")
    fun getConfig(
        @PathVariable tenantKey: String,
    ): TenantConfig = service.config(tenantKey)
}

@RestControllerAdvice
class TenantProblemHandler {
    @ExceptionHandler(TenantNotFoundException::class)
    fun handleTenantNotFound(): ProblemDetail =
        ProblemDetail
            .forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                "Für diesen Einstieg ist kein Mandant konfiguriert.",
            ).apply {
                type = URI.create("/problems/tenant-not-found")
                title = "Mandant nicht gefunden"
            }
}

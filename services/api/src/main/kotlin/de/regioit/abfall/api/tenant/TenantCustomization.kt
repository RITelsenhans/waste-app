package de.regioit.abfall.api.tenant

import de.regioit.abfall.api.support.PilotAdminGuard
import de.regioit.abfall.api.support.PilotNotFoundException
import de.regioit.abfall.api.support.PilotValidationException
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class MunicipalityCustomizationInput(
    @field:NotBlank val name: String,
    @field:NotBlank val shortName: String,
    @field:NotBlank val city: String,
    @field:NotBlank val reportingOffice: String,
    @field:NotBlank val phone: String,
    @field:Email @field:NotBlank val email: String,
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$") val primaryColor: String,
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$") val infoColor: String,
)

data class MunicipalityCustomization(
    val tenantId: String,
    val name: String,
    val shortName: String,
    val city: String,
    val reportingOffice: String,
    val phone: String,
    val email: String,
    val primaryColor: String,
    val infoColor: String,
)

data class MunicipalitySummary(
    val tenantId: String,
    val name: String,
    val shortName: String,
    val city: String,
    val primaryColor: String,
)

interface TenantCustomizationStore {
    fun find(tenantId: String): MunicipalityCustomization?

    fun update(
        tenantId: String,
        input: MunicipalityCustomizationInput,
    ): MunicipalityCustomization
}

@Repository
class TenantCustomizationRepository(
    private val jdbc: JdbcClient,
) : TenantCustomizationStore {
    override fun find(tenantId: String): MunicipalityCustomization? =
        jdbc
            .sql(
                """
                select tenant_id, name, short_name, city, reporting_office, phone, email,
                       primary_color, info_color
                from municipality_customization where tenant_id = :tenantId
                """.trimIndent(),
            ).param("tenantId", tenantId)
            .query { row, _ ->
                MunicipalityCustomization(
                    tenantId = row.getString("tenant_id"),
                    name = row.getString("name"),
                    shortName = row.getString("short_name"),
                    city = row.getString("city"),
                    reportingOffice = row.getString("reporting_office"),
                    phone = row.getString("phone"),
                    email = row.getString("email"),
                    primaryColor = row.getString("primary_color"),
                    infoColor = row.getString("info_color"),
                )
            }.optional()
            .orElse(null)

    override fun update(
        tenantId: String,
        input: MunicipalityCustomizationInput,
    ): MunicipalityCustomization {
        val changed =
            jdbc
                .sql(
                    """
                    update municipality_customization
                    set name = :name, short_name = :shortName, city = :city,
                        reporting_office = :reportingOffice, phone = :phone, email = :email,
                        primary_color = :primaryColor, info_color = :infoColor,
                        updated_at = current_timestamp
                    where tenant_id = :tenantId
                    """.trimIndent(),
                ).param("tenantId", tenantId)
                .param("name", input.name.trim())
                .param("shortName", input.shortName.trim())
                .param("city", input.city.trim())
                .param("reportingOffice", input.reportingOffice.trim())
                .param("phone", input.phone.trim())
                .param("email", input.email.trim())
                .param("primaryColor", input.primaryColor.uppercase())
                .param("infoColor", input.infoColor.uppercase())
                .update()
        if (changed == 0) throw PilotNotFoundException("Die Kommune '$tenantId' ist nicht vorhanden.")
        return requireNotNull(find(tenantId))
    }
}

@Service
class TenantConfigService(
    private val properties: WasteProperties,
    private val repository: TenantCustomizationStore,
) {
    fun municipalities(): List<MunicipalitySummary> =
        properties.tenants.keys
            .map(::config)
            .map {
                MunicipalitySummary(
                    tenantId = it.tenantId,
                    name = it.name,
                    shortName = it.shortName,
                    city = it.serviceArea.city,
                    primaryColor = it.branding.primaryColor,
                )
            }.sortedBy(MunicipalitySummary::name)

    fun customization(tenantKey: String): MunicipalityCustomization = repository.find(tenantKey) ?: throw TenantNotFoundException()

    fun config(tenantKey: String): TenantConfig {
        val base = properties.tenants[tenantKey] ?: throw TenantNotFoundException()
        val custom = repository.find(tenantKey) ?: return base
        return base.copy(
            name = custom.name,
            shortName = custom.shortName,
            branding =
                base.branding.copy(
                    primaryColor = custom.primaryColor,
                    infoColor = custom.infoColor,
                ),
            serviceArea =
                ServiceArea(
                    city = custom.city,
                    reportingOffice = custom.reportingOffice,
                    phone = custom.phone,
                    email = custom.email,
                ),
            supportContacts =
                listOf(
                    SupportContact(
                        label = custom.reportingOffice,
                        email = custom.email,
                        phone = custom.phone,
                    ),
                ),
        )
    }

    @Transactional
    fun update(
        tenantKey: String,
        input: MunicipalityCustomizationInput,
    ): MunicipalityCustomization {
        if (tenantKey !in properties.tenants) throw PilotValidationException("Unbekannte Kommune: $tenantKey")
        return repository.update(tenantKey, input)
    }
}

@RestController
@RequestMapping("/v1/admin/tenants")
class TenantCustomizationController(
    private val service: TenantConfigService,
    private val guard: PilotAdminGuard,
) {
    @GetMapping("/{tenantKey}")
    fun get(
        @PathVariable tenantKey: String,
    ): MunicipalityCustomization {
        guard.check()
        return service.customization(tenantKey)
    }

    @PutMapping("/{tenantKey}")
    fun update(
        @PathVariable tenantKey: String,
        @Valid @RequestBody input: MunicipalityCustomizationInput,
    ): MunicipalityCustomization {
        guard.check()
        return service.update(tenantKey, input)
    }
}

package de.regioit.abfall.api

import de.regioit.abfall.api.health.ReadyController
import de.regioit.abfall.api.tenant.MunicipalityCustomization
import de.regioit.abfall.api.tenant.MunicipalityCustomizationInput
import de.regioit.abfall.api.tenant.TenantConfig
import de.regioit.abfall.api.tenant.TenantConfigController
import de.regioit.abfall.api.tenant.TenantConfigService
import de.regioit.abfall.api.tenant.TenantCustomizationStore
import de.regioit.abfall.api.tenant.TenantNotFoundException
import de.regioit.abfall.api.tenant.WasteProperties
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class FoundationUnitTests {
    @Test
    fun `readiness uses the injected UTC clock`() {
        val instant = Instant.parse("2026-07-30T12:00:00Z")
        val controller = ReadyController(Clock.fixed(instant, ZoneOffset.UTC))

        val response = controller.ready()

        assertEquals("ready", response.status)
        assertEquals(instant, response.checkedAt)
    }

    @Test
    fun `tenant controller only returns configured tenants`() {
        val demo = TenantConfig(tenantId = "demo", name = "Demo Kommune")
        val store =
            object : TenantCustomizationStore {
                override fun find(tenantId: String): MunicipalityCustomization? = null

                override fun update(
                    tenantId: String,
                    input: MunicipalityCustomizationInput,
                ): MunicipalityCustomization = error("not needed")
            }
        val controller = TenantConfigController(TenantConfigService(WasteProperties(mapOf("demo" to demo)), store))

        assertEquals(demo, controller.getConfig("demo"))
        assertFailsWith<TenantNotFoundException> {
            controller.getConfig("unknown")
        }
    }
}

package de.regioit.abfall.api.tenant

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("waste")
data class WasteProperties(
    val tenants: Map<String, TenantConfig> = emptyMap(),
)

data class TenantConfig(
    val tenantId: String = "",
    val name: String = "",
    val shortName: String = "",
    val branding: Branding = Branding(),
    val timezone: String = "Europe/Berlin",
    val locales: List<String> = listOf("de-DE"),
    val enabledFeatures: Map<String, Boolean> = emptyMap(),
    val legalLinks: LegalLinks = LegalLinks(),
    val serviceArea: ServiceArea = ServiceArea(),
    val supportContacts: List<SupportContact> = emptyList(),
    val contentVersion: String = "",
)

data class Branding(
    val logoUrl: String = "",
    val primaryColor: String = "#C8102E",
    val infoColor: String = "#008F8C",
)

data class LegalLinks(
    val imprint: String = "",
    val privacy: String = "",
    val accessibility: String = "",
)

data class SupportContact(
    val label: String = "",
    val email: String = "",
    val phone: String = "",
)

data class ServiceArea(
    val city: String = "",
    val reportingOffice: String = "",
    val phone: String = "",
    val email: String = "",
)

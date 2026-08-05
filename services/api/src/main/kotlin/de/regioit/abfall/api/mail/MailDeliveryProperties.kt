package de.regioit.abfall.api.mail

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("waste.mail")
data class MailDeliveryProperties(
    val enabled: Boolean = false,
    val from: String = "abfall-app@demo.invalid",
    val appBaseUrl: String = "http://localhost:3000/demo",
)

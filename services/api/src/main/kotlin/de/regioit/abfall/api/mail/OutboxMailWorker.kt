package de.regioit.abfall.api.mail

import de.regioit.abfall.api.cases.CaseRepository
import de.regioit.abfall.api.cases.PendingMailEvent
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Instant
import kotlin.math.min

@Component
@ConditionalOnProperty(prefix = "waste.mail", name = ["enabled"], havingValue = "true")
class OutboxMailWorker(
    private val repository: CaseRepository,
    private val mailSender: JavaMailSender,
    private val properties: MailDeliveryProperties,
    private val clock: Clock,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val renderer = DefectConfirmationMail()

    @Scheduled(fixedDelayString = "\${waste.mail.poll-interval-ms:1000}")
    fun deliverPendingMails() {
        repository.pendingDefectConfirmationMails(clock.instant(), 10).forEach(::deliver)
    }

    private fun deliver(event: PendingMailEvent) {
        try {
            val rendered =
                renderer.render(
                    reference = event.reference,
                    caseSubject = event.subject,
                    summary = event.summary,
                    appBaseUrl = properties.appBaseUrl,
                )
            val message: MimeMessage = mailSender.createMimeMessage()
            MimeMessageHelper(message, true, "UTF-8").apply {
                setFrom(properties.from, "Regio IT Abfall APP")
                setTo(event.recipient)
                setSubject(rendered.subject)
                setText(rendered.plainText, rendered.html)
            }
            message.setHeader("X-Tags", "Abfall APP, Beschwerdebestätigung")
            mailSender.send(message)
            repository.markOutboxPublished(event.id, clock.instant())
            logger.info("Bestätigung für Vorgang {} wurde an das Testpostfach übergeben.", event.reference)
        } catch (error: Exception) {
            val nextAttempt = nextAttempt(clock.instant(), event.attemptCount)
            repository.recordOutboxFailure(
                event.id,
                error.message ?: error.javaClass.simpleName,
                nextAttempt,
            )
            logger.warn(
                "Bestätigung für Vorgang {} konnte nicht versendet werden; neuer Versuch um {}.",
                event.reference,
                nextAttempt,
            )
        }
    }

    private fun nextAttempt(
        now: Instant,
        attemptCount: Int,
    ): Instant {
        val delaySeconds = min(300L, 5L * (1L shl min(attemptCount, 6)))
        return now.plusSeconds(delaySeconds)
    }
}

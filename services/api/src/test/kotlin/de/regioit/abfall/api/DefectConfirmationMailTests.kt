package de.regioit.abfall.api

import de.regioit.abfall.api.mail.DefectConfirmationMail
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertFalse

class DefectConfirmationMailTests {
    private val renderer = DefectConfirmationMail()

    @Test
    fun `renders accessible plain text and branded html confirmation`() {
        val mail =
            renderer.render(
                reference = "DEMO-1234567890ABCDEFGHIJ",
                caseSubject = "Tonne nicht geleert",
                summary = "Tonne nicht geleert · Musterstraße 12",
                appBaseUrl = "http://localhost:3000/demo",
            )

        assertContains(mail.subject, "DEMO-1234567890ABCDEFGHIJ")
        assertContains(mail.plainText, "Musterstraße 12")
        assertContains(mail.html, "#c8102e")
        assertContains(mail.html, "Abfall APP öffnen")
    }

    @Test
    fun `escapes user controlled content in html`() {
        val mail =
            renderer.render(
                reference = "DEMO-123",
                caseSubject = "<script>alert('x')</script>",
                summary = "Behälter & Standort",
                appBaseUrl = "http://localhost/demo?a=1&b=2",
            )

        assertFalse(mail.html.contains("<script>"))
        assertContains(mail.html, "&lt;script&gt;")
        assertContains(mail.html, "Behälter &amp; Standort")
    }
}

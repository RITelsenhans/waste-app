package de.regioit.abfall.api.mail

data class RenderedMail(
    val subject: String,
    val plainText: String,
    val html: String,
)

class DefectConfirmationMail {
    fun render(
        reference: String,
        caseSubject: String,
        summary: String,
        appBaseUrl: String,
    ): RenderedMail {
        val escapedReference = escapeHtml(reference)
        val escapedSubject = escapeHtml(caseSubject)
        val escapedSummary = escapeHtml(summary)
        val escapedUrl = escapeHtml(appBaseUrl)
        return RenderedMail(
            subject = "Ihre Meldung $reference ist eingegangen",
            plainText =
                """
                Vielen Dank für Ihre Meldung.

                Referenz: $reference
                Anliegen: $caseSubject
                Zusammenfassung: $summary

                Ihre Meldung wurde in unserem Demo-System erfasst. Bitte bewahren Sie die Referenz auf.
                Abfall APP öffnen: $appBaseUrl

                Dies ist eine automatisch erzeugte Nachricht des lokalen Regio-IT-Piloten.
                """.trimIndent(),
            html =
                """
                <!doctype html>
                <html lang="de">
                  <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#17243d">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
                      <tr><td align="center">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d6dde6">
                          <tr><td style="height:8px;background:#c8102e"></td></tr>
                          <tr><td style="padding:32px">
                            <p style="margin:0 0 20px;color:#c8102e;font-size:24px;font-weight:700">regio iT · Abfall APP</p>
                            <p style="margin:0 0 8px;color:#006f6c;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Meldung eingegangen</p>
                            <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15">Vielen Dank für Ihre Meldung.</h1>
                            <p style="margin:0 0 24px;line-height:1.6">Wir haben Ihr Anliegen im lokalen Demo-System erfasst.</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf8f7;border-radius:12px;padding:20px">
                              <tr><td style="padding:4px 0;color:#526071">Referenz</td><td style="padding:4px 0;font-weight:700">$escapedReference</td></tr>
                              <tr><td style="padding:4px 0;color:#526071">Anliegen</td><td style="padding:4px 0;font-weight:700">$escapedSubject</td></tr>
                            </table>
                            <p style="margin:22px 0;line-height:1.55">$escapedSummary</p>
                            <a href="$escapedUrl" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:9px">Abfall APP öffnen</a>
                            <p style="margin:28px 0 0;color:#68758a;font-size:13px;line-height:1.5">Bitte bewahren Sie Ihre Referenz auf. Diese Nachricht stammt ausschließlich aus dem lokalen Pilotbetrieb mit synthetischen Daten.</p>
                          </td></tr>
                        </table>
                      </td></tr>
                    </table>
                  </body>
                </html>
                """.trimIndent(),
        )
    }

    private fun escapeHtml(value: String): String =
        value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;")
}

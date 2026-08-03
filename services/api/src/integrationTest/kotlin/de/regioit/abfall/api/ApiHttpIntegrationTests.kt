package de.regioit.abfall.api

import org.hamcrest.Matchers.matchesPattern
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import tools.jackson.databind.ObjectMapper
import kotlin.test.assertEquals

@SpringBootTest(classes = [ApiApplication::class])
@AutoConfigureMockMvc
@ActiveProfiles("integration")
class ApiHttpIntegrationTests {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Test
    fun `readiness endpoint reports ready in UTC`() {
        mockMvc
            .get("/v1/health/ready")
            .andExpect {
                status { isOk() }
                content { contentTypeCompatibleWith(MediaType.APPLICATION_JSON) }
                jsonPath("$.status") { value("ready") }
                jsonPath("$.checkedAt") {
                    value(matchesPattern("^\\d{4}-\\d{2}-\\d{2}T.*Z$"))
                }
            }
    }

    @Test
    fun `demo tenant configuration is exposed`() {
        mockMvc
            .get("/v1/tenants/demo/config")
            .andExpect {
                status { isOk() }
                content { contentTypeCompatibleWith(MediaType.APPLICATION_JSON) }
                jsonPath("$.tenantId") { value("demo") }
                jsonPath("$.branding.primaryColor") { value("#C8102E") }
                jsonPath("$.enabledFeatures.home") { value(true) }
                jsonPath("$.enabledFeatures.calendar") { value(true) }
                jsonPath("$.enabledFeatures.defectCases") { value(true) }
            }
    }

    @Test
    fun `unknown tenant returns problem details`() {
        mockMvc
            .get("/v1/tenants/unknown/config")
            .andExpect {
                status { isNotFound() }
                content { contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON) }
                jsonPath("$.type") { value("/problems/tenant-not-found") }
                jsonPath("$.title") { value("Mandant nicht gefunden") }
            }
    }

    @Test
    fun `phase one content can be searched and stays consistent`() {
        mockMvc
            .get("/v1/addresses/search") {
                param("tenantId", "demo")
                param("q", "Muster")
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].id") { value("demo-musterstrasse-12") }
            }

        mockMvc
            .get("/v1/addresses/demo-musterstrasse-12/collections") {
                param("tenantId", "demo")
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].wasteTypeLabel") { value("Restabfall") }
                jsonPath("$[2].status") { value("moved") }
            }

        mockMvc
            .get("/v1/waste-guide/search") {
                param("tenantId", "demo")
                param("q", "Akku")
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].name") { value("Batterien") }
            }

        mockMvc
            .get("/v1/sites") {
                param("tenantId", "demo")
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].latitude") { exists() }
                jsonPath("$[0].longitude") { exists() }
            }
    }

    @Test
    fun `admin can correct list and delete a notice`() {
        val created =
            mockMvc
                .post("/v1/admin/notices") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        """
                        {
                          "tenantId":"demo",
                          "addressId":null,
                          "noticeType":"service",
                          "title":"Falscher Titel",
                          "body":"Dieser Text wird korrigiert.",
                          "priority":"info",
                          "validFrom":"2026-08-01T00:00:00Z",
                          "validUntil":"2026-09-01T00:00:00Z"
                        }
                        """.trimIndent()
                }.andExpect { status { isCreated() } }
                .andReturn()
        val id = objectMapper.readTree(created.response.contentAsString)["id"].asText()

        mockMvc
            .put("/v1/admin/notices/$id") {
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "tenantId":"demo",
                      "addressId":null,
                      "noticeType":"service",
                      "title":"Korrigierter Titel",
                      "body":"Der Hinweis ist nun richtig.",
                      "priority":"warning",
                      "validFrom":"2026-08-01T00:00:00Z",
                      "validUntil":"2026-09-01T00:00:00Z"
                    }
                    """.trimIndent()
            }.andExpect {
                status { isOk() }
                jsonPath("$.title") { value("Korrigierter Titel") }
            }

        mockMvc
            .get("/v1/admin/notices") { param("tenantId", "demo") }
            .andExpect {
                status { isOk() }
                jsonPath("$[?(@.id == '$id')].title") { value("Korrigierter Titel") }
            }

        mockMvc
            .delete("/v1/admin/notices/$id") { param("tenantId", "demo") }
            .andExpect { status { isNoContent() } }
    }

    @Test
    fun `defect submission is idempotent and status can be updated`() {
        val body =
            """
            {
              "tenantId": "demo",
              "category": "illegal-dumping",
              "address": "Musterstraße 12, 52062 Demo-Stadt",
              "description": "Neben dem Depotcontainer liegen mehrere Säcke.",
              "occurredAt": "2026-07-31T12:00:00Z",
              "contactEmail": "pilot@example.invalid",
              "consent": true,
              "attachmentNames": ["fundstelle.jpg"]
            }
            """.trimIndent()

        val first =
            mockMvc
                .post("/v1/cases/defects") {
                    header("Idempotency-Key", "integration-defect-0001")
                    contentType = MediaType.APPLICATION_JSON
                    content = body
                }.andExpect {
                    status { isCreated() }
                    jsonPath("$.reference") { value(matchesPattern("^DEMO-[A-F0-9]{20}$")) }
                    jsonPath("$.status") { value("received") }
                }.andReturn()
                .response.contentAsString

        val repeated =
            mockMvc
                .post("/v1/cases/defects") {
                    header("Idempotency-Key", "integration-defect-0001")
                    contentType = MediaType.APPLICATION_JSON
                    content = body
                }.andExpect { status { isOk() } }
                .andReturn()
                .response.contentAsString
        assertEquals(first, repeated)

        val created = objectMapper.readTree(first)
        val reference = created["reference"].asText()
        val accessToken = created["accessToken"].asText()

        mockMvc
            .get("/v1/cases/$reference") {
                param("accessToken", accessToken)
            }.andExpect {
                status { isOk() }
                jsonPath("$.events[0].status") { value("received") }
            }

        mockMvc
            .patch("/v1/admin/cases/$reference/status") {
                contentType = MediaType.APPLICATION_JSON
                content = """{"status":"in-review","publicLabel":"Die Meldung wird geprüft."}"""
            }.andExpect {
                status { isOk() }
                jsonPath("$.status") { value("in-review") }
                jsonPath("$.events[1].publicLabel") { value("Die Meldung wird geprüft.") }
            }
    }

    @Test
    fun `bulk waste order reserves a slot`() {
        mockMvc
            .get("/v1/bulk-waste/slots") {
                param("tenantId", "demo")
                param("addressId", "demo-musterstrasse-12")
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].remainingCapacity") { value(7) }
            }

        mockMvc
            .post("/v1/bulk-waste/orders") {
                header("Idempotency-Key", "integration-bulk-0001")
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "tenantId": "demo",
                      "addressId": "demo-musterstrasse-12",
                      "slotId": "slot-2026-08-18-am",
                      "items": [{"itemTypeId":"furniture","quantity":2}],
                      "contactEmail": null,
                      "consent": true
                    }
                    """.trimIndent()
            }.andExpect {
                status { isCreated() }
                jsonPath("$.status") { value("received") }
            }
    }
}

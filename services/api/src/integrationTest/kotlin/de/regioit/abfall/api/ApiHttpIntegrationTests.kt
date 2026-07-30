package de.regioit.abfall.api

import org.hamcrest.Matchers.matchesPattern
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest(classes = [ApiApplication::class])
@AutoConfigureMockMvc
class ApiHttpIntegrationTests {
    @Autowired
    lateinit var mockMvc: MockMvc

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
                jsonPath("$.enabledFeatures.calendar") { value(false) }
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
}

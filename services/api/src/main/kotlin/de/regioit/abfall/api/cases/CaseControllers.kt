package de.regioit.abfall.api.cases

import de.regioit.abfall.api.support.PilotAdminGuard
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class CaseController(
    private val service: CaseService,
) {
    @PostMapping("/cases/defects")
    fun createDefect(
        @RequestHeader("Idempotency-Key") idempotencyKey: String,
        @Valid @RequestBody input: DefectCaseInput,
    ): ResponseEntity<CaseCreated> = creationResponse(service.createDefect(idempotencyKey, input))

    @GetMapping("/bulk-waste/rules")
    fun bulkWasteRules(
        @RequestParam tenantId: String,
    ): BulkWasteRules = service.bulkWasteRules(tenantId)

    @GetMapping("/bulk-waste/slots")
    fun bulkWasteSlots(
        @RequestParam tenantId: String,
        @RequestParam addressId: String,
    ): List<BulkWasteSlot> = service.bulkWasteSlots(tenantId, addressId)

    @PostMapping("/bulk-waste/orders")
    fun createBulkWasteOrder(
        @RequestHeader("Idempotency-Key") idempotencyKey: String,
        @Valid @RequestBody input: BulkWasteOrderInput,
    ): ResponseEntity<CaseCreated> = creationResponse(service.createBulkWasteOrder(idempotencyKey, input))

    @GetMapping("/cases/{reference}")
    fun getCase(
        @PathVariable reference: String,
        @RequestParam accessToken: String,
    ): CaseDetail = service.getCase(reference, accessToken)

    private fun creationResponse(result: CaseCreationResult): ResponseEntity<CaseCreated> =
        ResponseEntity.status(if (result.created) HttpStatus.CREATED else HttpStatus.OK).body(result.response)
}

@RestController
@RequestMapping("/v1/admin/cases")
class AdminCaseController(
    private val guard: PilotAdminGuard,
    private val service: CaseService,
) {
    @GetMapping
    fun listCases(
        @RequestParam tenantId: String,
    ): List<CaseDetail> {
        guard.check()
        return service.listCases(tenantId)
    }

    @PatchMapping("/{reference}/status")
    fun updateStatus(
        @PathVariable reference: String,
        @Valid @RequestBody input: CaseStatusInput,
    ): CaseDetail {
        guard.check()
        return service.updateStatus(reference, input)
    }
}

package de.regioit.abfall.api.access

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/recycling-access/requests")
class RecyclingAccessController(
    private val service: RecyclingAccessService,
) {
    @PostMapping
    fun create(
        @RequestHeader("Idempotency-Key") idempotencyKey: String,
        @Valid @RequestBody input: RecyclingAccessRequestInput,
    ): ResponseEntity<RecyclingAccessRequestView> {
        val result = service.create(idempotencyKey, input)
        return ResponseEntity.status(if (result.created) HttpStatus.CREATED else HttpStatus.OK).body(result.response)
    }

    @PostMapping("/{reference}/simulation-events")
    fun simulate(
        @PathVariable reference: String,
        @RequestHeader("Idempotency-Key") idempotencyKey: String,
        @Valid @RequestBody input: RecyclingAccessSimulationInput,
    ): RecyclingAccessRequestView = service.simulate(reference, idempotencyKey, input)
}

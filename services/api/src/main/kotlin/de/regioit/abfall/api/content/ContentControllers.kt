package de.regioit.abfall.api.content

import de.regioit.abfall.api.support.PilotAdminGuard
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class PublicContentController(
    private val service: ContentService,
) {
    @GetMapping("/addresses/search")
    fun searchAddresses(
        @RequestParam tenantId: String,
        @RequestParam("q") query: String,
    ): List<Address> = service.searchAddresses(tenantId, query)

    @GetMapping("/addresses/{addressId}/collections")
    fun collections(
        @PathVariable addressId: String,
        @RequestParam tenantId: String,
    ): List<CollectionEvent> = service.collections(tenantId, addressId)

    @GetMapping("/waste-guide/search")
    fun searchWasteGuide(
        @RequestParam tenantId: String,
        @RequestParam("q") query: String,
    ): List<WasteGuideEntry> = service.searchWasteGuide(tenantId, query)

    @GetMapping("/sites")
    fun sites(
        @RequestParam tenantId: String,
        @RequestParam(required = false) wasteType: String?,
    ): List<Site> = service.sites(tenantId, wasteType)

    @GetMapping("/notices")
    fun notices(
        @RequestParam tenantId: String,
        @RequestParam(required = false) addressId: String?,
    ): List<Notice> = service.notices(tenantId, addressId)
}

@RestController
@RequestMapping("/v1/admin")
class AdminContentController(
    private val guard: PilotAdminGuard,
    private val service: ContentService,
) {
    @GetMapping("/collections")
    fun collections(
        @RequestParam tenantId: String,
    ): List<CollectionEvent> {
        guard.check()
        return service.adminCollections(tenantId)
    }

    @GetMapping("/waste-guide")
    fun wasteGuide(
        @RequestParam tenantId: String,
    ): List<WasteGuideEntry> {
        guard.check()
        return service.adminWasteGuide(tenantId)
    }

    @GetMapping("/sites")
    fun sites(
        @RequestParam tenantId: String,
    ): List<Site> {
        guard.check()
        return service.adminSites(tenantId)
    }

    @GetMapping("/notices")
    fun notices(
        @RequestParam tenantId: String,
    ): List<Notice> {
        guard.check()
        return service.adminNotices(tenantId)
    }

    @PostMapping("/collections")
    @ResponseStatus(HttpStatus.CREATED)
    fun createCollection(
        @Valid @RequestBody input: CollectionInput,
    ): CollectionEvent {
        guard.check()
        return service.createCollection(input)
    }

    @PostMapping("/waste-guide")
    @ResponseStatus(HttpStatus.CREATED)
    fun createWasteGuideEntry(
        @Valid @RequestBody input: WasteGuideInput,
    ): WasteGuideEntry {
        guard.check()
        return service.createWasteGuideEntry(input)
    }

    @PostMapping("/sites")
    @ResponseStatus(HttpStatus.CREATED)
    fun createSite(
        @Valid @RequestBody input: SiteInput,
    ): Site {
        guard.check()
        return service.createSite(input)
    }

    @PostMapping("/notices")
    @ResponseStatus(HttpStatus.CREATED)
    fun createNotice(
        @Valid @RequestBody input: NoticeInput,
    ): Notice {
        guard.check()
        return service.createNotice(input)
    }

    @PutMapping("/collections/{id}")
    fun updateCollection(
        @PathVariable id: String,
        @Valid @RequestBody input: CollectionInput,
    ): CollectionEvent {
        guard.check()
        return service.updateCollection(id, input)
    }

    @PutMapping("/waste-guide/{id}")
    fun updateWasteGuideEntry(
        @PathVariable id: String,
        @Valid @RequestBody input: WasteGuideInput,
    ): WasteGuideEntry {
        guard.check()
        return service.updateWasteGuideEntry(id, input)
    }

    @PutMapping("/sites/{id}")
    fun updateSite(
        @PathVariable id: String,
        @Valid @RequestBody input: SiteInput,
    ): Site {
        guard.check()
        return service.updateSite(id, input)
    }

    @PutMapping("/notices/{id}")
    fun updateNotice(
        @PathVariable id: String,
        @Valid @RequestBody input: NoticeInput,
    ): Notice {
        guard.check()
        return service.updateNotice(id, input)
    }

    @DeleteMapping("/{resource}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteContent(
        @PathVariable resource: String,
        @PathVariable id: String,
        @RequestParam tenantId: String,
    ) {
        guard.check()
        service.deleteContent(resource, id, tenantId)
    }
}

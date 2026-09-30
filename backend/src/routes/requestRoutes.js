const express = require("express");

const {
    checkAvailability,
    findAlternatives,
    createRequest,
    getRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    getActiveAllocations,
    completeAllocation
} = require("../controllers/requestController");

const router = express.Router();


// =====================================================
// AVAILABILITY
// =====================================================

router.post(
    "/check",
    checkAvailability
);


// =====================================================
// ALTERNATIVES
// =====================================================

router.post(
    "/alternatives",
    findAlternatives
);


// =====================================================
// ACTIVE ALLOCATIONS
// IMPORTANT: Keep this BEFORE /:id
// =====================================================

router.get(
    "/allocations/active",
    getActiveAllocations
);


// =====================================================
// COMPLETE ALLOCATION
// =====================================================

router.post(
    "/allocations/:id/complete",
    completeAllocation
);


// =====================================================
// REQUESTS
// =====================================================

router.post(
    "/",
    createRequest
);

router.get(
    "/",
    getRequests
);

router.get(
    "/:id",
    getRequestById
);


// =====================================================
// APPROVAL
// =====================================================

router.post(
    "/:id/approve",
    approveRequest
);


// =====================================================
// REJECTION
// =====================================================

router.post(
    "/:id/reject",
    rejectRequest
);


module.exports = router;
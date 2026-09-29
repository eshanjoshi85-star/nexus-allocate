const express = require("express");

const {
    checkAvailability,
    findAlternatives,
    createRequest,
    getRequests,
    getRequestById,
    approveRequest,
    rejectRequest
} = require("../controllers/requestController");

const router = express.Router();

router.post("/check", checkAvailability);

router.post("/alternatives", findAlternatives);

router.post("/", createRequest);

router.get("/", getRequests);

router.get("/:id", getRequestById);

router.post("/:id/approve", approveRequest);

router.post("/:id/reject", rejectRequest);

module.exports = router;
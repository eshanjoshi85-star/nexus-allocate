const express = require("express");

const {
    getResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource
} = require("../controllers/resourceController");

const router = express.Router();

router.get("/", getResources);

router.get("/:id", getResourceById);

router.post("/", createResource);

router.put("/:id", updateResource);

router.delete("/:id", deleteResource);

module.exports = router;
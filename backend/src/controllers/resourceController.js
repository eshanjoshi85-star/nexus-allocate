const pool = require("../config/db");

// GET all resources
const getResources = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                type,
                location,
                capacity,
                status,
                description,
                created_at
            FROM resources
            ORDER BY id
        `);

        res.json({
            success: true,
            count: result.rows.length,
            resources: result.rows
        });

    } catch (error) {
        console.error("Get resources error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch resources"
        });
    }
};


// GET single resource
const getResourceById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM resources WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        res.json({
            success: true,
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("Get resource error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch resource"
        });
    }
};


// CREATE resource
const createResource = async (req, res) => {
    try {
        const {
            name,
            type,
            location,
            capacity,
            status,
            description
        } = req.body;

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: "Name and type are required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO resources
            (name, type, location, capacity, status, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                name,
                type,
                location || null,
                capacity || 1,
                status || "AVAILABLE",
                description || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Resource created successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("Create resource error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create resource"
        });
    }
};


// UPDATE resource
const updateResource = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            type,
            location,
            capacity,
            status,
            description
        } = req.body;

        const result = await pool.query(
            `
            UPDATE resources
            SET
                name = COALESCE($1, name),
                type = COALESCE($2, type),
                location = COALESCE($3, location),
                capacity = COALESCE($4, capacity),
                status = COALESCE($5, status),
                description = COALESCE($6, description)
            WHERE id = $7
            RETURNING *
            `,
            [
                name,
                type,
                location,
                capacity,
                status,
                description,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        res.json({
            success: true,
            message: "Resource updated successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("Update resource error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update resource"
        });
    }
};


// DELETE resource
const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM resources WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        res.json({
            success: true,
            message: "Resource deleted successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("Delete resource error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete resource"
        });
    }
};


module.exports = {
    getResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource
};
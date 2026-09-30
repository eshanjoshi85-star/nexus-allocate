const pool = require("../config/db");

// =====================================================
// CHECK AVAILABILITY
// =====================================================
const checkAvailability = async (req, res) => {
    try {
        const {
            resource_id,
            start_time,
            end_time
        } = req.body;

        if (!resource_id || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: "resource_id, start_time and end_time are required"
            });
        }

        if (new Date(start_time) >= new Date(end_time)) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        const resourceResult = await pool.query(
            `
            SELECT *
            FROM resources
            WHERE id = $1
            `,
            [resource_id]
        );

        if (resourceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        const conflictResult = await pool.query(
            `
            SELECT
                a.id,
                a.start_time,
                a.end_time,
                a.status,
                u.name AS allocated_to
            FROM allocations a
            LEFT JOIN users u
                ON a.user_id = u.id
            WHERE a.resource_id = $1
            AND a.status = 'ACTIVE'
            AND a.start_time < $3
            AND a.end_time > $2
            `,
            [
                resource_id,
                start_time,
                end_time
            ]
        );

        res.json({
            success: true,
            available: conflictResult.rows.length === 0,
            resource: resourceResult.rows[0],
            conflicts: conflictResult.rows
        });

    } catch (error) {

        console.error(
            "Availability check error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to check availability"
        });
    }
};


// =====================================================
// FIND ALTERNATIVE RESOURCES
// =====================================================
const findAlternatives = async (req, res) => {
    try {

        const {
            resource_id,
            start_time,
            end_time,
            required_capacity
        } = req.body;

        if (
            !resource_id ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "resource_id, start_time and end_time are required"
            });
        }

        const capacity =
            Number(required_capacity) || 1;

        const result = await pool.query(
            `
            SELECT
                r.*,

                NOT EXISTS (
                    SELECT 1
                    FROM allocations a
                    WHERE a.resource_id = r.id
                    AND a.status = 'ACTIVE'
                    AND a.start_time < $3
                    AND a.end_time > $2
                ) AS available

            FROM resources r

            WHERE r.id <> $1
            AND r.status = 'AVAILABLE'
            AND r.capacity >= $4

            ORDER BY r.capacity ASC, r.id ASC
            `,
            [
                resource_id,
                start_time,
                end_time,
                capacity
            ]
        );

        res.json({
            success: true,
            alternatives: result.rows
        });

    } catch (error) {

        console.error(
            "Find alternatives error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to find alternative resources"
        });
    }
};


// =====================================================
// CREATE REQUEST
// =====================================================
const createRequest = async (req, res) => {

    try {

        const {
            user_id,
            resource_id,
            start_time,
            end_time,
            purpose
        } = req.body;

        if (
            !user_id ||
            !resource_id ||
            !start_time ||
            !end_time ||
            !purpose
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "user_id, resource_id, start_time, end_time and purpose are required"
            });
        }

        if (
            new Date(start_time) >=
            new Date(end_time)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "End time must be after start time"
            });
        }

        // Check resource exists
        const resourceResult = await pool.query(
            `
            SELECT *
            FROM resources
            WHERE id = $1
            `,
            [resource_id]
        );

        if (resourceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        // Check conflict before creating request
        const conflictResult = await pool.query(
            `
            SELECT id
            FROM allocations
            WHERE resource_id = $1
            AND status = 'ACTIVE'
            AND start_time < $3
            AND end_time > $2
            `,
            [
                resource_id,
                start_time,
                end_time
            ]
        );

        if (conflictResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Resource is already allocated during this time"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO allocation_requests
            (
                user_id,
                resource_id,
                start_time,
                end_time,
                purpose
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                user_id,
                resource_id,
                start_time,
                end_time,
                purpose
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Resource request created successfully",
            request: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Create request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create resource request"
        });
    }
};


// =====================================================
// GET REQUESTS
// =====================================================
const getRequests = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                ar.id,
                ar.user_id,
                ar.resource_id,
                ar.start_time,
                ar.end_time,
                ar.purpose,
                ar.status,
                ar.created_at,

                u.name AS requested_by,
                u.email AS requester_email,

                r.name AS resource_name,
                r.type AS resource_type

            FROM allocation_requests ar

            LEFT JOIN users u
                ON ar.user_id = u.id

            LEFT JOIN resources r
                ON ar.resource_id = r.id

            ORDER BY ar.created_at DESC
            `
        );

        res.json({
            success: true,
            count: result.rows.length,
            requests: result.rows
        });

    } catch (error) {

        console.error(
            "Get requests error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch requests"
        });
    }
};


// =====================================================
// GET REQUEST BY ID
// =====================================================
const getRequestById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                ar.*,

                u.name AS requested_by,
                u.email AS requester_email,

                r.name AS resource_name,
                r.type AS resource_type,
                r.location AS resource_location,
                r.capacity AS resource_capacity

            FROM allocation_requests ar

            LEFT JOIN users u
                ON ar.user_id = u.id

            LEFT JOIN resources r
                ON ar.resource_id = r.id

            WHERE ar.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.json({
            success: true,
            request: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Get request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch request"
        });
    }
};


// =====================================================
// APPROVE REQUEST
// =====================================================
const approveRequest = async (req, res) => {

    const client = await pool.connect();

    try {

        const { id } = req.params;

        await client.query("BEGIN");

        // Get request and lock it
        const requestResult = await client.query(
            `
            SELECT *
            FROM allocation_requests
            WHERE id = $1
            AND status = 'PENDING'
            FOR UPDATE
            `,
            [id]
        );

        if (requestResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Pending request not found"
            });
        }

        const request =
            requestResult.rows[0];

        // Re-check conflict during approval
        const conflict = await client.query(
            `
            SELECT id
            FROM allocations
            WHERE resource_id = $1
            AND status = 'ACTIVE'
            AND start_time < $3
            AND end_time > $2
            FOR UPDATE
            `,
            [
                request.resource_id,
                request.start_time,
                request.end_time
            ]
        );

        if (conflict.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "Cannot approve. Resource is already allocated during this time."
            });
        }

        // Create allocation
        const allocationResult =
            await client.query(
                `
                INSERT INTO allocations
                (
                    request_id,
                    resource_id,
                    user_id,
                    start_time,
                    end_time,
                    status
                )
                VALUES
                ($1, $2, $3, $4, $5, 'ACTIVE')
                RETURNING *
                `,
                [
                    request.id,
                    request.resource_id,
                    request.user_id,
                    request.start_time,
                    request.end_time
                ]
            );

        // Update request
        await client.query(
            `
            UPDATE allocation_requests
            SET status = 'APPROVED'
            WHERE id = $1
            `,
            [id]
        );

        // Update resource
        await client.query(
            `
            UPDATE resources
            SET status = 'ALLOCATED'
            WHERE id = $1
            `,
            [request.resource_id]
        );

        // History
        await client.query(
            `
            INSERT INTO resource_history
            (
                resource_id,
                action,
                performed_by,
                details
            )
            VALUES
            ($1, $2, $3, $4)
            `,
            [
                request.resource_id,
                "ALLOCATION_CREATED",
                request.user_id,
                `Allocation created for request #${request.id}`
            ]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message:
                "Request approved successfully",
            allocation:
                allocationResult.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Approve request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to approve request"
        });

    } finally {

        client.release();
    }
};


// =====================================================
// REJECT REQUEST
// =====================================================
const rejectRequest = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            UPDATE allocation_requests
            SET status = 'REJECTED'
            WHERE id = $1
            AND status = 'PENDING'
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Pending request not found"
            });
        }

        res.json({
            success: true,
            message:
                "Request rejected",
            request:
                result.rows[0]
        });

    } catch (error) {

        console.error(
            "Reject request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to reject request"
        });
    }
};


// =====================================================
// GET ACTIVE ALLOCATIONS
// =====================================================
const getActiveAllocations = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                a.id,
                a.request_id,
                a.resource_id,
                a.user_id,
                a.start_time,
                a.end_time,
                a.status,
                a.created_at,

                u.name AS user_name,
                u.email AS user_email,

                r.name AS resource_name,
                r.type AS resource_type,
                r.location AS resource_location

            FROM allocations a

            LEFT JOIN users u
                ON a.user_id = u.id

            LEFT JOIN resources r
                ON a.resource_id = r.id

            WHERE a.status = 'ACTIVE'

            ORDER BY a.start_time ASC
            `
        );

        res.json({
            success: true,
            count: result.rows.length,
            allocations: result.rows
        });

    } catch (error) {

        console.error(
            "Get active allocations error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch active allocations"
        });
    }
};


// =====================================================
// COMPLETE / RETURN ALLOCATION
// =====================================================
const completeAllocation = async (req, res) => {

    const client = await pool.connect();

    try {

        const { id } = req.params;

        await client.query("BEGIN");

        // Find active allocation and lock it
        const allocationResult =
            await client.query(
                `
                SELECT *
                FROM allocations
                WHERE id = $1
                AND status = 'ACTIVE'
                FOR UPDATE
                `,
                [id]
            );

        if (allocationResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Active allocation not found"
            });
        }

        const allocation =
            allocationResult.rows[0];

        // Complete allocation
        const completedResult =
            await client.query(
                `
                UPDATE allocations
                SET status = 'COMPLETED'
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );

        // Release resource
        await client.query(
            `
            UPDATE resources
            SET status = 'AVAILABLE'
            WHERE id = $1
            `,
            [allocation.resource_id]
        );

        // Add history
        await client.query(
            `
            INSERT INTO resource_history
            (
                resource_id,
                action,
                performed_by,
                details
            )
            VALUES
            ($1, $2, $3, $4)
            `,
            [
                allocation.resource_id,
                "ALLOCATION_COMPLETED",
                allocation.user_id,
                `Allocation #${id} completed and resource released`
            ]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message:
                "Allocation completed successfully",
            allocation:
                completedResult.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Complete allocation error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to complete allocation"
        });

    } finally {

        client.release();
    }
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {

    checkAvailability,

    findAlternatives,

    createRequest,

    getRequests,

    getRequestById,

    approveRequest,

    rejectRequest,

    getActiveAllocations,

    completeAllocation
};
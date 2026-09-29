const pool = require("../config/db");

const getOverview = async (req, res) => {
    try {

        // Resource statistics
        const resourceStats = await pool.query(`
            SELECT
                COUNT(*) AS total_resources,
                COUNT(*) FILTER (
                    WHERE status = 'AVAILABLE'
                ) AS available_resources,
                COUNT(*) FILTER (
                    WHERE status = 'ALLOCATED'
                ) AS allocated_resources
            FROM resources
        `);

        // Request statistics
        const requestStats = await pool.query(`
            SELECT
                COUNT(*) AS total_requests,

                COUNT(*) FILTER (
                    WHERE status = 'PENDING'
                ) AS pending_requests,

                COUNT(*) FILTER (
                    WHERE status = 'APPROVED'
                ) AS approved_requests,

                COUNT(*) FILTER (
                    WHERE status = 'REJECTED'
                ) AS rejected_requests

            FROM allocation_requests
        `);

        // Active allocations
        const allocationStats = await pool.query(`
            SELECT COUNT(*) AS active_allocations
            FROM allocations
            WHERE status = 'ACTIVE'
        `);

        const resources = resourceStats.rows[0];
        const requests = requestStats.rows[0];
        const allocations = allocationStats.rows[0];

        const totalResources = Number(resources.total_resources);
        const allocatedResources = Number(resources.allocated_resources);

        const utilization =
            totalResources > 0
                ? Number(
                    ((allocatedResources / totalResources) * 100).toFixed(2)
                )
                : 0;

        res.json({
            success: true,

            overview: {
                totalResources,
                availableResources: Number(resources.available_resources),
                allocatedResources,

                totalRequests: Number(requests.total_requests),
                pendingRequests: Number(requests.pending_requests),
                approvedRequests: Number(requests.approved_requests),
                rejectedRequests: Number(requests.rejected_requests),

                activeAllocations: Number(allocations.active_allocations),

                utilizationPercentage: utilization
            }
        });

    } catch (error) {

        console.error("Analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics"
        });
    }
};


module.exports = {
    getOverview
};
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const pool = require("../config/db");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

/* =========================================================
   GENERATE JWT
========================================================= */

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

/* =========================================================
   REGISTER
========================================================= */

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingUser =
            await pool.query(
                `SELECT id
                 FROM users
                 WHERE email = $1`,
                [normalizedEmail]
            );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        /*
         * IMPORTANT:
         * Every new registration starts as EMPLOYEE.
         *
         * Users cannot register themselves as
         * ADMIN or MANAGER.
         */

        const result =
            await pool.query(
                `INSERT INTO users
                 (name, email, password_hash, role)
                 VALUES ($1, $2, $3, 'EMPLOYEE')
                 RETURNING id, name, email, role`,
                [
                    name.trim(),
                    normalizedEmail,
                    passwordHash
                ]
            );

        const user = result.rows[0];

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message:
                "Registration successful.",
            token,
            user
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Registration failed."
        });
    }
};

/* =========================================================
   LOGIN
========================================================= */

const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const result =
            await pool.query(
                `SELECT
                    id,
                    name,
                    email,
                    role,
                    password_hash
                 FROM users
                 WHERE email = $1`,
                [normalizedEmail]
            );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const user = result.rows[0];

        /*
         * Google-only accounts don't have a
         * password_hash.
         */

        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                message:
                    "This account uses Google Sign-In. Please continue with Google."
            });
        }

        const validPassword =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        delete user.password_hash;

        const token = generateToken(user);

        res.json({
            success: true,
            message:
                "Login successful.",
            token,
            user
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Login failed."
        });
    }
};

/* =========================================================
   GOOGLE LOGIN
========================================================= */

const googleLogin = async (req, res) => {
    try {

        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message:
                    "Google credential is required."
            });
        }

        const ticket =
            await googleClient.verifyIdToken({
                idToken: credential,
                audience:
                    process.env.GOOGLE_CLIENT_ID
            });

        const payload =
            ticket.getPayload();

        const googleId =
            payload.sub;

        const email =
            payload.email
                .toLowerCase()
                .trim();

        const name =
            payload.name ||
            email.split("@")[0];

        let result =
            await pool.query(
                `SELECT
                    id,
                    name,
                    email,
                    role
                 FROM users
                 WHERE email = $1`,
                [email]
            );

        let user;

        /* -----------------------------------------
           NEW GOOGLE USER
        ----------------------------------------- */

        if (result.rows.length === 0) {

            result =
                await pool.query(
                    `INSERT INTO users
                     (name, email, google_id, role)
                     VALUES ($1, $2, $3, 'EMPLOYEE')
                     RETURNING id, name, email, role`,
                    [
                        name,
                        email,
                        googleId
                    ]
                );

            user = result.rows[0];

        } else {

            /* -------------------------------------
               EXISTING USER
            ------------------------------------- */

            user = result.rows[0];

            /*
             * Link Google account if this user
             * hasn't linked one yet.
             */

            await pool.query(
                `UPDATE users
                 SET google_id = $1
                 WHERE id = $2
                 AND google_id IS NULL`,
                [
                    googleId,
                    user.id
                ]
            );
        }

        const token =
            generateToken(user);

        res.json({
            success: true,
            message:
                "Google login successful.",
            token,
            user
        });

    } catch (error) {

        console.error(
            "Google authentication error:",
            error
        );

        res.status(401).json({
            success: false,
            message:
                "Google authentication failed."
        });
    }
};

module.exports = {
    register,
    login,
    googleLogin
};
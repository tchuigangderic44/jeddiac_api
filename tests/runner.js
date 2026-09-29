/**
 * Comprehensive Endpoint Test Suite
 * Acting as a QA / Test Engineer to validate every single endpoint of the Organization REST API.
 */
require("dotenv").config();
const http = require("http");
const express = require("express");
const buildRoutes = require("../src/routes");

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const reqHeaders = {
            "Accept": "application/json",
            ...headers
        };

        let postData = null;
        if (body) {
            postData = JSON.stringify(body);
            reqHeaders["Content-Type"] = "application/json";
            reqHeaders["Content-Length"] = Buffer.byteLength(postData);
        }

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: reqHeaders
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on("error", reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
};

function assert(condition, message, details = "") {
    stats.total++;
    if (condition) {
        stats.passed++;
        console.log(`  ✓ PASS: ${message}`);
    } else {
        stats.failed++;
        console.error(`  ✗ FAIL: ${message} ${details}`);
        stats.failures.push({ message, details });
    }
}

async function runTestSuite() {
    console.log("==========================================================");
    console.log("      ORGANIZATION REST API - TEST SUITE RUNNER           ");
    console.log("==========================================================\n");

    const app = express();
    app.use(express.json());
    app.use(buildRoutes({}));

    await new Promise((res) => {
        server = app.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            res();
        });
    });

    const ts = Date.now();
    const memberEmail = `jean.dupont_${ts}@test.org`;
    const partnerEmail = `marie.curie_${ts}@partner.org`;
    const newsletterEmail = `visiteur_${ts}@domain.com`;

    let adminToken = "";
    let userToken = "";
    let partnerId = "";
    let newsId = "";
    let newsSlug = "";
    let eventId = "";
    let eventSlug = "";
    let missionId = "";
    let missionSlug = "";
    let articleId = "";
    let articleSlug = "";
    let contactId = "";
    let subscriberId = "";

    try {
        // =========================================================================
        // 1. AUTHENTICATION TESTS
        // =========================================================================
        console.log("[1] Testing Authentication Endpoints");

        // 1.1 Admin Login (Invalid Password)
        let res = await request("POST", "/auth/admin/login", {
            email: "admin@organization.org",
            password: "WrongPassword"
        });
        assert(res.status === 400, "POST /auth/admin/login rejects invalid credentials (400)");

        // 1.2 Admin Login (Success)
        res = await request("POST", "/auth/admin/login", {
            email: "admin@organization.org",
            password: "Admin@123456"
        });
        assert(res.status === 200 && res.body.valid === true, "POST /auth/admin/login succeeds with valid credentials (200)");
        assert(res.body.user && res.body.user.role === "admin", "Admin login returns user object with admin role");
        adminToken = res.body.token;

        // 1.3 Register New User (Member)
        res = await request("POST", "/auth/register", {
            firstName: "Jean",
            lastName: "Dupont",
            email: memberEmail,
            password: "Password@123",
            metier: "Ingénieur logiciel",
            phone: `+237${ts.toString().slice(-9)}`
        });
        assert(res.status === 200 && res.body.token, "POST /auth/register registers a new member successfully (200)");
        userToken = res.body.token;

        // 1.4 Member Login
        res = await request("POST", "/auth/login", {
            email: memberEmail,
            password: "Password@123"
        });
        assert(res.status === 200 && res.body.valid === true, "POST /auth/login allows member login (200)");

        // 1.5 Password Change (Authenticated)
        res = await request("POST", "/auth/change-password", {
            oldPassword: "Password@123",
            newPassword: "NewPassword@456"
        }, { Authorization: `Bearer ${userToken}` });
        assert(res.status === 200 && res.body.updated === true, "POST /auth/change-password changes password (200)");

        // Verify login with new password
        res = await request("POST", "/auth/login", {
            email: memberEmail,
            password: "NewPassword@456"
        });
        assert(res.status === 200, "Member can log in with new password");
        userToken = res.body.token;

        console.log("");

        // =========================================================================
        // 2. ADMIN USER MANAGEMENT TESTS
        // =========================================================================
        console.log("[2] Testing Admin User Management Endpoints");

        // 2.1 Unauthorized access check (Non-admin token on /admin/users)
        res = await request("GET", "/admin/users", null, { Authorization: `Bearer ${userToken}` });
        assert(res.status === 403, "GET /admin/users rejects non-admin with 403 Forbidden");

        // 2.2 Create Partner User (with conseil attribute)
        res = await request("POST", "/admin/users", {
            firstName: "Marie",
            lastName: "Curie",
            email: partnerEmail,
            role: "partner",
            metier: "Directrice Partenariats",
            bibliographie: "Experte en relations institutionnelles et recherche",
            linkedin: "https://linkedin.com/in/marie-curie",
            conseil: "Membre du comité consultatif pour l'innovation technologique",
            password: "Partner@123456"
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 201 && res.body.data.id, "POST /admin/users creates a partner with conseil (201)");
        partnerId = res.body.data.id;
        assert(res.body.data.role === "partner", "Created user role is partner");
        assert(res.body.data.conseil !== undefined, "User includes conseil attribute");

        // 2.3 List Users with Pagination & Search
        res = await request("GET", "/admin/users?limit=5&page=1&role=partner", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && Array.isArray(res.body.values), "GET /admin/users returns paginated list (200)");
        assert(res.body.values.length >= 1, "List contains the created partner");

        // 2.4 Get User By ID
        res = await request("GET", `/admin/users/${partnerId}`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.id === partnerId, "GET /admin/users/:id retrieves user details (200)");

        // 2.5 Update User
        res = await request("PUT", `/admin/users/${partnerId}`, {
            metier: "VP Relations Publiques & Stratégie"
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.data.metier === "VP Relations Publiques & Stratégie", "PUT /admin/users/:id updates user (200)");

        // 2.6 Deactivate User
        res = await request("PATCH", `/admin/users/${partnerId}/deactivate`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.deactivated === true, "PATCH /admin/users/:id/deactivate deactivates user (200)");

        // 2.7 Activate User
        res = await request("PATCH", `/admin/users/${partnerId}/activate`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.activated === true, "PATCH /admin/users/:id/activate activates user (200)");

        console.log("");

        // =========================================================================
        // 3. ACTUALITÉS (NEWS) TESTS
        // =========================================================================
        console.log("[3] Testing News (Actualités) Endpoints");

        // 3.1 Admin Creates News
        res = await request("POST", "/admin/news", {
            title: `Lancement du nouveau programme associatif ${ts}`,
            summary: "Découvrez notre nouveau programme dédié au développement local.",
            content: "Le programme 2026 couvrira plus de 15 projets communautaires à travers le pays.",
            category: "Communiqué",
            tags: "lancement, programme, 2026"
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 201 && res.body.data.id, "POST /admin/news creates news article (201)");
        newsId = res.body.data.id;
        newsSlug = res.body.data.slug;

        // 3.2 Admin Lists All News
        res = await request("GET", "/admin/news", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.values.length >= 1, "GET /admin/news lists all news (200)");

        // 3.3 Public Gets Active News
        res = await request("GET", "/news");
        assert(res.status === 200 && res.body.values.length >= 1, "GET /news returns public active news (200)");

        // 3.4 Public Gets News Details by Slug
        res = await request("GET", `/news/${newsSlug}`);
        assert(res.status === 200 && res.body.slug === newsSlug, "GET /news/:idOrSlug retrieves news by slug (200)");

        // 3.5 Admin Suspends News
        res = await request("PATCH", `/admin/news/${newsId}/suspend`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.suspended === true, "PATCH /admin/news/:id/suspend suspends news (200)");

        // 3.6 Public cannot see suspended news
        res = await request("GET", `/news/${newsSlug}`);
        assert(res.status === 404, "GET /news/:idOrSlug returns 404 for suspended news to public");

        // 3.7 Admin Reactivates News
        res = await request("PATCH", `/admin/news/${newsId}/reactivate`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.reactivated === true, "PATCH /admin/news/:id/reactivate reactivates news (200)");

        console.log("");

        // =========================================================================
        // 4. AGENDA / ÉVÉNEMENTS TESTS
        // =========================================================================
        console.log("[4] Testing Agenda (Events) Endpoints");

        // 4.1 Admin Creates Event
        const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
        res = await request("POST", "/admin/agenda", {
            title: `Assemblée Générale Annuelle ${ts}`,
            description: "Réunion plénière annuelle pour le bilan des activités et vote des résolutions.",
            startDate: futureDate,
            location: "Palais des Congrès / En ligne",
            type: "Assemblée Générale",
            registrationLink: "https://event.organization.org/register"
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 201 && res.body.data.id, "POST /admin/agenda creates event (201)");
        eventId = res.body.data.id;
        eventSlug = res.body.data.slug;

        // 4.2 Admin Lists Events
        res = await request("GET", "/admin/agenda", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.values.length >= 1, "GET /admin/agenda lists events (200)");

        // 4.3 Public Lists Upcoming Events
        res = await request("GET", "/agenda?upcoming=true");
        assert(res.status === 200 && res.body.values.length >= 1, "GET /agenda?upcoming=true lists upcoming events (200)");

        // 4.4 Public Gets Event Details
        res = await request("GET", `/agenda/${eventSlug}`);
        assert(res.status === 200 && res.body.title === `Assemblée Générale Annuelle ${ts}`, "GET /agenda/:idOrSlug retrieves event details (200)");

        // 4.5 Admin Suspends and Reactivates Event
        res = await request("PATCH", `/admin/agenda/${eventId}/suspend`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.suspended === true, "PATCH /admin/agenda/:id/suspend suspends event (200)");
        res = await request("PATCH", `/admin/agenda/${eventId}/reactivate`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.reactivated === true, "PATCH /admin/agenda/:id/reactivate reactivates event (200)");

        console.log("");

        // =========================================================================
        // 5. MISSIONS TESTS
        // =========================================================================
        console.log("[5] Testing Missions Endpoints");

        // 5.1 Admin Creates Mission
        res = await request("POST", "/admin/missions", {
            title: `Éducation et Transmission ${ts}`,
            shortDescription: "Favoriser l'accès à la formation et à la culture scientifique.",
            description: "Accompagner les jeunes et les professionnels à travers des ateliers et des mentorats.",
            objectives: "Former 1000 personnes d'ici fin 2026.",
            order: 1
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 201 && res.body.data.id, "POST /admin/missions creates mission (201)");
        missionId = res.body.data.id;
        missionSlug = res.body.data.slug;

        // 5.2 Admin Lists Missions
        res = await request("GET", "/admin/missions", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.values.length >= 1, "GET /admin/missions lists missions (200)");

        // 5.3 Public Lists Active Missions
        res = await request("GET", "/missions");
        assert(res.status === 200 && res.body.values.length >= 1, "GET /missions lists active missions (200)");

        // 5.4 Public Gets Mission Details
        res = await request("GET", `/missions/${missionSlug}`);
        assert(res.status === 200 && res.body.slug === missionSlug, "GET /missions/:idOrSlug retrieves mission details (200)");

        // 5.5 Admin Suspends and Reactivates Mission
        res = await request("PATCH", `/admin/missions/${missionId}/suspend`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.suspended === true, "PATCH /admin/missions/:id/suspend suspends mission (200)");
        res = await request("PATCH", `/admin/missions/${missionId}/reactivate`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.reactivated === true, "PATCH /admin/missions/:id/reactivate reactivates mission (200)");

        console.log("");

        // =========================================================================
        // 6. BLOG / ARTICLES TESTS
        // =========================================================================
        console.log("[6] Testing Blog Articles Endpoints");

        // 6.1 Admin Creates Article
        res = await request("POST", "/admin/articles", {
            title: `Les Enjeux Numériques ${ts}`,
            summary: "Analyse approfondie des mutations numériques dans le secteur associatif.",
            content: "Le numérique transforme nos façons d'interagir, de collaborer et d'impacter nos communautés.",
            category: "Technologie",
            tags: "digital, impact, association"
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 201 && res.body.data.id, "POST /admin/articles creates article (201)");
        articleId = res.body.data.id;
        articleSlug = res.body.data.slug;

        // 6.2 Admin Lists Articles
        res = await request("GET", "/admin/articles", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.values.length >= 1, "GET /admin/articles lists articles (200)");

        // 6.3 Public Lists Articles
        res = await request("GET", "/articles");
        assert(res.status === 200 && res.body.values.length >= 1, "GET /articles lists public articles (200)");

        // 6.4 Public Reads Article & Verifies Views Increment
        res = await request("GET", `/articles/${articleSlug}`);
        assert(res.status === 200 && res.body.viewsCount === 1, "GET /articles/:idOrSlug auto-increments viewsCount to 1");
        res = await request("GET", `/articles/${articleSlug}`);
        assert(res.status === 200 && res.body.viewsCount === 2, "Second read increments viewsCount to 2");

        // 6.5 Admin Suspends and Reactivates Article
        res = await request("PATCH", `/admin/articles/${articleId}/suspend`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.suspended === true, "PATCH /admin/articles/:id/suspend suspends article (200)");
        res = await request("PATCH", `/admin/articles/${articleId}/reactivate`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.reactivated === true, "PATCH /admin/articles/:id/reactivate reactivates article (200)");

        console.log("");

        // =========================================================================
        // 7. CONTACT FORM TESTS
        // =========================================================================
        console.log("[7] Testing Contact Form Endpoints");

        // 7.1 Validation: Missing required fields
        res = await request("POST", "/contact", {
            name: "Alex"
        });
        assert(res.status === 400, "POST /contact rejects missing required fields (400)");

        // 7.2 Validation: Invalid Email format
        res = await request("POST", "/contact", {
            name: "Alexandre",
            email: "invalid-email-format",
            subject: "Demande de partenariat",
            message: "Bonjour, je souhaiterais proposer un partenariat avec votre organisation."
        });
        assert(res.status === 400, "POST /contact rejects invalid email format (400)");

        // 7.3 Success: Valid Contact Submission
        res = await request("POST", "/contact", {
            name: "Alexandre Martin",
            email: `alexandre.martin_${ts}@contact.org`,
            subject: "Demande de renseignement sur vos actions",
            message: "Bonjour, comment puis-je devenir bénévole auprès de votre organisation ?"
        });
        assert(res.status === 201 && res.body.data.id, "POST /contact submits message successfully (201)");
        contactId = res.body.data.id;

        // 7.4 Admin Lists Contact Messages
        res = await request("GET", "/admin/contacts", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.values.length >= 1, "GET /admin/contacts lists contact messages (200)");

        // 7.5 Admin Reads Message & Marks Read
        res = await request("GET", `/admin/contacts/${contactId}`, null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.isRead === true, "GET /admin/contacts/:id auto-marks message as read (200)");

        // 7.6 Admin Updates Message Status
        res = await request("PATCH", `/admin/contacts/${contactId}/status`, {
            status: "replied",
            adminNotes: "Répondu par email le 29/09"
        }, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.status === "replied", "PATCH /admin/contacts/:id/status updates status (200)");

        console.log("");

        // =========================================================================
        // 8. NEWSLETTER TESTS
        // =========================================================================
        console.log("[8] Testing Newsletter Endpoints");

        // 8.1 Validation: Invalid email
        res = await request("POST", "/newsletter/subscribe", {
            email: "not-an-email"
        });
        assert(res.status === 400, "POST /newsletter/subscribe rejects invalid email (400)");

        // 8.2 Subscribe
        res = await request("POST", "/newsletter/subscribe", {
            email: newsletterEmail
        });
        assert(res.status === 201 && res.body.data.id, "POST /newsletter/subscribe registers subscriber (201)");
        subscriberId = res.body.data.id;

        // 8.3 Duplicate Subscribe (gracefully handled)
        res = await request("POST", "/newsletter/subscribe", {
            email: newsletterEmail
        });
        assert(res.status === 200, "POST /newsletter/subscribe handles duplicate subscription idempotently (200)");

        // 8.4 Admin Lists Subscribers
        res = await request("GET", "/admin/newsletter/subscribers", null, { Authorization: `Bearer ${adminToken}` });
        assert(res.status === 200 && res.body.values.length >= 1, "GET /admin/newsletter/subscribers lists subscribers (200)");

        // 8.5 Unsubscribe
        res = await request("POST", "/newsletter/unsubscribe", {
            email: newsletterEmail
        });
        assert(res.status === 200 && res.body.data.status === "unsubscribed", "POST /newsletter/unsubscribe unsubscribes user (200)");

        console.log("");

        // =========================================================================
        // 9. USER PROFILE & PUBLIC DIRECTORY TESTS
        // =========================================================================
        console.log("[9] Testing User Profile and Public Members Directory");

        // 9.1 Member Profile
        res = await request("GET", "/user/profile", null, { Authorization: `Bearer ${userToken}` });
        assert(res.status === 200 && res.body.email === memberEmail, "GET /user/profile returns authenticated user profile (200)");

        // 9.2 Member Updates Profile
        res = await request("PUT", "/user/profile", {
            metier: "Lead Architecte Logiciel",
            bibliographie: "Spécialiste des architectures cloud distribuées"
        }, { Authorization: `Bearer ${userToken}` });
        assert(res.status === 200 && res.body.updated === true, "PUT /user/profile updates own profile (200)");

        // 9.3 Public Directory of Members & Partners
        res = await request("GET", "/members?role=partner");
        assert(res.status === 200 && Array.isArray(res.body.values), "GET /members?role=partner returns partners directory (200)");
        assert(res.body.values.some(u => u.role === "partner"), "Directory includes partner with public details");

        // 9.4 Member Logout
        res = await request("POST", "/user/logout", null, { Authorization: `Bearer ${userToken}` });
        assert(res.status === 200 && res.body.loggedOut === true, "POST /user/logout logs out user (200)");

        // 9.5 Revoked Token Rejected
        res = await request("GET", "/user/profile", null, { Authorization: `Bearer ${userToken}` });
        assert(res.status === 401, "Revoked token is rejected on subsequent calls (401 Unauthorized)");

        console.log("\n==========================================================");
        console.log(`RESULTS: Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
        console.log("==========================================================");

        if (stats.failed > 0) {
            console.error("\nFailures details:");
            console.error(stats.failures);
            process.exit(1);
        } else {
            console.log("\n>>> ALL TESTS PASSED! 100% SUCCESS RATE. <<<");
            process.exit(0);
        }
    } catch (err) {
        console.error("Test execution exception:", err);
        process.exit(1);
    } finally {
        if (server) {
            server.close();
        }
    }
}

runTestSuite();

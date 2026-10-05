const {Router} = require("express");
const buildAuthRoutes = require("./auth.routes");
const buildUserRoutes = require("./user.routes");
const buildAdminRoutes = require("./admin.routes");
const buildNewsRoutes = require("./news.routes");
const buildAgendaRoutes = require("./agenda.routes");
const buildMissionRoutes = require("./mission.routes");
const buildContactRoutes = require("./contact.routes");
const buildNewsletterRoutes = require("./newsletter.routes");
const buildPodcastRoutes = require("./podcast.routes");

function buildRoutes({
    adminRoutes,
    agendaRoutes,
    authRoutes,
    contactRoutes,
    missionRoutes,
    newsRoutes,
    newsletterRoutes,
    podcastRoutes,
    userRoutes
} = {}) {
    const authRouter = authRoutes || buildAuthRoutes();
    const adminRouter = adminRoutes || buildAdminRoutes();
    const userRouter = userRoutes || buildUserRoutes();
    const newsRouter = newsRoutes || buildNewsRoutes();
    const agendaRouter = agendaRoutes || buildAgendaRoutes();
    const missionRouter = missionRoutes || buildMissionRoutes();
    const contactRouter = contactRoutes || buildContactRoutes();
    const newsletterRouter = newsletterRoutes || buildNewsletterRoutes();
    const podcastRouter = podcastRoutes || buildPodcastRoutes();

    const router = new Router();

    // 1. Auth routes (/auth/login, /auth/admin/login, /auth/register, /auth/change-password)
    router.use(authRouter);

    // 2. Admin User management routes (/admin/users, /admin/users/:id, etc.)
    router.use(adminRouter);

    // 3. User profile & directory routes (/user/profile, /members)
    router.use(userRouter);

    // 4. Actualités routes (/news, /admin/news)
    router.use(newsRouter);

    // 5. Agenda / Events routes (/agenda, /admin/agenda)
    router.use(agendaRouter);

    // 6. Missions routes (/missions, /admin/missions)
    router.use(missionRouter);

    // 8. Contact routes (/contact, /admin/contacts)
    router.use(contactRouter);

    // 9. Newsletter routes (/newsletter/subscribe, /admin/newsletter)
    router.use(newsletterRouter);

    // 10. Podcasts routes (/podcasts, /admin/podcasts)
    router.use(podcastRouter);

    return router;
}

module.exports = buildRoutes;
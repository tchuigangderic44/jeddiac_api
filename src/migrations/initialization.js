/*jslint
node
*/
const models = require("../models");
const {availableRoles, userStatuses} = require("../utils/config");
const {hashPassword} = require("../utils/helpers");

const {
    admin_name = "Admin Organization",
    admin_email: email = "admin@organization.org",
    admin_password: password = "Admin@123456",
    admin_phone: phone = "+237600000000"
} = process.env;

const queryInterface = models.connection.getQueryInterface();

async function createTable(model) {
    if (!model) return;
    const tableName = model.getTableName();
    try {
        await queryInterface.createTable(tableName, model.getAttributes());
    } catch (e) {
        // Ignore if table already exists
    }
}

async function createTables() {
    await createTable(models.Settings);
    await createTable(models.Blacklist);
    await createTable(models.User);
    await createTable(models.News);
    await createTable(models.Agenda);
    await createTable(models.Mission);
    await createTable(models.Contact);
    await createTable(models.Newsletter);
    await createTable(models.Podcast);
}

async function dropTables() {
    const list = [
        models.Podcast,
        models.Newsletter,
        models.Contact,
        models.Mission,
        models.Agenda,
        models.News,
        models.Blacklist,
        models.User,
        models.Settings
    ];
    for (const model of list) {
        if (model) {
            try {
                await queryInterface.dropTable(model.getTableName());
            } catch (e) {
                // Ignore if doesn't exist
            }
        }
    }
}

async function createDefaultUsers() {
    const [firstName = "Admin", ...rest] = admin_name.split(" ");
    const lastName = rest.join(" ") || "Super";

    await models.User.create({
        bibliographie: "Administrateur principal du site de l'organisation",
        email,
        firstName,
        lastName,
        metier: "Directeur de publication",
        password,
        phone,
        role: availableRoles.adminRole,
        status: userStatuses.activated
    }, {ignoreDuplicates: true});
}

async function createDefaultSettings() {
    const {apiSettings} = require("../utils/config");
    const defaultSettings = Object.values(apiSettings).map(
        function settingMapper({value: type, defaultValues: value}) {
            return Object.freeze({type, value});
        }
    );
    await models.Settings.bulkCreate(defaultSettings, {ignoreDuplicates: true});
}


async function createDefaultPodcasts() {
    if (!models.Podcast) return;
    const count = await models.Podcast.count();
    if (count > 0) return;

    const initialPodcasts = [
        {
            id: "0570b32c-0f33-4ea2-9d6d-480ab3a0a99c",
            title: "Les gardiens silencieux du Bassin du Congo",
            titleEn: "The Silent Guardians of the Congo Basin",
            series: "Les Voix de la Durabilité · Épisode 01",
            seriesEn: "Voices of Sustainability · Episode 01",
            duration: "08:45",
            author: "Club Média Lycée Général Leclerc, Yaoundé",
            authorEn: "General Leclerc High School Media Club, Yaoundé",
            topic: "Biodiversité & Forêts Primaires",
            topicEn: "Biodiversity & Primary Forests",
            cover: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80",
            audioUrl: "/audio/podcast-01-congo-basin.wav",
            description: "Une immersion sonore au cœur de la forêt équatoriale avec les témoignages des éco-gardes et des jeunes scouts environnementaux.",
            descriptionEn: "A sonic immersion in the heart of the equatorial forest with testimonies from eco-guards and young environmental scouts.",
            status: "active",
            order: 1,
            viewsCount: 142
        },
        {
            id: "e59d190e-1917-4945-b2a0-946c2aa687d8",
            title: "Enquête : Le recyclage plastique et l'économie circulaire à Douala",
            titleEn: "Investigation: Plastic Recycling and Circular Economy in Douala",
            series: "Journalisme Vert · Épisode 02",
            seriesEn: "Green Journalism · Episode 02",
            duration: "12:20",
            author: "Radio Universitaire Campus Douala",
            authorEn: "Campus Douala University Radio",
            topic: "Pollution Urbaine & Économie Circulaire",
            topicEn: "Urban Pollution & Circular Economy",
            cover: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
            audioUrl: "/audio/podcast-02-douala-recyclage.wav",
            description: "Des rives du fleuve Wouri aux ateliers d'artisans transformateurs, les jeunes reporters documentent les filières citoyennes de recyclage.",
            descriptionEn: "From the banks of the Wouri River to local upcycling workshops, young reporters document community recycling initiatives.",
            status: "active",
            order: 2,
            viewsCount: 98
        },
        {
            id: "487f9d5a-06ae-4fd6-9c06-d29604641018",
            title: "L'or bleu : Préserver les sources d'eau face aux dérèglements climatiques",
            titleEn: "Blue Gold: Preserving Water Springs Amid Climate Disruption",
            series: "Micro-Trottoir Jeunesse · Épisode 03",
            seriesEn: "Youth Vox Pop · Episode 03",
            duration: "09:15",
            author: "Club Journal Bafoussam & Radio Communautaire",
            authorEn: "Bafoussam Press Club & Community Radio",
            topic: "Ressources en Eau & Climat",
            topicEn: "Water Resources & Climate",
            cover: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
            audioUrl: "/audio/podcast-03-eau-climat.wav",
            description: "Comment les élèves et agriculteurs s'organisent pour protéger les têtes de sources et installer des récupérateurs d'eau de pluie.",
            descriptionEn: "How students and local farmers organize to safeguard water springs and install rainwater harvesting systems.",
            status: "active",
            order: 3,
            viewsCount: 115
        },
        {
            id: "1e283c45-438b-46a9-b135-087ebbd78f98",
            title: "Reforestation participative : L'initiative des jeunes de l'Est Cameroun",
            titleEn: "Participatory Reforestation: Young Leaders in Eastern Cameroon",
            series: "Reportages de Solutions · Épisode 04",
            seriesEn: "Solutions Reporting · Episode 04",
            duration: "14:10",
            author: "Rédaction Junior Bertoua",
            authorEn: "Bertoua Junior Newsroom",
            topic: "Agroforesterie & Communautés",
            topicEn: "Agroforestry & Communities",
            cover: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
            audioUrl: "/audio/podcast-04-reforestation.wav",
            description: "Quand les lycéens s'associent aux pépiniéristes locaux pour reboiser les abords des réserves fauniques.",
            descriptionEn: "When high school students join forces with local tree nurseries to reforest the borders of wildlife reserves.",
            status: "active",
            order: 4,
            viewsCount: 86
        }
    ];

    await models.Podcast.bulkCreate(initialPodcasts, {ignoreDuplicates: true});
}

async function createDefaultAgendas() {
    if (!models.Agenda) return;
    const count = await models.Agenda.count();
    if (count > 0) return;

    const initialAgendas = [
        {
            id: "714c21da-0ad6-4045-899f-f1dc64aee3f0",
            title: "Session Inaugurale de Formation : Investigation Climat & Écriture de Solutions",
            titleEn: "Inaugural Training Session: Climate Investigation & Solutions Reporting",
            type: "Formation Régionale",
            typeEn: "Regional Training",
            description: "Atelier intensif de 3 jours réunissant 40 délégués de clubs de presse scolaires et universitaires : cartographie des sources scientifiques, déconstruction des fausses nouvelles écologiques et techniques d'interview de terrain.",
            descriptionEn: "3-day intensive workshop convening 40 high school and university press club delegates: mapping scientific sources, debunking ecological disinformation, and conducting field interview techniques.",
            location: "Yaoundé · Centre Régional des Médias & Hybride",
            locationEn: "Yaoundé · Regional Media Hub & Hybrid",
            duration: "Session intensive 3 jours",
            durationEn: "3-day intensive session",
            startDate: "2026-10-11T09:00:00.000Z",
            endDate: "2026-10-13T17:00:00.000Z",
            seats: "40 places disponibles",
            seatsEn: "40 seats available",
            audience: "Lycéens & Étudiants",
            audienceEn: "High school & University students",
            registrationLink: "/candidature",
            status: "active"
        },
        {
            id: "94af7d54-674a-430f-b4ad-b13143b1a977",
            title: "Masterclass Audio : Réaliser un Podcast Environnemental avec un Smartphone",
            titleEn: "Audio Masterclass: Producing an Environmental Podcast with a Smartphone",
            type: "Masterclass Virtuelle",
            typeEn: "Virtual Masterclass",
            description: "Apprenez les bases de la prise de son mobile, du montage audio léger avec Audacity et du storytelling sonore au cœur des forêts et des quartiers urbains africains.",
            descriptionEn: "Master the fundamentals of mobile field recording, lightweight audio editing with Audacity, and immersive sonic storytelling across African forests and urban neighborhoods.",
            location: "En direct sur JEDDIAC Live & Radios partenaires",
            locationEn: "Live on JEDDIAC Stream & Partner Radios",
            duration: "Masterclass 2h30 + Exercice pratique",
            durationEn: "2.5-hour masterclass + practical exercise",
            startDate: "2026-10-19T14:00:00.000Z",
            endDate: "2026-10-19T16:30:00.000Z",
            seats: "Accès libre sur inscription",
            seatsEn: "Open access upon registration",
            audience: "Jeunes reporters & animateurs radio",
            audienceEn: "Young reporters & radio hosts",
            registrationLink: "/candidature",
            status: "active"
        },
        {
            id: "7ae15ac2-c483-42b8-a874-1040502e1f24",
            title: "Forum Sous-Régional des Jeunes Médias du Bassin du Congo",
            titleEn: "Congo Basin Youth Media Sub-Regional Forum",
            type: "Conférence Régionale",
            typeEn: "Regional Conference",
            description: "Rencontre plénière des délégations du Cameroun, du Gabon, de RDC, du Congo-Brazzaville, de Centrafrique et du Tchad pour signer le Pacte de la Jeunesse Médiatique pour la Durabilité.",
            descriptionEn: "Plenary summit of youth delegations from Cameroon, Gabon, DRC, Congo-Brazzaville, CAR, and Chad to sign the Youth Media Charter for Sustainability.",
            location: "Douala & Retransmission Panafricaine",
            locationEn: "Douala & Panafrican Broadcast",
            duration: "Forum de 2 jours",
            durationEn: "2-day summit",
            startDate: "2026-11-13T08:30:00.000Z",
            endDate: "2026-11-15T18:00:00.000Z",
            seats: "Délégations invitées & Observateurs",
            seatsEn: "Invited delegates & observers",
            audience: "Chefs d'équipes & Partenaires institutionnels",
            audienceEn: "Team leads & institutional partners",
            registrationLink: "/candidature",
            status: "active"
        },
        {
            id: "2b9a76d8-8c01-4475-8120-6d45e5f32b8e",
            title: "Atelier Itinérant : Tourbières du Bassin du Congo & Enquêtes Carbone",
            titleEn: "Field Workshop: Congo Basin Peatlands & Carbon Reporting",
            type: "Formation Régionale",
            typeEn: "Regional Training",
            description: "Immersion scientifique guidée par des chercheurs en écologie pour vulgariser l'importance planétaire des tourbières du Bassin du Congo auprès du grand public.",
            descriptionEn: "Scientific field immersion guided by ecology researchers to popularize the critical global role of Congo Basin peatlands for broad audiences.",
            location: "Kinshasa / Mbandaka & Distanciel",
            locationEn: "Kinshasa / Mbandaka & Remote",
            duration: "Atelier 4 jours terrain + rédaction",
            durationEn: "4-day field workshop + newsroom writing",
            startDate: "2026-12-05T09:00:00.000Z",
            endDate: "2026-12-09T17:00:00.000Z",
            seats: "25 places sur sélection",
            seatsEn: "25 selected slots",
            audience: "Étudiants en journalisme & sciences",
            audienceEn: "Journalism & environmental science students",
            registrationLink: "/candidature",
            status: "active"
        }
    ];

    await models.Agenda.bulkCreate(initialAgendas, {ignoreDuplicates: true});
}

async function up() {
    await createTables();
    await createDefaultUsers();
    await createDefaultSettings();
    await createDefaultPodcasts();
    await createDefaultAgendas();
}

async function down() {
    await dropTables();
}

module.exports = Object.freeze({down, up});
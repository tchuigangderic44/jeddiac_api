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
    await queryInterface.createTable(tableName, model.getAttributes());
}

async function createTables() {
    await createTable(models.Settings);
    await createTable(models.Blacklist);
    await createTable(models.User);
    await createTable(models.News);
    await createTable(models.Agenda);
    await createTable(models.Mission);
    await createTable(models.Article);
    await createTable(models.Contact);
    await createTable(models.Newsletter);
    await createTable(models.Podcast);
}

async function dropTables() {
    const list = [
        models.Podcast,
        models.Newsletter,
        models.Contact,
        models.Article,
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

async function up() {
    await createTables();
    await createDefaultUsers();
    await createDefaultSettings();
    await createDefaultPodcasts();
}

async function down() {
    await dropTables();
}

module.exports = Object.freeze({down, up});
/*jslint node*/
const {DataTypes} = require("sequelize");
const crypto = require("crypto");

async function up({context: queryInterface}) {
    const tables = await queryInterface.showAllTables();
    const hasPodcasts = tables.includes("podcasts") || tables.includes("Podcasts");

    if (!hasPodcasts) {
        await queryInterface.createTable("podcasts", {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            authorId: {
                type: DataTypes.UUID,
                allowNull: true
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            titleEn: {
                type: DataTypes.STRING,
                allowNull: true
            },
            series: {
                type: DataTypes.STRING,
                allowNull: true
            },
            seriesEn: {
                type: DataTypes.STRING,
                allowNull: true
            },
            duration: {
                type: DataTypes.STRING,
                allowNull: true
            },
            author: {
                type: DataTypes.STRING,
                allowNull: true
            },
            authorEn: {
                type: DataTypes.STRING,
                allowNull: true
            },
            topic: {
                type: DataTypes.STRING,
                allowNull: true
            },
            topicEn: {
                type: DataTypes.STRING,
                allowNull: true
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            descriptionEn: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            cover: {
                type: DataTypes.STRING,
                allowNull: true
            },
            audioUrl: {
                type: DataTypes.STRING,
                allowNull: true
            },
            slug: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: true
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: "active"
            },
            order: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            publishedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        });
    }

    // Seed 4 initial podcasts if none exist
    const countResult = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM podcasts WHERE deletedAt IS NULL",
        {type: queryInterface.sequelize.QueryTypes.SELECT}
    );
    const count = countResult && countResult[0] ? parseInt(countResult[0].count || countResult[0]["count(*)"] || 0, 10) : 0;

    if (count === 0) {
        const initialPodcasts = [
            {
                id: crypto.randomUUID(),
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
                slug: "les-gardiens-silencieux-du-bassin-du-congo",
                status: "active",
                order: 1,
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: crypto.randomUUID(),
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
                slug: "enquete-le-recyclage-plastique-et-leconomie-circulaire-a-douala",
                status: "active",
                order: 2,
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: crypto.randomUUID(),
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
                slug: "lor-bleu-preserver-les-sources-deau-face-aux-dereglements-climatiques",
                status: "active",
                order: 3,
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: crypto.randomUUID(),
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
                slug: "reforestation-participative-linitiative-des-jeunes-de-lest-cameroun",
                status: "active",
                order: 4,
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await queryInterface.bulkInsert("podcasts", initialPodcasts);
    }
}

async function down({context: queryInterface}) {
    await queryInterface.dropTable("podcasts");
}

module.exports = {up, down};

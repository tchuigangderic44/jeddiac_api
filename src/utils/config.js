/*jslint
node
*/
"use strict";

const availableRoles = {
    adminRole: "admin",
    memberRole: "member",
    honoraryMemberRole: "honorary member",
    operationalRole: "operational",
    partnerRole: "partner"
};

const roleList = [
    "admin",
    "member",
    "honorary member",
    "honorary_member",
    "operational",
    "partner"
];

const userStatuses = {
    activated: "active",
    inactive: "desactivated",
    pendingValidation: "pending"
};

const contentStatuses = {
    active: "active",
    suspended: "suspended"
};

const contactStatuses = {
    new: "new",
    read: "read",
    in_review: "in_review",
    archived: "archived",
    replied: "replied",
    validated: "validated"
};

const newsletterStatuses = {
    subscribed: "subscribed",
    unsubscribed: "unsubscribed"
};

const apiSettings = {
    otp: {
        defaultValues: { otp_ttl: 180 },
        options: {
            ttl: "otp_ttl"
        },
        value: "otp-settings"
    }
};

const success = {
    userCreated: {
        message: {
            en: "User created successfully!",
            fr: "Utilisateur créé avec succès!"
        }
    },
    userUpdated: {
        message: {
            en: "User updated successfully!",
            fr: "Utilisateur mis à jour avec succès!"
        }
    },
    userActivated: {
        message: {
            en: "User activated successfully!",
            fr: "Utilisateur activé avec succès!"
        }
    },
    userDeactivated: {
        message: {
            en: "User deactivated successfully!",
            fr: "Utilisateur désactivé avec succès!"
        }
    },
    newsCreated: {
        message: {
            en: "News created successfully!",
            fr: "Actualité créée avec succès!"
        }
    },
    newsUpdated: {
        message: {
            en: "News updated successfully!",
            fr: "Actualité mise à jour avec succès!"
        }
    },
    newsSuspended: {
        message: {
            en: "News suspended successfully!",
            fr: "Actualité suspendue avec succès!"
        }
    },
    newsReactivated: {
        message: {
            en: "News reactivated successfully!",
            fr: "Actualité réactivée avec succès!"
        }
    },
    newsDeleted: {
        message: {
            en: "News deleted successfully!",
            fr: "Actualité supprimée avec succès!"
        }
    },
    agendaCreated: {
        message: {
            en: "Event created successfully!",
            fr: "Événement créé avec succès!"
        }
    },
    agendaUpdated: {
        message: {
            en: "Event updated successfully!",
            fr: "Événement mis à jour avec succès!"
        }
    },
    agendaSuspended: {
        message: {
            en: "Event suspended successfully!",
            fr: "Événement suspendu avec succès!"
        }
    },
    agendaReactivated: {
        message: {
            en: "Event reactivated successfully!",
            fr: "Événement réactivé avec succès!"
        }
    },
    agendaDeleted: {
        message: {
            en: "Event deleted successfully!",
            fr: "Événement supprimé avec succès!"
        }
    },
    missionCreated: {
        message: {
            en: "Mission created successfully!",
            fr: "Mission créée avec succès!"
        }
    },
    missionUpdated: {
        message: {
            en: "Mission updated successfully!",
            fr: "Mission mise à jour avec succès!"
        }
    },
    missionSuspended: {
        message: {
            en: "Mission suspended successfully!",
            fr: "Mission suspendue avec succès!"
        }
    },
    missionReactivated: {
        message: {
            en: "Mission reactivated successfully!",
            fr: "Mission réactivée avec succès!"
        }
    },
    missionDeleted: {
        message: {
            en: "Mission deleted successfully!",
            fr: "Mission supprimée avec succès!"
        }
    },
    articleCreated: {
        message: {
            en: "Article created successfully!",
            fr: "Article créé avec succès!"
        }
    },
    articleUpdated: {
        message: {
            en: "Article updated successfully!",
            fr: "Article mis à jour avec succès!"
        }
    },
    articleSuspended: {
        message: {
            en: "Article suspended successfully!",
            fr: "Article suspendu avec succès!"
        }
    },
    articleReactivated: {
        message: {
            en: "Article reactivated successfully!",
            fr: "Article réactivé avec succès!"
        }
    },
    articleDeleted: {
        message: {
            en: "Article deleted successfully!",
            fr: "Article supprimé avec succès!"
        }
    },
    podcastCreated: {
        message: {
            en: "Podcast created successfully!",
            fr: "Podcast créé avec succès!"
        }
    },
    podcastUpdated: {
        message: {
            en: "Podcast updated successfully!",
            fr: "Podcast mis à jour avec succès!"
        }
    },
    podcastSuspended: {
        message: {
            en: "Podcast suspended successfully!",
            fr: "Podcast suspendu avec succès!"
        }
    },
    podcastReactivated: {
        message: {
            en: "Podcast reactivated successfully!",
            fr: "Podcast réactivé avec succès!"
        }
    },
    podcastDeleted: {
        message: {
            en: "Podcast deleted successfully!",
            fr: "Podcast supprimé avec succès!"
        }
    },
    contactSent: {
        message: {
            en: "Your message has been sent successfully. We will get back to you soon!",
            fr: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais!"
        }
    },
    newsletterSubscribed: {
        message: {
            en: "Successfully subscribed to the newsletter!",
            fr: "Inscription à la newsletter effectuée avec succès!"
        }
    },
    newsletterUnsubscribed: {
        message: {
            en: "Successfully unsubscribed from the newsletter!",
            fr: "Désinscription de la newsletter effectuée avec succès!"
        }
    }
};

const errors = {
    forbiddenAccess: {
        message: {
            en: "You are forbidden from accessing this resource",
            fr: "L'accès à cette ressource vous est interdit"
        },
        status: 403
    },
    notAuthorized: {
        message: {
            en: "You are not authorized to perform this action",
            fr: "Vous n'êtes pas autorisé à effectuer cette action"
        },
        status: 401
    },
    invalidCredentials: {
        message: {
            en: "Invalid email or password",
            fr: "Email ou mot de passe invalide"
        },
        status: 400
    },
    inactiveAccount: {
        message: {
            en: "Your account is not active. Please contact administrator.",
            fr: "Votre compte n'est pas actif. Veuillez contacter l'administrateur."
        },
        status: 403
    },
    nonexistingUser: {
        message: {
            en: "This user does not exist",
            fr: "Cet utilisateur n'existe pas"
        },
        status: 404
    },
    emailAlreadyExists: {
        message: {
            en: "An account with this email already exists",
            fr: "Un compte avec cette adresse email existe déjà"
        },
        status: 409
    },
    notFound: {
        message: {
            en: "Resource not found",
            fr: "Ressource non trouvée"
        },
        status: 404
    },
    invalidValues: {
        message: {
            en: "You provided one or more invalid values",
            fr: "Vous avez fourni une ou plusieurs valeurs invalides"
        },
        status: 400
    },
    internalError: {
        message: {
            en: "Something went wrong while processing your request",
            fr: "Un problème s'est produit lors du traitement de votre demande"
        },
        status: 500
    }
};

function settingReducer(acc, [key, setting]) {
    acc[setting.value] = {
        options: Object.entries(setting.options).reduce(function (
            prev,
            [otp_key, opt_value]
        ) {
            prev[opt_value] = otp_key;
            return prev;
        }, Object.create(null)),
        value: key
    };
    return acc;
}

const config = Object.freeze({
    availableRoles: Object.freeze(availableRoles),
    roleList: Object.freeze(roleList),
    userStatuses: Object.freeze(userStatuses),
    contentStatuses: Object.freeze(contentStatuses),
    contactStatuses: Object.freeze(contactStatuses),
    newsletterStatuses: Object.freeze(newsletterStatuses),
    apiSettings: Object.freeze(apiSettings),
    dbSettings: Object.freeze(Object.entries(apiSettings).reduce(
        settingReducer,
        Object.create(null)
    )),
    getdbConfig() {
        const result = Object.create(null);
        result.password = process.env.DB_PASSWORD ?? null;
        result.port = process.env.db_port;
        result.username = process.env.DB_USER;
        if (process.env.NODE_ENV === "development") {
            result.database = process.env.dev_db;
            return Object.freeze(result);
        }
        if (process.env.NODE_ENV === "production") {
            result.database = process.env.production_db;
            return Object.freeze(result);
        }
        result.database = process.env.test_db;
        return Object.freeze(result);
    },
    tokenTtl: process.env.TOKEN_EXP || 86400,
    success,
    errors
});

module.exports = config;
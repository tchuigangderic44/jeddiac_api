const errors = {
    forbiddenAccess: {
        message: {
            en: "You are forbidden from accessing this resource",
            fr: "L'accès à cette ressource vous est interdit"
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
    inactiveAccount: {
        message: {
            en: "Your account is not active, please contact the administrator",
            fr: "Votre compte n'est pas actif, veuillez contacter l'administrateur"
        },
        status: 403
    },
    internalError: {
        message: {
            en: "Something went wrong while processing your request",
            fr: "Un problème s'est produit lors du traitement de votre demande"
        },
        status: 500
    },
    invalidCredentials: {
        message: {
            en: "You provided invalid authentication credentials",
            fr: "Vous avez fourni des identifiants non valides"
        },
        status: 400
    },
    invalidValues: {
        message: {
            en: "You provided one or many invalid informations",
            fr: "Vous avez fourni une ou plusieurs informations non valides"
        },
        status: 400
    },
    invalidUploadValues: {
        message: {
            en: "You should provide informations you want to update",
            fr: "Vous devez fournir les informations que vous souhaitez mettre à jour"
        },
        status: 400
    },
    notAuthorized: {
        message: {
            en: "You are not authorized to perform this action",
            fr: "Vous n'êtes pas autorisé à effectuer cette action"
        },
        status: 401
    },
    unsupportedType: {
        message: {
            en: "The type you provided is not supported",
            fr: "Le type que vous avez fourni n'est pas pris en charge"
        },
        status: 400
    },
    tokenInvalid: {
        message: {
            en: "Your access key is invalid or expired, please login again",
            fr: "Votre clé d'accès est invalide ou expirée, veuillez vous reconnecter"
        },
        status: 401
    },
    notFound: {
        message: {
            en: "Requested resource was not found",
            fr: "La ressource demandée est introuvable"
        },
        status: 404
    },
    emailExists: {
        message: {
            en: "An account with this email address already exists",
            fr: "Un compte avec cette adresse email existe déjà"
        },
        status: 409
    }
};

module.exports = Object.freeze({
    errors
});
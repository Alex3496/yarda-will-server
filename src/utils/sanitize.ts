
/**
 * @function sanitizeUser
 * @description Takes a Mongoose user document and returns a plain JavaScript object with the password field removed.
 * @param userDoc The Mongoose user document to sanitize.
 * @returns The sanitized user object.
 */
export const sanitizeUser = (userDoc: unknown): Record<string, unknown> => {
    const user = userDoc as { toObject: () => Record<string, unknown> };
    const plainUser = user.toObject();
    delete plainUser.password;
    return plainUser;
};

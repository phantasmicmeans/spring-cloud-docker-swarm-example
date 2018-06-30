
export default function requireFirst(modules, errorMessage) {
    for (let i = 0; i < modules.length; ++i) {
        try {
            return require(modules[i]);
        } catch(err) {
            if (err.code !== "MODULE_NOT_FOUND") {
                throw err;
            }
        }
    }
    throw new Error(errorMessage);
}

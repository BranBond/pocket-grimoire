const through2 = require("through2");
const fs = require("fs");

const cache = Object.create(null);

function getFileContents(path) {

    if (!cache[path]) {

        cache[path] = new Promise((resolve, reject) => {

            fs.readFile(path, (err, data) => {

                if (err) {
                    return reject(err);
                }

                resolve(JSON.parse(data));

            });

        });

    }

    return cache[path];
}

function getBaseJSON(path) {
    return path.slice(0, path.lastIndexOf("/")) + "/base.json";
}

module.exports = () => through2.obj((file, ignore, callback) => {

    const {
        path,
        contents
    } = file;

    // If we don't have a locale file, do nothing and pass the file along.
    if (!(/[a-z]{2}(\-[A-Z]{2})?\.json$/).test(path)) {
        return callback(null, file);
    }

    const json = JSON.parse(contents);

    getFileContents(getBaseJSON(path))
        .catch((err) => callback(err))
        .then((data) => {

            const localised = data.map((role) => {

                return {
                    ...(json.find(({ id }) => id === role.id) || {}),
                    ...role
                };

            });

            // const localised = json.map((role) => {
            //
            //     return {
            //         ...data.find(({ id }) => id === role.id),
            //         ...role
            //     };
            //
            // });

            file.contents = Buffer.from(JSON.stringify(localised));
            callback(null, file);

        });

});

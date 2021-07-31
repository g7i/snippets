const helpers = require('../common/helpers');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const rimraf = require("rimraf");

let CONTENT_PATH = process.env.CONTENT_PATH || "upload-test";

module.exports = function (s3) {

    const arr = req.files.file.name.split(".");
    arr[arr.length - 1] = arr[arr.length - 1].toLowerCase();
    arr[arr.length - 2] = arr[arr.length - 2] + "-" + helpers.generateRandomString(8);
    const fullName = arr.join(".");
    const path = CONTENT_PATH;

    if (req.files.file.mimetype.includes("video")) {

        const fileName = arr.slice(0, -1).join(".") + ".m3u8";

        const dir = helpers.generateRandomString(12);

        if (!fs.existsSync(`/tmp/${dir}`)) {
            fs.mkdirSync(`/tmp/${dir}`);
        }

        let writer = fs.createWriteStream(`/tmp/${fullName}`);
        writer.write(req.files.file.data);

        ffmpeg(`/tmp/${fullName}`)
            .format('hls')
            .outputOptions(
                '-hls_list_size 0'
            )
            .on('end', function (err) {
                fs.unlink(`/tmp/${fullName}`, (err) => {
                    if (err) {
                        console.error(err)
                    }
                }
                );

                const files = fs.readdirSync(`/tmp/${dir}/`);

                for (let i = 0; i < files.length; i++) {

                    const file = fs.readFileSync(`/tmp/${dir}/${files[i]}`)

                    helpers.putObj(s3, file, "bucket", `${path}/${dir}/${files[i]}`)
                        .then(() => {
                        })
                        .catch(err => {
                            console.log('an error happened: ' + err.message);
                        });
                }

                rimraf(`/tmp/${dir}`, (err) => {
                    if (err) {
                        console.error(err)
                    }
                }
                );

                console.log({ url: `https://s3.ap-south-1.amazonaws.com/bucket/${path}/${dir}/${fileName}` });

            })
            .on('error', function (err) {
                console.log('an error happened: ' + err.message);
            })
            .save(`/tmp/${dir}/${fileName}`);

    }

}
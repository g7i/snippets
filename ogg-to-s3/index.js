const helpers = require('../common/helpers');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');

let CONTENT_PATH = process.env.CONTENT_PATH || "upload-test";

module.exports = function (s3, polly) {

    function uploadStream(key) {
        const pass = new stream.PassThrough();
        const params = { Bucket: "", Key: key, Body: pass };

        return {
            writeStream: pass,
            promise: s3.upload(params).promise(),
        };
    }

    const arr = req.files.file.name.split(".");
    arr[arr.length - 1] = arr[arr.length - 1].toLowerCase();
    arr[arr.length - 2] = arr[arr.length - 2] + "-" + helpers.generateRandomString(8);
    const fullName = arr.join(".");
    const path = CONTENT_PATH;

    const fileName = arr.slice(0, -1).join(".") + ".ogg";

    let writer = fs.createWriteStream(`/tmp/${fullName}`);
    writer.write(req.files.file.data);

    const { writeStream, promise } = uploadStream(`${path}/${fileName}`);

    ffmpeg(`/tmp/${fullName}`)
        .toFormat('ogg')
        .on('end', function (err) {
            fs.unlink(`/tmp/${fullName}`, (err) => {
                if (err) {
                    console.error(err)
                }
            }
            );
        })
        .on('error', function (err) {
            console.log('an error happened: ' + err.message);
        })
        .pipe(writeStream, { end: true });

    promise.then(() => {
        console.log({ url: `https://s3.ap-south-1.amazonaws.com/bucket/${path}/${fileName}` });
    }).catch(error => {
        console.log('an error happened: ' + error.message);
    });

}
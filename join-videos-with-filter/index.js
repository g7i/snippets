let audioString = `-an -vf "fade=in:st=0:d=0.5,fade=out:st=${duration - 0.5}:d=0.5"`;

if (video.audio.url) {
    const aud = video.audio.url
        .replace(/:/g, "\\\\:")
        .replace(/\//gi, "\\\\/")
        .replace(/%2F/g, "\\\\/");
    audioString = `-f lavfi -i "amovie='${aud}':sp=${video.audio.startAt}:loop=0,asetpts=N/SR/TB,afade=in:st=0:d=0.5,afade=out:st=${duration - 2}:d=2" -c:a aac -vf "fade=in:st=0:d=0.5,fade=out:st=${duration - 2}:d=2" -map 0:v -map 1:a -shortest`;
}
const mergingAt = Date.now();
// TODO: Add watermark here
// -rtbufsize 100M - adjust write buffer size
// -pix_fmt yuv420p - quicktime support
const command = `ffmpeg -protocol_whitelist concat,file,http,https,tcp,tls,crypto -f concat -safe 0 -thread_queue_size 5120 -i ./videos/${id}/file.txt ${audioString} -r 30 -q:v 1 -preset ultrafast -crf 23 ./videos/${id}/${id}.mp4 -y`;
try {
    await exec(command);
} catch (err) {
    console.error(err);
    fs.rmdirSync(`./videos/${id}`, { recursive: true });
    await updateStatus(null, false);
    return res.status(500).send({ mergeError: err });
}


/**
 * file.txt

file '0.mpg'
file '1.mpg'

*/
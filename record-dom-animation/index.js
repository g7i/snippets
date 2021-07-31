const puppeteer = require("puppeteer-core");
const path = require("path");
const { exec } = require("child_process");

const baseURL = "http://localhost:8080/";

module.exports = async function (id, sceneData, index) {
    const fps = 30;

    console.log("init", index);

    const browser = await puppeteer.launch({
        // headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: "/usr/bin/google-chrome-stable",
        args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    const { height, width } = getDimensions(sceneData.aspectRatio, sceneData.quality);
    await page.setViewport({ height, width })
    page.on("pageerror", (err) => console.error(err));

    await page.goto(baseURL, { waitUntil: "networkidle0", timeout: 0 });

    const animationDuration = await page.evaluate(async (sceneData) => {
        window.setSceneData(sceneData);
        window.handleLoad();
        return window.tl?.duration;
    }, sceneData);

    // await new Promise(resolve => setTimeout(resolve, 20000));

    const tempPath = path.join(__dirname, "videos", id);
    const outFile = path.join(tempPath, index + ".mpg");
    const args = ffmpegArgsY(fps, sceneData);
    args.push(outFile);

    const ffmpeg = exec("ffmpeg " + args.join(" "), {
        maxBuffer: 1024 * 1024 * 1024,
    });

    // ffmpeg.stderr.on('data', function (data) {
    //   console.log("E-DATA", data.toString());
    // });

    const closed = new Promise((resolve, reject) => {
        ffmpeg.on("error", (err) => {
            console.log(err);
            ffmpeg.removeAllListeners();
            reject();
        });
        ffmpeg.on("close", (code) => {
            ffmpeg.removeAllListeners();
            if (code !== 0) {
                reject(`Scene ${sceneData.scene.id} at index ${index} failed.`)
                return
            }
            resolve();
        });
    });

    console.log("starting", index);

    if (!animationDuration) {
        let screenshot = await page.screenshot({
            omitBackground: true,
            type: "png",
        });
        try {
            await write(ffmpeg.stdin, screenshot);
        } catch (e) {
            console.log(e);
        }
    } else {
        for (let current = 0; current <= animationDuration; current += animationDuration / fps / animationDuration * 1000) {
            await page.evaluate(async (current) => {
                window.tl.seek(current);
            }, current);
            let screenshot = await page.screenshot({
                omitBackground: true,
                type: "png",
            });
            try {
                await write(ffmpeg.stdin, screenshot);
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    ffmpeg.stdin.end();
    await browser.close();
    await closed;

    console.log("closed", index);
};

const ffmpegArgsY = (fps, sceneData) => {
    const { scene, aspectRatio, quality } = sceneData;
    const duration = scene.duration;

    const { height: videoHeight, width: videoWidth } = getDimensions(aspectRatio, quality);

    const { url, type, position: { left, top, height, width }, startAt, color } = scene.background;
    const finalWidth = videoWidth / 100 * width;
    const finalHeight = videoHeight / 100 * height;
    const finalLeft = videoWidth / 100 * left;
    const finalTop = videoHeight / 100 * top;

    let filter;
    if (type === 'video')
        filter = `"[1:v] scale=${Math.ceil(finalWidth)}:${Math.ceil(finalHeight)}:force_original_aspect_ratio=increase,crop=${finalWidth}:${finalHeight} [bg];[bg] pad=${videoWidth}:${videoHeight}:${finalLeft}:${finalTop}:0x${color.substring(1)}[pbg];[pbg][0:v] overlay=0:0"`;
    else {
        let zoom = '[bg];';
        if (sceneData.asd) zoom = `[bg22] ; [bg22] scale=-2:10*ih:force_original_aspect_ratio=decrease,zoompan=z='min(zoom+0.001,2.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * 30}:fps=30:s='${Math.ceil(finalWidth)}x${Math.ceil(finalHeight)}' [bg];`;
        filter = `"[1:v] scale=${Math.ceil(finalWidth)}:${Math.ceil(finalHeight)}:force_original_aspect_ratio=increase,crop=${finalWidth}:${finalHeight} ${zoom}[bg] pad=${videoWidth}:${videoHeight}:${finalLeft}:${finalTop}:0x${color.substring(1)}[pbg];[pbg][0:v] overlay=0:0"`;
    }

    let start = '';
    if (type === 'video') start = `-ss ${startAt}`;

    return [
        '-y',
        '-f',
        'image2pipe',
        '-r',
        `${+fps}`,
        '-thread_queue_size',
        '5120',
        '-i',
        '-',
        '-thread_queue_size',
        '5120',
        start,
        '-i',
        `"${url}"`,
        '-s:v',
        `${videoWidth}x${videoHeight}`,
        '-filter_complex',
        filter,
        '-an',
        '-t',
        '00:00:' + (duration < 10) ? '0' + duration.toString() : duration.toString(),
        '-q:v',
        '1',
        '-tune',
        'film',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        23,
    ];
}

const write = (stream, buffer) =>
    new Promise((resolve, reject) => {
        stream.write(buffer, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });


/**
 * @param {number} aspectRatio
 * @param {number} quality
 * @return {{width: number, height: number}}
 */
function getDimensions(aspectRatio = 1, quality = 0) {
    let height, width;
    if (quality === 1) {
        switch (aspectRatio) {
            // vertical
            case 0:
                height = 1920;
                width = 1080;
                break;
            // horizontal
            case 1:
                height = 1080;
                width = 1920;
                break;
            // square - 2
            default:
                height = 1080;
                width = 1080;
                break;
        }
    } else {
        switch (aspectRatio) {
            // vertical
            case 0:
                height = 1280;
                width = 720;
                break;
            // horizontal
            case 1:
                height = 720;
                width = 1280;
                break;
            // square - 2
            default:
                height = 720;
                width = 720;
                break;
        }
    }
    return { height, width };
}



/**
 *
 * Filter for watermark
 *
 *
 *
 *
 *      filter = `"[1:v] scale=${Math.ceil(finalWidth)}:${Math.ceil(finalHeight)}:force_original_aspect_ratio=increase,crop=${finalWidth}:${finalHeight} [bg];[bg] pad=${expectedWidth}:${expectedHeight}:${finalLeft}:${finalTop}:0x${slide.bgColor?.length !== 7 ? "000000" : slide.bgColor.substring(1)}[pbg];[pbg][0:v] overlay=0:0`;
            else
                filter = `"[1:v] scale=${Math.ceil(finalWidth)}:${Math.ceil(finalHeight)}:force_original_aspect_ratio=increase,crop=${finalWidth}:${finalHeight} [bg22]; [bg22] scale=-2:10*ih:force_original_aspect_ratio=decrease,zoompan=z='min(zoom+0.001,2.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * 30}:fps=30:s='${Math.ceil(finalWidth)}x${Math.ceil(finalHeight)}' [bg];[bg] pad=${expectedWidth}:${expectedHeight}:${finalLeft}:${finalTop}:0x${slide.bgColor?.length !== 7 ? "000000" : slide.bgColor.substring(1)}[pbg];[pbg][0:v] overlay=0:0`;
        } else {
            if (slide.bgVideo)
                filter = `"[1:v] scale=${expectedWidth}:${expectedHeight}:force_original_aspect_ratio=increase,crop=${expectedWidth}:${expectedHeight} [bg];[bg][0:v] overlay=0:0`;
            else
                filter = `"[1:v] scale=${expectedWidth}:${expectedHeight}:force_original_aspect_ratio=increase,crop=${expectedWidth}:${expectedHeight} [bg22]; [bg22] scale=-2:10*ih:force_original_aspect_ratio=decrease,zoompan=z='min(zoom+0.001,2.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * 30}:fps=30:s='${expectedWidth}x${expectedHeight}' [bg];[bg][0:v] overlay=0:0`;
        }
        if (showWatermark) filter += `[raw]; [2] scale=-1:${watermarkSize}[wm]; [raw][wm] overlay=W-w-20:H-h-20"`;
        else filter += `"`;
 *
 *
 */




/**
 *
 * Frontend pseudo code
 *
 *
 *
 *  const [sceneData, setSceneData] = useState(null);

    window.setSceneData = setSceneData;

    window.handleLoad = () => {
        const animation = sceneData?.scene?.textBox.animation;
        if (sceneData.scene.duration < 3) return null;
        window.tl = animate(animation, {
            className: 'ml7',
            loop: false,
            autoplay: false,
        });
    }

 *
 *
 *
 */
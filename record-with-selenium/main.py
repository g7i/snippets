import json
import os
import shutil
import subprocess as sp
import time
from multiprocessing import Process

from selenium import webdriver

from overlay import overlay
from video_data import videoArgs, send, videoData, totalSlides

options = webdriver.ChromeOptions()
options.add_argument("--window-size=1920,1080")
options.add_argument("--disable-extensions")
options.add_argument("--headless")
options.add_argument("--start-maximized")
options.add_argument("disable-infobars")

url = 'https://frontenddddd.herokuapp.com/'

prev = time.time()


def abc(index):
    print("started", index)
    driver = webdriver.Chrome(options=options)
    driver.get(url)

    send("Emulation.setDefaultBackgroundColorOverride", driver, {'color': {'r': 0, 'g': 0, 'b': 0, 'a': 0}})
    driver.execute_script('window.setSlide(' + json.dumps(videoData(index)) + ');window.handleLoad();')

    pipe = sp.Popen(videoArgs(index), stdin=sp.PIPE, bufsize=-1)
    current = 0
    for i in range(150):
        driver.execute_script('window.tl.progress(' + str(current) + ');')

        pipe.stdin.write(driver.get_screenshot_as_png())

        current += 1 / 150

    pipe.stdin.close()

    send("Emulation.setDefaultBackgroundColorOverride", driver)  # restore
    driver.quit()

    pipe.wait()
    print("ended", index)

    overlay(index)


if __name__ == "__main__":
    shutil.rmtree('./vids', ignore_errors=False, onerror=None)
    os.mkdir("./vids")
    f = open("./vids/file.txt", "w")
    all_processes = []
    for i in range(totalSlides):
        all_processes.append(Process(target=abc, args=(i,)))
        f.write(f"file '{str(i)}.mov'\n")

    f.close()
    for p in all_processes:
        p.start()

    for p in all_processes:
        p.join()

    print("merging")
    sp.call("ffmpeg -f concat -safe 0 -i './vids/file.txt' -c libx264 './vids/out.mp4' -loglevel quiet -y", shell=True)

print("total", time.time() - prev)





def videoArgs(name):
    return ['ffmpeg',
            '-y',
            '-f', 'image2pipe',
            '-vcodec', 'png',
            '-r', str(30),
            '-i', '-',
            '-vcodec', 'png',
            '-s:v',
            '1920x1080',
            '-qscale', '0',
            '-loglevel', 'quiet',
            "./vids/temp" + str(name) + ".mov"]


def send(cmd, driver, params={}):
    resource = "/session/%s/chromium/send_command_and_get_result" % driver.session_id
    url = driver.command_executor._url + resource
    body = json.dumps({'cmd': cmd, 'params': params})
    response = driver.command_executor._request('POST', url, body)
    return response.get('value')
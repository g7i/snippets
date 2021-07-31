import time

import gizeh as gz
import moviepy.editor as mpy
import textwrap

VIDEO_SIZE = (1280, 720)
BLUE = (59 / 255, 89 / 255, 152 / 255)
GREEN = (176 / 255, 210 / 255, 63 / 255)
WHITE = (255, 255, 255)
DURATION = 5

posX = -300

txt = "Title: Sprouted Kitchen VEGGIE CHILI TAHINI GLAZED CAULIFLOWER TAHINI GLAZED ROASTED CAULIFLOWER FOOD FOR NEW PARENTS : CRUNCHY LUNCHY LENTILS I hope you are finding slivers of that"
txt = textwrap.fill(txt, 50)
def render_text(t):
    global posX
    surface = gz.Surface(600, 120)
    rect = gz.rectangle(fill=(255, 0, 0, 0.5), lx=600, ly=120, xy=(posX, 60))
    text = gz.text(txt, fontfamily="Charter",
        fontsize=30, fontweight='bold', fill=WHITE, xy=(posX, 50))
    if t < 2:
        posX += 600 / 2 / 60
    rect.draw(surface)
    text.draw(surface)
    return surface.get_npimage(transparent=True)


if __name__ == '__main__':
    # clip = mpy.VideoFileClip("https://player.vimeo.com/external/176748917.sd.mp4?s=5378f3ea1ad8ecd7ac65bbaaef225baba873690e&profile_id=164", audio=False).subclip(5, 10).resize(width=1280)
    # clip = mpy.VideoFileClip("https://player.vimeo.com/external/377520762.hd.mp4?s=aa83714c74decca6bde2a43309535ff481588868&profile_id=174", audio=False).subclip(5, 10).resize(width=1280)
    clip = mpy.VideoFileClip("./assets/vid.mp4", audio=False).subclip(5, 10).resize(width=1280)
    # text = mpy.VideoClip(render_text, duration=DURATION)

    w, h = moviesize = clip.size
    my_text = mpy.TextClip(txt, color='white', fontsize=24)
    txt_col = my_text.on_color(size=(my_text.w + 5, my_text.h + 5), color=(0, 0, 0), col_opacity=0.6)
    txt_mov = txt_col.set_pos(lambda t: (max(w / 30, int(w - 0.5 * w * t)), max(5 * h / 6, int(100 * t))))

    graphics_text_mask = mpy.VideoClip(txt_mov, duration=DURATION, ismask=True)
    # graphics_text_mask = mpy.VideoClip(lambda t: render_text(t)[:, :, 3] / 255.0, duration=DURATION, ismask=True)
    graphics_text = mpy.VideoClip(txt_mov, duration=DURATION).set_mask(graphics_text_mask)

    start = time.time()
    video = mpy.CompositeVideoClip([
        clip,
        # my_text
        graphics_text.set_position(('center', 50)),
        # text.set_position(('center', clip.size[1])),
    ]).set_duration(DURATION)
    # ],size=VIDEO_SIZE).on_color(color=WHITE, col_opacity=1).set_duration(DURATION)

    video.write_videofile('try.mp4', fps=30)

    done = time.time()
    print("Elapsed s: ", done - start)

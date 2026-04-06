import os, sys, io
import M5
from M5 import *
from hardware import RGB
from unit import LightUnit
import time



rgb9 = None
light_0 = None


i = None


def setup():
  global rgb9, light_0, i

  M5.begin()
  Widgets.setRotation(0)
  Widgets.fillScreen(0x000000)

  rgb9 = RGB(io=9, n=30, type="SK6812")
  light_0 = LightUnit((10, 9))


def loop():
  global rgb9, light_0, i
  M5.update()
  rgb9.set_brightness(100)
  if (light_0.get_digital_value()) >= 3000:
    for i in range(29):
      rgb9.fill_color(0x000000)
      rgb9.set_color(i, 0xff0000)
      time.sleep_ms(30)

    for i in range(29, -1, -1):
      rgb9.fill_color(0x000000)
      rgb9.set_color(i, 0xff0000)
      time.sleep_ms(30)
  else:
    rgb9.set_brightness(0)


if __name__ == '__main__':
  try:
    setup()
    while True:
      loop()
  except (Exception, KeyboardInterrupt) as e:
    try:
      from utility import print_error_msg
      print_error_msg(e)
    except ImportError:
      print("please update to latest firmware")
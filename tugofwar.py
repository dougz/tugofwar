#!/usr/bin/python3

import argparse
import asyncio
import collections
import json
import os
import time
import unicodedata

import http.client
import tornado.web

import scrum


class GameState:
  BY_TEAM = {}

  ROUND_TIME = 12

  @classmethod
  def set_globals(cls, options):
    cls.wordpairs = (
      ("GODOT", "DAUB", 0),
      ("PESTO", "HOG", 1),
      ("ROPE", "ONCE", 0),
      ("GLANCE", "MODERN", 0),
      ("JOLTS", "UNFOLD", 1),
      ("TICKER", "ROTATE", 1),
      ("SHIMS", "WITH", 1),
      ("PHONE", "PARADISE", 0),
      ("WRAP", "ESCAPE", 1),
      ("MOTH", "CLOUD", 0),
      ("EASY", "SON", 0),
      ("ROD", "IDEA", 0),
      ("OVERSEER", "CRAWFORD", 1),
      ("DRYSTONE", "TEACHER", 1),
      ("ROMEO", "ISLES", 0),
      ("SANEST", "BIDET", 0),
      ("WOUND", "PUB", 1),
      ("FRUITS", "TESLA", 0),
      ("TOWN", "VENEER", 0),
      ("DINAR", "WHINES", 1),
      ("OINKS", "WHIMS", 1),
      ("GRASS", "HEROICS", 1),
      ("VOWEL", "WHEAT", 0),
      ("RIFLE", "THREAD", 0),
      ("FLAMES", "OUTER", 1),
      ("TWIN", "SLOPE", 0),
      ("FORE", "REFINED", 1),
      ("MUSING", "SLUMP", 1),
      ("EROSION", "RENTAL", 0),
      ("STEWED", "EUROS", 0),
      ("FASTED", "FIREMAN", 0),
      ("FLOUR", "FLAIR", 1),
      ("PHILEBUS", "HIPSTER", 0),
      ("MISER", "FELLA", 0),
      ("FACETED", "VORACITY", 1),
      ("BOULDER", "THRONING", 0),
      ("FATE", "FORCE", 1),
      ("MYTHUNGA", "NICHE", 1),
    )
    cls.options = options

  @classmethod
  def get_for_team(cls, team):
    if team not in cls.BY_TEAM:
      cls.BY_TEAM[team] = cls(team)
    return cls.BY_TEAM[team]

  def __init__(self, team):
    self.team = team
    self.sessions = set()
    self.running = False
    self.cond = asyncio.Condition()
    self.current_pair = None

  async def on_wait(self, session):
    async with self.cond:
      if session not in self.sessions:
        self.sessions.add(session)
        self.cond.notify_all()

  async def run_game(self):
    start_text = "Click either button to start!"
    while True:
      self.current_choice = -1
      self.votes = (collections.OrderedDict(),
                    collections.OrderedDict())

      await self.team.send_messages([{"method": "set_buttons",
                                      "left": "Ready!",
                                      "right": "Ready!",
                                      "message": start_text,
                                      "choice": -1}],
                                    sticky=1)
      result, msg = await self.get_selection()
      msg["message"] = "Here we go!"
      await self.team.send_messages([msg])
      await asyncio.sleep(1.0)

      for ch, (leftword, rightword, correct) in enumerate(self.wordpairs):
        deadline = time.time() + self.ROUND_TIME
        self.current_choice = ch
        self.votes = (collections.OrderedDict(),
                      collections.OrderedDict())

        await self.team.send_messages([{"method": "set_buttons",
                                        "left": leftword,
                                        "right": rightword,
                                        "message": "Think happy thoughts!",
                                        "choice": ch,
                                        "end_time": deadline}],
                                      sticky=1)

        result, msg = await self.get_selection(deadline)
        if result == correct:
          msg["message"] = "Correct!"
          msg["matchleft"] = leftword
          msg["matchright"] = rightword
          msg["matchcorrect"] = correct
        elif result == -1:
          msg["message"] = "Out of time!"
        else:
          msg["message"] = "That's not a happy thought!"
          msg["select"] = -1
        await self.team.send_messages([msg])
        await asyncio.sleep(1.0)

        if result != correct: break
      else:
        await self.team.send_messages([{"method": "finish",
                                        "message": "All done!"}])
        await asyncio.sleep(10.0)

        # reached the end
        start_text = "Click either button to start over!"

  async def set_vote(self, session, name, clicked):
    if clicked not in (0, 1): return
    async with self.cond:
      # Remove old vote from either side.
      self.votes[clicked].pop(session, None)
      self.votes[1-clicked].pop(session, None)

      # Add new vote to new side.
      self.votes[clicked][session] = name
      self.cond.notify_all()

  async def get_selection(self, deadline=None):
    async with self.cond:
      while True:
        left_count = len(self.votes[0])
        right_count = len(self.votes[1])
        net = right_count - left_count
        await self.team.send_messages([{"method": "tally",
                                        "left": list(self.votes[0].values()),
                                        "right": list(self.votes[1].values()),
                                        "net": net,
                                        "req": self.options.min_players}])

        if net >= self.options.min_players:
          result = 1
          net = self.options.min_players
          break
        if net <= -self.options.min_players:
          result = 0
          net = -self.options.min_players
          break

        if deadline is None:
          await self.cond.wait()
        else:
          try:
            timeout = deadline - time.time()
            if timeout <= 0: break
            await asyncio.wait_for(self.cond.wait(), timeout)
          except asyncio.TimeoutError:
            # On timeout, take whichever side is ahead.
            if net > 0:
              result = 1
            elif net < 0:
              result = 0
            else:
              result = -1
            break

    return (result, {"method": "tally",
                     "left": list(self.votes[0].values()),
                     "right": list(self.votes[1].values()),
                     "net": net,
                     "req": self.options.min_players,
                     "select": result})


class ClickHandler(tornado.web.RequestHandler):
  def prepare(self):
    self.args = json.loads(self.request.body)

  async def post(self):
    scrum_app = self.application.settings["scrum_app"]
    team, session = await scrum_app.check_cookie(self)
    gs = GameState.get_for_team(team)

    if self.args["choice"] == gs.current_choice:
      clicked = self.args["clicked"]
      who = self.args["who"].strip()
      if not who: who = "anonymous"

      await gs.set_vote(session, who, clicked)

    self.set_status(http.client.NO_CONTENT.value)



class TugOfWarApp(scrum.ScrumApp):
  async def on_wait(self, team, session):
    gs = GameState.get_for_team(team)

    if not gs.running:
      gs.running = True
      self.add_callback(gs.run_game)

    await gs.on_wait(session)


class DebugHandler(tornado.web.RequestHandler):
  def get(self, fn):
    if fn.endswith(".css"):
      self.set_header("Content-Type", "text/css")
    elif fn.endswith(".js"):
      self.set_header("Content-Type", "application/javascript")
    with open(fn) as f:
      self.write(f.read())


def make_app(options):
  GameState.set_globals(options)
  return [
    (r"/tugclick", ClickHandler),
    (r"/tugdebug/(\S+)", DebugHandler),
  ]


def main():
  parser = argparse.ArgumentParser(description="Run the tug of war puzzle.")
  parser.add_argument("-c", "--cookie_secret",
                      default="snellen2020",
                      help="Secret used to create session cookies.")
  parser.add_argument("--socket_path", default="/tmp/tugofwar",
                      help="Socket for requests from frontend.")
  parser.add_argument("--wait_url", default="tugwait",
                      help="Path for wait requests from frontend.")
  parser.add_argument("--main_server_port", type=int, default=2020,
                      help="Port to use for requests to main server.")
  parser.add_argument("--min_players", type=int, default=1,
                      help="Number of players needed to make a choice.")

  options = parser.parse_args()

  app = TugOfWarApp(options, make_app(options))
  app.start()


if __name__ == "__main__":
  main()


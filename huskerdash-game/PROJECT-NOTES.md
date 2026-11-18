# Husker Dash: Project Notes

A Diner Dash-style game about student jobs at UNL, for Multimedia Journalism.
Live link once pushed to GitHub: https://nazarenushm-dot.github.io/huskerdash-game

## What we decided
- Concept: "A Semester at UNL". Each level is a different campus job/shift.
- Defaults (can still change): graphics drawn in code, no official UNL logos or Herbie,
  works with mouse and phone taps, simple sound effects with a mute button.

## Class requirements (and how the game meets them)
1. It has to work: tested start to finish in a browser (all 5 shifts, quizzes, shop, final screen).
2. Connection to the Daily Nebraskan: every shift is based on a real DN story (shown with a link
   before the shift), a "DN News Flash" during each shift changes gameplay, a DN Pop Quiz after
   each shift asks about the story, and a scrolling DN headline ticker runs across the top.
3. Branded + instructions: Husker Dash scarlet & cream branding, How to Play screen, "?" help button
   during play, quick-controls box on every shift screen, on-screen tutorial tips in shifts 1 and 5.
4. Fun: chain bonuses, news-flash rushes and tip bonuses, upgrades, stars, joke headlines.

## Levels and their Daily Nebraskan stories
1. Week 1, Breakfast @ Cather Dining Center: "Food frenzy: a battle of the UNL dining halls"
2. Week 3, Late Night @ Harper Dining Hall: "Dig in to Harper Dining Hall's late night menu"
3. Midterms @ Nebraska Union: "Nebraska Union to open new dining options in spring 2027 after delays"
4. Game Day @ Nebraska Union: "RODRIGUEZ: Nebraska football dominates Bowling Green, but wants more"
5. Finals Week @ Love Library: "University of Nebraska-Lincoln to replace Love Library Dunkin' in 2027" (Nov. 10, 2026)
Also linked (all fall 2026): "What does UNL want in its next chancellor?" ($15.25/hr wage fact in the shop),
"University of Nebraska-Lincoln to open off-campus library" (headline ticker), and
"UNL event planning class to host casino style event during Big Red Finale" (final screen).
Story links and quiz questions are in game.js in the LEVELS list.

## Features
- Customer types: Freshman, Athlete, Grad Student, Study Group, Game Day Fans
- Hearts = patience; happier students tip more
- Chain bonus for doing the same action back-to-back
- Shop with 8 upgrades, most with multiple levels: Running Shoes, Free Coffee, Bigger Tray, Tip Jar,
  Express Kitchen, Faster Menus, Welcome Mat, Lucky Lanyard, Extra Table (up to 3 more tables,
  in a new bottom row) and Big Tables (turn 2-seaters into 4-seaters). Buying upgrades raises your job rank
  (Trainee > Crew Member > Shift Lead > Assistant Manager > Manager).
- Locker: name your worker, pick skin/hair, and buy shirts, hats (incl. a corn hat) and extras.
  A Name Tag shows your name on the floor and in your shift headlines.
- Shop and Locker can be opened from the title screen too.
- End-of-shift buttons: Continue (to the quiz and shop), Redo Shift / Try Again, Menu, and
  Restart Everything (also in the pause menu and on the title screen). Restarting shows a
  confirm screen and can keep your name, skin and hair.
- Progress saves in the browser

## Files
- index.html: the page
- style.css: colors and layout
- game.js: all the game logic (levels are listed near the top in LEVELS)

## Ideas for next time
- Add real reporting: actual dining hall names, quotes or facts from student workers
- Use your own photos/drawings of campus spots
- Adjust difficulty, add more levels or student types

#!/bin/bash

qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript "kmonad"

qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript "$(pwd)/main.js" "kmonad"

qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.start

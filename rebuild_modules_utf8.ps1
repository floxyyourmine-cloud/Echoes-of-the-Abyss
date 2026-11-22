$utf8 = New-Object System.Text.UTF8Encoding($false)
$origPath = "$PSScriptRoot\dungeon_orig_utf8.js"
$lines = [System.IO.File]::ReadAllLines($origPath, $utf8)
Write-Host "Read $($lines.Length) lines from original UTF-8 file."

# 1. dungeon.js (lines 1..2081 -> indices 0..2080)
$dungeonHeader = @"
/* ==========================================================================
   ECHOES OF THE ABYSS - DUNGEON & BOSS ROOMS MODULE
   Lava Rooms, Magma Dungeon, Boss Arena Morvath, Endless Colosseum, and Combat VFX.
   ========================================================================== */
"@
$dungeonBody = $lines[4..2080] # replace old 4-line header with new clean header
$dungeonFinal = @($dungeonHeader) + $dungeonBody
[System.IO.File]::WriteAllLines("$PSScriptRoot\js\dungeon.js", $dungeonFinal, $utf8)
Write-Host "Wrote js/dungeon.js: $($dungeonFinal.Count) lines"

# 2. lobby.js
# Base: lines 2082..2593 (indices 2081..2592)
# Corridor: lines 2927..3166 (indices 2926..3165)
$lobbyHeader = @"
/* ==========================================================================
   ECHOES OF THE ABYSS - LOBBY & CORRIDOR MODULE
   Overworld engine core, WORLD state, pixel art library, Lobby gates,
   and Dungeon Corridor passage with resting camp and NPCs.
   ========================================================================== */
"@
$lobbyBase = $lines[2081..2592]
$corridorBase = $lines[2926..3165]

# Fix corridor guard:
for ($i = 0; $i -lt $corridorBase.Count; $i++) {
    if ($corridorBase[$i] -match '!AREAS\.forest') {
        $corridorBase[$i] = $corridorBase[$i].Replace('!AREAS.forest || ', '')
        Write-Host "Updated corridor guard in lobby.js: $($corridorBase[$i])"
    }
    if ($corridorBase[$i] -match 'const walls = C\.walls = \[\], objs = C\.objs = \[\];') {
        $corridorBase[$i] = "    const walls = C.walls = [], objs = C.objs = [];`n    C.npcs = []; C.torches = []; C.eyes = []; C.fires = []; C.ff = [];"
        Write-Host "Made corridor build idempotent in lobby.js"
    }
}
$lobbyFinal = @($lobbyHeader) + $lobbyBase + $corridorBase
[System.IO.File]::WriteAllLines("$PSScriptRoot\js\lobby.js", $lobbyFinal, $utf8)
Write-Host "Wrote js/lobby.js: $($lobbyFinal.Count) lines"

# 3. forest.js
# Forest: lines 2595..2925 (indices 2594..2924)
# East Gate: lines 3771..3780 (indices 3770..3779)
$forestHeader = @"
/* ==========================================================================
   ECHOES OF THE ABYSS - WHISPERING FOREST MODULE
   Whispering Woods map, wilderness paths, river, camp, sacred shrine,
   gatherables, chests, wildlife, and gate to Lantern Valley Village.
   ========================================================================== */
"@
$forestBase = $lines[2594..2924]
$forestEastGate = $lines[3770..3779]
$forestFinal = @($forestHeader) + $forestBase + $forestEastGate
[System.IO.File]::WriteAllLines("$PSScriptRoot\js\forest.js", $forestFinal, $utf8)
Write-Host "Wrote js/forest.js: $($forestFinal.Count) lines"

# 4. village.js
# Base: lines 3168..3769 (indices 3167..3768)
# Living world + portal: lines 3782..4389 (indices 3781..4388)
$villageHeader = @"
/* ==========================================================================
   ECHOES OF THE ABYSS - LANTERN VALLEY VILLAGE MODULE
   Village map, market, inn, forge, NPCs, dynamic weather & day/night cycle,
   and Ancient Plaza portal teleport to Lobby.
   ========================================================================== */
"@
$villageBase = $lines[3167..3768]
$villageLiving = $lines[3781..4388]
$villageFinal = @($villageHeader) + $villageBase + $villageLiving
[System.IO.File]::WriteAllLines("$PSScriptRoot\js\village.js", $villageFinal, $utf8)
Write-Host "Wrote js/village.js: $($villageFinal.Count) lines"
